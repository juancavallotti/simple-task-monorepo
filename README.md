# Recipes Monorepo

This repository contains a small recipe application built as a monorepo:

- `database`: Postgres image with the recipe schema and entrypoint.
- `backend`: Go workspace for the API, CLI, repository, and shared types.
- `agent`: Go recipe copilot service backed by Gemini and the backend CLI.
- `web`: React Router web app.
- `helm`: Kubernetes chart for Postgres, API, agent, and web.

The root `Taskfile.yml` is the main entrypoint for day-to-day commands.

## Prerequisites

Install these tools before working on the project:

- [Task](https://taskfile.dev/)
- Docker
- Go 1.26 or newer
- Node.js 20 or newer
- npm
- kubectl, Helm, and DevSpace for Kubernetes development/deploys

For agent features, copy the example environment file and set a Gemini key:

```bash
cp agent/.env.example agent/.env
```

Set `GEMINI_API_KEY` in `agent/.env`. DevSpace also reads this value when creating the `recipes-agent` Kubernetes Secret.

## Getting Started

Install dependencies:

```bash
task install
```

Start the local Postgres container in one shell:

```bash
task build:image:db
task db:up
```

Start the API and web dev servers in another shell:

```bash
task dev:local
```

Useful local commands:

```bash
task test
task build:backend
task build:agent
task build:web
task clean
```

Run `task -l` to see all available tasks.

## Container Images

Images are named from `DOCKER_USER`, which defaults to `juancavallotti`:

- `recipes-db`
- `recipes-api`
- `recipes-agent`
- `recipes-web`

Build all images locally:

```bash
task build:images
```

Push the current `TAG` for all images:

```bash
DOCKER_USER=your-dockerhub-user TAG=latest task push:images
```

Build and push release images with both a version tag and `latest`:

```bash
DOCKER_USER=your-dockerhub-user VERSION=x.y.z task release:images
```

If `VERSION` is omitted, the release image task reads the chart version from `helm/Chart.yaml`.

## Kubernetes Development

The DevSpace workflow builds images locally, deploys the Helm chart, creates the agent Secret from `GEMINI_API_KEY`, and starts file sync/dev containers.

```bash
export GEMINI_API_KEY=your-key
task dev
```

DevSpace forwards:

- API: `localhost:4000`
- Agent: `localhost:4100`
- Web: `localhost:3000`

For a deploy without file sync:

```bash
export GEMINI_API_KEY=your-key
task deploy
```

## Helm

Lint and render the chart:

```bash
task helm:lint
task helm:template
```

Package the chart into `dist/`:

```bash
task helm:package
```

Push the packaged chart to Docker Hub OCI after logging in with Helm:

```bash
helm registry login registry-1.docker.io
DOCKER_USER=your-dockerhub-user task helm:push
```

Runtime image repositories and tags live in `helm/values.yaml`. DevSpace overrides them during local Kubernetes development.

## Release Process

Releases are managed with [release-please](https://github.com/googleapis/release-please). The workflow is manual-only and lives at `.github/workflows/release-please.yml`.

Before releasing, make sure the GitHub repository has these secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Use Conventional Commit messages for changes that should appear in release notes:

- `fix: ...` creates a patch release.
- `feat: ...` creates a minor release.
- `feat!: ...` or a `BREAKING CHANGE:` footer creates a major release.

To release:

1. Push your changes to `main`.
2. Open GitHub Actions.
3. Select the `release-please` workflow.
4. Click `Run workflow`.
5. Review and merge the release PR that release-please opens.
6. Run the `release-please` workflow manually again.

On the second run, release-please creates the GitHub release. The workflow then logs in to Docker Hub and runs:

```bash
task release:images
```

That builds and pushes all four runtime images with both the release version and `latest`.

## Notes

- Release-please tracks the last released version in `.release-please-manifest.json` and updates `helm/Chart.yaml` in release PRs.
- The root release-please package uses the Go strategy for changelog generation and treats `helm/Chart.yaml` as an extra release file.
- Local DevSpace image builds intentionally skip pushing images.
