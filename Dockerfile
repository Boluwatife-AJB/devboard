FROM rust:1.94-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libssl-dev \
    ca-certificates \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY crates/domain/Cargo.toml crates/domain/
COPY crates/db/Cargo.toml crates/db/
COPY crates/auth/Cargo.toml crates/auth/
COPY crates/config/Cargo.toml crates/config/
COPY crates/service/Cargo.toml crates/service/
COPY crates/repository/Cargo.toml crates/repository/
COPY crates/graphql/Cargo.toml crates/graphql/
COPY crates/cache/Cargo.toml crates/cache/
COPY crates/email/Cargo.toml crates/email/
COPY crates/presence/Cargo.toml crates/presence/
COPY migration/Cargo.toml migration/

RUN for crate in domain db auth config service repository graphql cache email presence; do \
        mkdir -p "crates/$crate/src" && \
        echo "" > "crates/$crate/src/lib.rs"; \
    done && \
    mkdir -p migration/src && echo "" > migration/src/lib.rs && \
    mkdir -p src && echo "fn main() {}" > src/main.rs

RUN cargo build --release 2>/dev/null || true

COPY crates/ crates/
COPY migration/ migration/
COPY src/ src/

RUN find . -name "*.rs" -exec touch {} + \
    && cargo build --release

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    curl \
    libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -ms /bin/bash devboard

WORKDIR /app

COPY --from=builder /app/target/release/devboard /app/devboard

USER devboard

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/app/devboard"]