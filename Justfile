set dotenv-load := true
set dotenv-path := ".env"

test_db_url := env_var_or_default("TEST_DATABASE_URL", "postgres://devboard:devboard@localhost:5433/devboard_test")
database_url := env_var_or_default("DATABASE_URL", test_db_url)
jwt_secret := env_var_or_default("JWT_SECRET", "dev-secret-that-is-long-enough-32ch")

set shell := ["bash", "-cu"]


default:
    @just --list

# dev - API only
# dev-full - API + Next

# First-time setup
setup: hooks env db-up ensure-db migrate web-install
    @echo "Setup complete. Run: just dev-full"

hooks:
    chmod +x scripts/ci-checks.sh scripts/ci-web-checks.sh .githooks/pre-commit .githooks/pre-push
    git config core.hooksPath .githooks

env: 
    @test -f .env || cp .env.example .env
    @echo ".env ready (edit JWT_SECRET / DATABASE_URL if needed)"

# Database
db-up:
    docker compose up -d

db-down:
    docker compose down

db-reset-volumes:
    docker compose down -v

db-logs: 
    docker compose logs -f postgres

ensure-db:
    @echo "waiting for Postgres at {{test_db_url}}"
    @until docker exec devboard-test-postgres pg_isready -U devboard -d devboard_test >/dev/null 2>&1; do sleep 1; done
    @echo "Postgres is ready."

# Migrations
migrate:
    DATABASE_URL="{{database_url}}" cargo run -p migration -- up
    
migrate-status:
    DATABASE_URL="{{database_url}}" cargo run -p migration -- status

migrate-reset:
    DATABASE_URL="{{database_url}}" cargo run -p migration -- reset

migrate-fresh:
    DATABASE_URL="{{database_url}}" cargo run -p migration -- fresh

migrate-refresh:
    DATABASE_URL="{{database_url}}" cargo run -p migration -- refresh

migrate-generate name:
    DATABASE_URL="{{database_url}}" cargo run -p migration -- generate {{name}}

# Pull schema and generate entities + seaography bindings for PostgreSQL
generate-entities:
    @command -v sea-orm-cli >/dev/null || {echo "Install: cargo install sea-orm-cli --version 2.0.0-rc.41"; exit 1; }
    sea-orm-cli generate entity \
    -u {{database_url}} \
    -o crates/db/src/entities \
    --with-serde both \
    --date-time-crate-chrono

run: 
    DATABASE_URL="{{database_url}}" JWT_SECRET="{{jwt_secret}}" cargo run

dev: db-up ensure-db migrate run

# Full stack: Postgres + API + Next
dev-full: db-up ensure-db migrate
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    DATABASE_URL="{{database_url}}" JWT_SECRET="{{jwt_secret}}" cargo run &
    cd {{app_dir}} && npm run dev &
    wait

# Tests
test-unit:
    cargo test -p devboard-domain
    cargo test -p devboard-service
    cargo test -p devboard-auth

test-integration: db-up ensure-db
    TEST_DATABASE_URL="{{test_db_url}}" cargo test --test integration_test -- --ignored

test-all: test-unit test-integration
    @echo "All tests passed."

test-workspace:
    cargo test --workspace

# Quality checks
fmt:
    cargo fmt --all

fmt-check:
    cargo fmt --all -- --check

lint:
    cargo clippy --all-targets --all-features -- -D warnings

check: 
    cargo check --all-targets --all-features

ci: fmt-check lint check test-workspace
    bash scripts/ci-checks.sh
    bash scripts/ci-web-checks.sh
    @echo "All CI checks passed."

# Build
build:
    cargo build --workspace

build-release:
    cargo build --workspace --release

docker-build:
    docker build -t devboard:local .

docker-up-prod:
    docker compose -f docker-compose.prod.yml up -d --build

docker-down-prod:
    docker compose -f docker-compose.prod.yml down

# Maintenance
clean:
    cargo clean

clean-all: clean db-down
    @echo "Cleaned build artifacts and stopped test Postgres."

check-deps:
    cargo check --all-targets --all-features --workspace
    @command -v cargo-audit >/dev/null && cargo audit || echo "Optional: cargo install cargo-audit"
    @command -v cargo-outdated >/dev/null && cargo outdated || echo "Optional: cargo install cargo-outdated"


app_dir := "app"

# Frontend

web-install:
    cd {{app_dir}} && npm ci

web-dev:
    cd {{app_dir}} && npm run dev

web-lint:
    cd {{app_dir}} && npm run lint

web-fmt:
    cd {{app_dir}} && npm run format

web-fmt-check:
    cd {{app_dir}} && npm run format:check

web-typecheck:
    cd {{app_dir}} && npm run type-check

web-build:
    cd {{app_dir}} && npm run build

web-ci: web-lint web-typecheck
    @echo "Frontend CI checks passed."