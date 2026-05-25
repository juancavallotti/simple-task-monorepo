# Copilot Reference Architecture

### Built in [Go](https://go.dev/), [Google ADK](https://github.com/google/adk-go), and [React Router](https://reactrouter.com/)

## Tech Stack

- **Backend** — Go API and CLI sharing a Postgres-backed repository.
- **Agent** — Go service built on [Google ADK](https://github.com/google/adk-go) with Gemini (and optional OpenAI / Anthropic models).
- **Web** — [React Router 7](https://reactrouter.com/) app with Tailwind CSS 4 and React 19.
- **Database** — PostgreSQL packaged as a container with the recipe schema baked in.
- **Packaging** — Helm chart for Postgres, API, agent, and web.

## Dev Tooling

- [Task](https://taskfile.dev/) drives day-to-day commands (`task -l` to list them all).
- Docker builds every image locally; no registry round-trip during dev.
- [DevSpace](https://www.devspace.sh/) handles the in-cluster dev loop with file sync and port forwarding.
- [release-please](https://github.com/googleapis/release-please) automates versioning and changelogs from Conventional Commits.

## Monorepo Layout

```
.
├── backend/        Go workspace: API, CLI, repository, shared types
│   ├── api/          HTTP API server (recipes-api) with handlers + structured logging
│   ├── cli/          recipes-cli — the agent's tool surface for reading/writing recipes
│   ├── repo/         Postgres-backed repository, error types, and tests
│   └── types/        Shared domain types imported by api, cli, and agent
├── agent/          Go service built on Google ADK
│   ├── cmd/recipes-agent/   Entry point binary
│   ├── internal/
│   │   ├── app/             Wiring + lifecycle
│   │   ├── config/          Env loading and validation
│   │   ├── copilot/         Conversational copilot loop
│   │   ├── imagegen/        Image generation pipeline (Gemini / OpenAI)
│   │   ├── instruction/     System prompt loader
│   │   ├── modelrouter/     Per-provider model selection (Gemini / OpenAI / Anthropic)
│   │   ├── observability/   slog setup and tracing hooks
│   │   ├── server/          HTTP transport
│   │   ├── skills/          ADK skills exposed to the model
│   │   └── tools/           ADK tool wrappers around recipes-cli
│   └── prompts/             Markdown system prompts
├── web/            React Router 7 + Tailwind 4 frontend
│   └── app/
│       ├── components/    UI components
│       ├── routes/        Route modules
│       ├── state/         Reducer-based state slices
│       └── lib/           Client helpers
├── database/       Postgres image: schema (db.sql) + entrypoint
├── helm/           Helm chart for postgres, backend, agent, and web
├── scripts/        Operational scripts (e.g. ttlsh-publish.sh)
└── Taskfile.yml    Root Task entrypoint that includes each module's tasks
```

Each Go module (`backend/api`, `backend/cli`, `backend/repo`, `backend/types`, `agent`) has its own `go.mod` and is tied together through `backend/go.work`. The `web/` package is a standalone npm workspace. Every module ships its own `Taskfile.yml` that the root taskfile includes and flattens, so root-level tasks like `task build:images` or `task test` fan out into the right place.

## Getting Started

### Prerequisites

- **Docker Desktop** running with **Kubernetes enabled** and the **containerd image store** turned on (Settings → General → "Use containerd for pulling and storing images"). DevSpace pushes images straight into containerd so the cluster can pull them without a registry.
- [Task](https://taskfile.dev/), [DevSpace](https://www.devspace.sh/), `kubectl`, and `helm` on your `PATH`.
- Go 1.26+, Node.js 20+, and npm for local (non-cluster) development.

### Configure environment files

Two services read `.env` files; copy the examples and fill in keys before running anything that touches the agent or the database.

```bash
cp backend/.env.example backend/.env
cp agent/.env.example   agent/.env
```

**`backend/.env`** — Postgres connection (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), optional `API_ADDR` bind, and `BACKEND_LOG_LEVEL`.

**`agent/.env`** — `GEMINI_API_KEY` is required. Optional knobs include:
- `AGENT_MODEL` / `AGENT_IMAGE_MODEL` — Gemini chat and image-gen model IDs.
- `AGENT_IMAGE_GENERATION_CONCURRENCY` — cap on parallel image jobs (default 3, max 4).
- `OPENAI_API_KEY` + `AGENT_OPENAI_MODEL` / `AGENT_OPENAI_IMAGE_MODEL` — enables OpenAI models in the UI.
- `ANTHROPIC_API_KEY` + `AGENT_ANTHROPIC_MODEL` — enables Claude models in the UI.
- `AGENT_IMAGE_OUTPUT_DIR`, `AGENT_INSTRUCTION_PATH`, `AGENT_ADDR`, `AGENT_LOG_LEVEL` — runtime paths, bind address, and log verbosity.
- The same `DB_*` block as the backend (the agent invokes `recipes-cli` against Postgres).

DevSpace and the `publish:ttlsh` script both read these files when materializing Kubernetes Secrets — keep them up to date.

### Run it

Two common loops:

```bash
# In-cluster dev (Docker Desktop Kubernetes): build images, helm install, file sync.
task dev

# Local dev: API + web servers in one shell, Postgres container in another.
task db:up         # start Postgres
task dev:local     # API on :4000, web on :3000
```

DevSpace forwards API → `:4000`, agent → `:4100`, web → `:3000`.

## Task Reference

Root tasks (run `task -l` for the full tree including the per-module subtasks):

| Task                  | What it does                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `install`             | Install web deps and download Go modules across backend and agent.                            |
| `test`                | Run web, backend, and agent tests.                                                            |
| `dev:local`           | Start the API and web dev servers together (assumes Postgres is already running).             |
| `dev`                 | Full DevSpace loop: build images, deploy Helm, sync files into the cluster.                   |
| `deploy`              | Build images and run the DevSpace `deploy` pipeline without file sync.                        |
| `build:images`        | Build all four container images (`recipes-db`, `recipes-api`, `recipes-agent`, `recipes-web`).|
| `push:images`         | Push every image at `TAG` (default `latest`) to `DOCKER_USER`'s Docker Hub namespace.         |
| `publish:ttlsh`       | Push images to ttl.sh (ephemeral registry) and emit a Helm values override. See below.        |
| `release:images`      | Build and push every image tagged with both `VERSION` (from `helm/Chart.yaml`) and `latest`.  |
| `helm:lint` / `helm:template` / `helm:package` / `helm:push` | Lint, render, package the chart into `dist/`, or push it to an OCI registry. |
| `clean` / `clean:full`| Remove build artifacts; `clean:full` also clears installed deps.                              |

### Publishing to ttl.sh

[`scripts/ttlsh-publish.sh`](scripts/ttlsh-publish.sh) (run via `task publish:ttlsh`) re-tags the locally-built images for [ttl.sh](https://ttl.sh) — an anonymous, ephemeral OCI registry where images expire after the TTL in their tag (max 24h) — pushes them, and writes a `temp/values.ttlsh.yaml` override that points the Helm chart at those image refs. It sources secrets from `backend/.env` then `agent/.env` (agent wins on conflicts) and bakes `GEMINI_API_KEY`, optional `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, and Postgres credentials into the generated values file.

```bash
task build:images
TTL=4h task publish:ttlsh
helm upgrade --install recipes helm -f temp/values.ttlsh.yaml
```

Environment knobs: `TTL` (e.g. `30m`, `1h`, `4h`, `24h` — default `4h`), `TAG` (source image tag, default `latest`), `DOCKER_USER`, `TTLSH_PREFIX`, `TTLSH_REGISTRY`, `OUT_FILE`. The output file is gitignored — don't commit it; it contains your API keys.

## Architecture

### Copilot Agent
#### Agent Architecture

The agent runs on its own container. It's built on top of Google ADK's `LLMAgent` abstraction.

<img width="2858" height="1257" alt="image" src="https://github.com/user-attachments/assets/607b5507-725d-4bdb-92bc-bb084098dec9" />

The `LLMAgent` in [agent/internal/copilot/copilot.go](agent/internal/copilot/copilot.go) is composed of three tools, a system prompt assembled from [agent/prompts/](agent/prompts/) plus the skill catalog, and a stack of before/after callbacks:

- **`recipes_cli`** — shells out to the in-container `recipes-cli` binary to read, create, update, and delete recipes. This is the agent's only path to the database; it never speaks SQL directly.
- **`generate_recipe_photo`** — calls the configured image generator (Gemini or OpenAI), writes the output to `AGENT_IMAGE_OUTPUT_DIR`, and returns a handle the CLI then attaches to the recipe. Concurrency is capped by `AGENT_IMAGE_GENERATION_CONCURRENCY`.
- **`issue_ui_actions`** — a structured tool the model calls to ask the browser to do something (navigate to a recipe, refresh the list, open a trace, etc.). The tool simply normalizes and echoes the actions back; the browser is the executor.

A `BeforeModelCallback` ([agent/internal/copilot/context_window.go](agent/internal/copilot/context_window.go)) trims long sessions before they hit the model, and the `observability` callbacks (`ModelCallbacks`, `ToolCallbacks` in [agent/internal/observability/](agent/internal/observability/)) emit structured slog events plus per-turn trace events the UI can replay.

##### Client ↔ Agent context flow for UI actions

The interesting bit is how the browser and the agent stay in sync without the agent ever touching the DOM:

1. The web client opens an SSE stream to the agent's `/run_sse` and sends the user message plus a top-level `modelContext: { agentModel, imageModel }` block.
2. The routing middleware ([agent/internal/server/routing.go](agent/internal/server/routing.go)) extracts and **strips** `modelContext` before forwarding the body to ADK (ADK rejects unknown fields), then picks the right cached agent instance for that combo.
3. The LLM, guided by the system prompt, calls `issue_ui_actions` whenever a turn should produce side effects in the UI — e.g. after a successful recipe create, the agent calls it with `{ type: "navigate_recipe", recipeId: "..." }`.
4. The action result streams back as a normal ADK tool event. The browser ([web/app/lib/agent-ui-actions.ts](web/app/lib/agent-ui-actions.ts)) parses actions from **both** the tool response and a fallback `<ui_actions>` block in assistant text (the latter is there for models that prefer prose to function calls).
5. The chat hook ([web/app/components/agent-chat/use-agent-chat.ts](web/app/components/agent-chat/use-agent-chat.ts)) dispatches the actions through React Router — navigating, refreshing loaders, or opening trace views — and renders a chip per executed action so the user can see what the agent did.

Because the action set is a closed enum (`navigate_recipe`, `navigate_recipe_list`, `navigate_trace`, `navigate_traces_list`, `refresh_current_screen`), the agent can't drive the UI into an undefined state, and the browser can ignore any action it doesn't understand.

#### Model Routing

To support multiple models, the architecture instantiates agents wired with the right model combinations on demand, and plugs in the shared short-term memory, tools, and skills.

<img width="2190" height="976" alt="image" src="https://github.com/user-attachments/assets/4aafae74-cd4f-4eab-9101-520db5e7c47c" />

The router is two pieces working together:

- **`Registry`** ([agent/internal/modelrouter/registry.go](agent/internal/modelrouter/registry.go)) is built once at boot. It inspects the config and registers an `AgentBuilder` and/or `ImageBuilder` per provider — Google is mandatory; OpenAI and Anthropic light up automatically when their API keys are set. Each registered model gets a stable ID of the form `provider:model` (e.g. `google:gemini-3.1-flash-lite`, `anthropic:claude-haiku-4-5`) and an `AgentOption` / `ImageOption` the web app fetches at startup to populate the model picker.
- **`Router`** ([agent/internal/modelrouter/router.go](agent/internal/modelrouter/router.go)) takes a `Selection{AgentID, ImageID}` per request, resolves empty fields to registry defaults, and returns a cached `*adkrest.Server` for that combo. The cache uses `sync.Map` + `sync.Once`, so the heavy work (building the LLM client, the image generator, the `LLMAgent`, and the ADK server) happens at most once per combo.

Critically, every cached `adkrest.Server` is constructed with the **same** `SessionService`, `MemoryService`, and `ArtifactService` instances. That means a user can switch from Gemini to Claude mid-conversation and the new agent picks up the existing session, short-term memory, and any generated artifacts (e.g. recipe photos) without losing context. The only thing that changes is which LLM (and which image model) the next turn runs against.

The wire format is intentionally minimal: the client sends `modelContext` on the request body, the routing middleware strips it before ADK sees it, and the rest of the request is a stock ADK `/run` or `/run_sse` payload. No custom headers, no per-model routes, no client-side awareness of providers beyond the IDs the registry advertises.

### Semantic Search

Recipe and event search is powered by vector embeddings stored in Postgres via the [pgvector](https://github.com/pgvector/pgvector) extension. The schema in [database/db.sql](database/db.sql) declares `recipe_embeddings` and `event_embeddings` tables holding 768-dim vectors with HNSW cosine-similarity indexes.

The [embeddings package](backend/repo/internal/embeddings/client.go) wraps two providers — Gemini and OpenAI — and picks one at startup based on `EMBEDDING_PROVIDER` and which API key (`GEMINI_API_KEY` / `OPENAI_API_KEY`) is set. With no key it falls back to a no-op client so local dev still builds; search endpoints then return `503` with `search disabled` until a key is configured.

On every recipe write the repository fires an async re-index ([embeddings.go:136](backend/repo/internal/dbops/recipes/embeddings.go#L136)) that chunks the recipe into summary / ingredients / directions, embeds each chunk, and replaces its rows transactionally. A `recipes-cli reindex` command exists for backfills and bulk re-embeds.

At query time ([search.go](backend/api/handlers/search.go)) the API embeds the user's query, runs a cosine-distance lookup against the chunk vectors, takes the best chunk per recipe, and hydrates results. A slim variant (`SearchRecipeChunks`) returns just `id / name / chunk / score` — used by the agent CLI to keep model context small.

### Kubernetes Topology

The Helm chart in [helm/](helm/) ships four workloads plus optional ingress:

- **postgres** — `StatefulSet` with a `PersistentVolumeClaim` for `/var/lib/postgresql/data`, fronted by a headless `ClusterIP` Service. Credentials and database name come from a generated `Secret`. A one-shot `Job` runs the schema migration on install/upgrade.
- **backend** — `Deployment` running `recipes-api`, exposed in-cluster as a `ClusterIP` Service. Reads Postgres creds from the postgres Secret.
- **agent** — `Deployment` running `recipes-agent`, exposed in-cluster as a `ClusterIP` Service on port `4100`. Provider keys (`GEMINI_API_KEY`, optional `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`) are mounted from the `recipes-agent` Secret. A scratch `emptyDir` (`/agent-images`, 100Mi) holds generated images before they're attached to recipes.
- **web** — `Deployment` running the React Router SSR server behind a `NodePort` Service (port `3000`). Server-side loaders call the backend Service in-cluster; override with `web.recipesApiBase` if needed.

Ingress is opt-in (`ingress.enabled=true`, default class `nginx`, host `recipes.local`). When enabled, a single `Ingress` resource routes:

| Path      | Service        | Port   |
| --------- | -------------- | ------ |
| `/agent`  | agent Service  | `4100` |
| `/`       | web Service    | `3000` |

The `/agent` route carries SSE traffic, so the chart sets `nginx.ingress.kubernetes.io/proxy-read-timeout`, `proxy-send-timeout`, and `proxy-buffering: off` to keep long-lived streaming responses flowing.

```
                           ┌───────────────────────┐
              recipes.local│      Ingress (nginx)  │
              ─────────────▶                       │
                           └──────┬──────────┬─────┘
                              /          /agent
                              ▼              ▼
                      ┌──────────────┐  ┌──────────────┐
                      │ web Service  │  │ agent Service│
                      │   :3000      │  │    :4100     │
                      └──────┬───────┘  └──────┬───────┘
                             │                 │
                      ┌──────▼───────┐  ┌──────▼───────┐
                      │ web Pod (SSR)│  │  agent Pod   │
                      └──────┬───────┘  └──────┬───────┘
                             │ in-cluster      │ recipes-cli
                             ▼                 ▼
                          ┌──────────────────────┐
                          │   backend Service    │
                          │        :4000         │
                          └──────────┬───────────┘
                                     ▼
                              ┌──────────────┐
                              │ backend Pod  │
                              └──────┬───────┘
                                     ▼
                              ┌──────────────┐
                              │  postgres    │
                              │ StatefulSet  │
                              └──────────────┘
```

## Release Process

Releases are managed with [release-please](https://github.com/googleapis/release-please) via [`.github/workflows/release-please.yml`](.github/workflows/release-please.yml), which runs on every push to `main`. Use Conventional Commit messages — `feat:` cuts a minor, `fix:` a patch, `feat!:` or a `BREAKING CHANGE:` footer a major. The bot opens a release PR that updates `CHANGELOG.md`, `.release-please-manifest.json`, and `helm/Chart.yaml`; merging it tags the release. Container images are not published automatically — run `task release:images` once the release PR is merged.
