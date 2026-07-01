#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
APP="$ROOT/app"

if ! git diff --cached --name-only | grep -q '^app/'; then
  echo "No staged app/ changes — skipping frontend checks"
  exit 0
fi

cd "$APP"

if [[ ! -d node_modules ]]; then
  echo "Run: cd app && npm ci  (or: just web-install)"
  exit 1
fi

echo "==> frontend: biome check"
npm run lint

echo "==> frontend: typescript"
npm run type-check

echo "Frontend checks passed."