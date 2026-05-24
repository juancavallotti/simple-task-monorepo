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

_To be written._

## Release Process

Releases are managed with [release-please](https://github.com/googleapis/release-please) via [`.github/workflows/release-please.yml`](.github/workflows/release-please.yml), which runs on every push to `main`. Use Conventional Commit messages — `feat:` cuts a minor, `fix:` a patch, `feat!:` or a `BREAKING CHANGE:` footer a major. The bot opens a release PR that updates `CHANGELOG.md`, `.release-please-manifest.json`, and `helm/Chart.yaml`; merging it tags the release. Container images are not published automatically — run `task release:images` once the release PR is merged.
