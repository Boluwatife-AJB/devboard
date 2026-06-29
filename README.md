# DevBoard

A production-grade collaborative project and task management API,
inspired by Linear and Jira. Built as a portfolio project to demonstrate
professional Rust backend engineering.

## Architecture

```mermaid
flowchart TB
    subgraph api["API Layer"]
        GQL["GraphQL<br/>(Axum + async-graphql)"]
    end

    subgraph app["Application Layer"]
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

    GQL --> SVC
    SVC --> REPO
    REPO --> DB
    GQL -.-> AUTH
    SVC --> DOM
    REPO --> DOM
    AUTH --> DOM
```

Each layer is a separate Cargo crate. The compiler enforces layer
boundaries — the GraphQL crate physically cannot import SeaORM entities.

## Stack

| Concern | Crate |
|---|---|
| Web framework | `axum` |
| GraphQL | `async-graphql` |
| ORM | `sea-orm` |
| Database | PostgreSQL 17 |
| Auth | `argon2` + `jsonwebtoken` |
| Async runtime | `tokio` |
| Observability | `tracing` |

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

```bash
# Start the database
 docker compose -f docker-compose.prod.yml up -d postgres

 # Create a .env file (see "Environment Variables" below)
 # and set JWT_SECRET to a random 32+ character string.
 
 # Run (applies migrations automatically on startup)
 cargo run

# GraphQL Playground available at:
# http://localhost:8080/playground
```

## Project Structure
devboard/

├── src/main.rs              # Binary entry point — wires all layers
└── crates/
    ├── domain/              # Pure domain types, RBAC logic (no I/O)
    ├── db/                  # SeaORM entities and migrations
    ├── auth/                # Argon2 hashing, JWT signing/verification
    ├── config/              # Typed config from environment variables
    ├── repository/          # Repository traits + Postgres implementations
    ├── service/             # Business logic and authorization
    └── graphql/             # async-graphql schema, resolvers, DataLoaders

## Running Tests

```bash
# Unit tests (no database required)
cargo test --workspace

# Domain layer tests only (fast, zero dependencies)
cargo test -p devboard-domain

# Service layer tests (fake repositories, no database)
cargo test -p devboard-service

# Integration tests (requires Postgres — see below)
docker compose up -d
cargo test --test integration_test -- --ignored
```

Integration tests use `TEST_DATABASE_URL` when set, otherwise default to
`postgres://devboard:devboard@localhost:5433/devboard_test` (matching `docker-compose.yml`).
Port 5433 is used locally to avoid conflicting with other Postgres instances on 5432.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✓ | — | Postgres connection string (app runtime) |
| `TEST_DATABASE_URL` | | `localhost:5433/devboard_test` | Postgres for integration tests |
| `JWT_SECRET` | ✓ | — | JWT signing secret (min 32 chars) |
| `SERVER_HOST` | | `0.0.0.0` | Bind address |
| `SERVER_PORT` | | `8080` | Bind port |
| `RUST_LOG` | | `devboard=info` | Log filter |

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
