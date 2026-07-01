# DevBoard

A production-grade collaborative project and task management platform,
inspired by Linear and Jira. Built as a portfolio project to demonstrate
professional full-stack engineering — a Rust GraphQL API and a Next.js web app.

## Architecture

```mermaid
flowchart TB
    subgraph client["Client"]
        WEB["Next.js App<br/>(app/)"]
    end

    subgraph api["API Layer"]
        GQL["GraphQL<br/>(Axum + async-graphql)"]
    end

    subgraph app_layer["Application Layer"]
        SVC["Service Layer<br/>(auth, project, task)"]
    end

    subgraph infra["Infrastructure"]
        REPO["Repository Layer<br/>(SeaORM)"]
        DB[("PostgreSQL")]
    end

    subgraph shared["Shared Crates"]
        DOM["Domain Types"]
        AUTH["Auth<br/>(JWT + Argon2)"]
    end

    WEB --> GQL
    GQL --> SVC
    SVC --> REPO
    REPO --> DB
    GQL -.-> AUTH
    SVC --> DOM
    REPO --> DOM
    AUTH --> DOM
```

The backend is split into separate Cargo crates. The compiler enforces layer
boundaries — the GraphQL crate physically cannot import SeaORM entities.
The frontend in `app/` talks to the API over GraphQL and shares no code with Rust.

## Stack

| Layer | Technology |
|---|---|
| API | `axum`, `async-graphql` |
| ORM | `sea-orm` |
| Database | PostgreSQL 17 |
| Auth | `argon2` + `jsonwebtoken` |
| Async runtime | `tokio` |
| Observability | `tracing` |
| Frontend | Next.js 16, React 19, TypeScript |
| Frontend tooling | Biome (lint + format), Tailwind CSS, shadcn/ui |

## Features

- Multi-tenant architecture (Organizations → Teams → Projects → Tasks)
- Role-based access control (RBAC) with team-level inheritance
- GraphQL API with queries, mutations, and subscriptions
- JWT authentication with Argon2id password hashing
- N+1 prevention via DataLoaders
- Atomic per-project sequential task numbering (DEV-1, DEV-2...)
- Structured JSON logging with `tracing`
- Database migrations via `sea-orm-migration`
- Graceful shutdown with in-flight request draining

## Quick Start

Install [just](https://github.com/casey/just) (task runner) and [Node.js 20+](https://nodejs.org/), then from the repo root:

```bash
# First-time setup: .env, git hooks, Postgres, migrations, npm install
just setup

# Full stack: Postgres + API (:8080) + Next.js (:3000)
just dev-full
```

| URL | Service |
|---|---|
| http://localhost:3000 | Next.js web app |
| http://localhost:8080/playground | GraphQL Playground |
| http://localhost:8080/graphql | GraphQL API |

API only (no frontend):

```bash
just dev
```

Frontend only (API already running elsewhere):

```bash
just web-dev
```

List all available commands:

```bash
just --list
```

### Manual setup (without just)

```bash
docker compose up -d
cp .env.example .env   # set JWT_SECRET (32+ chars) and DATABASE_URL
cargo run              # applies migrations on startup
```

For production-style Docker deployment, see `just docker-up-prod` or `docker compose -f docker-compose.prod.yml up -d`.

## Task Runner (`just`)

The [`Justfile`](Justfile) wraps backend, frontend, CI, and deployment workflows. It loads `.env` automatically (`set dotenv-load`).

### Backend

| Recipe | Description |
|---|---|
| `just setup` | First-time setup: hooks, `.env`, Postgres, migrations, `npm ci` in `app/` |
| `just dev` | Postgres → migrate → run API only |
| `just dev-full` | Postgres → migrate → API + Next.js dev servers |
| `just run` | Run the API (`cargo run`) |
| `just db-up` / `just db-down` | Start or stop test Postgres (`docker compose`) |
| `just ensure-db` | Wait until Postgres accepts connections |
| `just migrate` | Apply pending SeaORM migrations |
| `just migrate-status` | Show migration status |
| `just migrate-reset` | Roll back all migrations |
| `just migrate-fresh` | Drop all tables and reapply migrations |
| `just migrate-refresh` | Roll back and reapply all migrations |
| `just migrate-generate <name>` | Generate a new migration file |
| `just generate-entities` | Regenerate SeaORM entities from DB schema (requires `sea-orm-cli`) |
| `just test-unit` | Unit tests (`devboard-domain`, `devboard-service`, `devboard-auth`) |
| `just test-integration` | Integration tests (starts Postgres, runs ignored tests) |
| `just test-all` | Unit + integration tests |
| `just test-workspace` | All workspace tests (integration tests stay ignored) |
| `just fmt` / `just fmt-check` | Format Rust / check Rust formatting |
| `just lint` | Clippy with `-D warnings` |
| `just check` | `cargo check --all-targets --all-features` |
| `just build` / `just build-release` | Debug or release Rust build |
| `just docker-build` | Build API Docker image (`devboard:local`) |
| `just docker-up-prod` / `just docker-down-prod` | Start or stop production compose stack |
| `just clean` / `just clean-all` | Remove build artifacts / stop Postgres and clean |
| `just check-deps` | Compile check plus optional `cargo-audit` / `cargo-outdated` |
| `just hooks` | Install git hooks (`core.hooksPath .githooks`) |

### Frontend (`app/`)

| Recipe | Description |
|---|---|
| `just web-install` | `npm ci` in `app/` |
| `just web-dev` | Next.js dev server (`npm run dev`) |
| `just web-lint` | Biome check (lint + format) |
| `just web-fmt` | Biome format (write) |
| `just web-fmt-check` | Biome format (check only) |
| `just web-typecheck` | TypeScript (`tsc -b`) |
| `just web-build` | Production Next.js build |
| `just web-ci` | Lint + typecheck (matches pre-commit frontend checks) |

### Full CI locally

```bash
just ci    # Rust checks + unit tests + frontend checks (scripts/ci-checks.sh + ci-web-checks.sh)
```

Migrations use the SeaORM migration CLI via `cargo run -p migration -- <command>`. The API also runs migrations automatically on startup.

Local Postgres defaults to port **5433** (`docker-compose.yml`) to avoid clashing with other Postgres instances on 5432. Override with `DATABASE_URL` / `TEST_DATABASE_URL` in `.env`.

Optional tooling for entity generation:

```bash
cargo install sea-orm-cli --version 2.0.0-rc.41
```

## Project Structure
devboard/
├── app/                     # Next.js frontend (Biome, Tailwind, shadcn/ui)
├── Justfile                 # Task runner recipes (API, web, test, CI, Docker)
├── .githooks/               # Git pre-commit and pre-push hooks (CI parity)
├── scripts/
│   ├── ci-checks.sh         # Rust checks for hooks / local CI
│   └── ci-web-checks.sh     # Frontend checks for hooks / local CI
├── docker-compose.yml       # Local Postgres for dev/tests (port 5433)
├── docker-compose.prod.yml  # Production API + Postgres stack
├── src/main.rs              # API binary entry point
└── crates/
    ├── domain/              # Pure domain types, RBAC logic (no I/O)
    ├── db/                  # SeaORM entities and migrations
    ├── auth/                # Argon2 hashing, JWT signing/verification
    ├── config/              # Typed config from environment variables
    ├── repository/          # Repository traits + Postgres implementations
    ├── service/             # Business logic and authorization
    └── graphql/             # async-graphql schema, resolvers, DataLoaders

## Running Tests

With `just`:

```bash
just test-unit          # fast unit tests (no database)
just test-integration   # Postgres + integration tests
just test-all           # both
just ci                 # full CI parity locally
```

Or run manually:

```bash
# Unit tests (no database required)
cargo test -p devboard-domain
cargo test -p devboard-service
cargo test -p devboard-auth

# Integration tests (requires Postgres)
just db-up              # or: docker compose up -d
cargo test --test integration_test -- --ignored
```

Integration tests use `TEST_DATABASE_URL` when set, otherwise default to
`postgres://devboard:devboard@localhost:5433/devboard_test` (matching `docker-compose.yml`).
Port 5433 is used locally to avoid conflicting with other Postgres instances on 5432.

## Git Hooks

Git hooks mirror the CI pipeline so commits and pushes are checked locally before they reach GitHub.

| Hook | When | What runs |
|---|---|---|
| `pre-commit` | Every `git commit` | **Rust:** fmt, check, Clippy, unit tests (`scripts/ci-checks.sh`). **Frontend:** Biome + TypeScript when `app/` files are staged (`scripts/ci-web-checks.sh`) |
| `pre-push` | Every `git push` | Integration tests (requires Postgres via `docker compose up -d`) |

Pre-commit frontend checks are **skipped** when no staged files are under `app/`. Run `just web-install` once so `node_modules` exists.

Hooks map to [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

| CI job | Local equivalent |
|---|---|
| Check & Lint | `scripts/ci-checks.sh` (pre-commit) |
| Unit Tests | `scripts/ci-checks.sh` (pre-commit) |
| Frontend Check | `scripts/ci-web-checks.sh` (pre-commit, staged `app/` only) + full build in CI |
| Integration Tests | pre-push hook |

### One-time setup

Run `just setup` (installs hooks, creates `.env`, starts Postgres, runs migrations, `npm ci`) or configure hooks manually:

```bash
just hooks
# or:
chmod +x scripts/ci-checks.sh scripts/ci-web-checks.sh .githooks/pre-commit .githooks/pre-push
git config core.hooksPath .githooks
```

Confirm hooks are active:

```bash
git config core.hooksPath
# .githooks
```

Each developer runs the setup once per clone. The hook files are version-controlled; only `core.hooksPath` is local.

### Run the same checks manually

```bash
just ci                 # recommended — Rust + frontend

# or step by step:
bash scripts/ci-checks.sh
bash scripts/ci-web-checks.sh   # always runs; pre-commit skips if no staged app/ changes
just web-build                  # Next.js build (CI only, not pre-commit)
just test-integration
```

### Skipping hooks (emergency only)

```bash
git commit --no-verify
git push --no-verify
```

To skip integration tests on push without disabling the hook entirely:

```bash
SKIP_INTEGRATION=1 git push
```

## Environment Variables

### API (`.env` at repo root)

| Variable | Required | Default (via `just`) | Description |
|---|---|---|---|
| `DATABASE_URL` | ✓ | `postgres://devboard:devboard@localhost:5433/devboard_test` | Postgres connection string (API runtime) |
| `TEST_DATABASE_URL` | | same as above | Postgres for integration tests |
| `JWT_SECRET` | ✓ | dev placeholder in `Justfile` | JWT signing secret (min 32 chars) — **set a real secret in `.env` for non-local use** |
| `SERVER_HOST` | | `0.0.0.0` | API bind address |
| `SERVER_PORT` | | `8080` | API bind port |
| `RUST_LOG` | | `devboard=info` | Log filter |

### Frontend (`app/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | | `http://localhost:8080/graphql` | GraphQL endpoint for the Next.js app |

Create `app/.env.local` for local overrides (e.g. `NEXT_PUBLIC_API_URL`). Never commit secrets in that file.

## GraphQL Schema Highlights

```graphql
type Query {
  me: User!
  project(id: ID!): Project!
  projects: [Project!]!
  tasks(projectId: ID!, status: TaskStatus): [Task!]!
  task(id: ID!, projectId: ID!): Task!
}

type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  createProject(input: CreateProjectInput!): Project!
  createTask(input: CreateTaskInput!): Task!
  updateTaskStatus(input: UpdateTaskStatusInput!): Task!
  assignTask(input: AssignTaskInput!): Task!
  deleteTask(taskId: ID!, projectId: ID!): Boolean!
}

type Subscription {
  taskUpdated(projectId: ID!): Task!
}
