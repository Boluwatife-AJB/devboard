FROM rust:1.94-slim-bookworm As builder

RUN apt-get update && apt-get install -y      --no-install-recommends \
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

RUN for crate in domain db auth config service repository graphql; do \
        mkdir -p "crates/$crate/src" && \
        echo "fn main() {}" > "crates/$crate/src/lib.rs"; \
    done && \
    mkdir -p src && echo "fn main() {}" > src/main.rs

RUN cargo build --release 2>/dev/null || true

COPY crates/ crates/
COPY src/ src/

RUN find . -name "*.rs" -exec touch {} +

RUN cargo build --release

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