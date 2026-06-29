#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "==> cargo fmt --check"
cargo fmt --all -- --check

echo "==> cargo check --all-targets --all-features"
cargo check --all-targets --all-features

echo "==> cargo clippy (deny warnings)"
cargo clippy --all-targets --all-features -- -D warnings

echo "==> unit tests"
cargo test -p devboard-domain
cargo test -p devboard-service
cargo test -p devboard-auth

echo "All CI checks passed."