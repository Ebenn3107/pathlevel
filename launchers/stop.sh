#!/usr/bin/env bash
#
# PathLevel — stop servers and containers.
#
# Entry points:
#   Windows : double-click  Stop PathLevel.bat   (thin wrapper around this file)
#   WSL     : ./stop.sh
#
# This stops the dev servers and the PostgreSQL container. Closing Docker
# Desktop and running `wsl --shutdown` are Windows-only steps, so they are
# handled by Stop PathLevel.bat on the Windows side.

set -euo pipefail

# Locate the project root (folder containing docker-compose.yml), walking up
# from this script so it works from the project root or a launchers/ subfolder.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR"
while [ ! -f "$ROOT/docker-compose.yml" ] && [ "$ROOT" != "/" ]; do
  ROOT="$(dirname "$ROOT")"
done
if [ ! -f "$ROOT/docker-compose.yml" ]; then
  echo "[pathlevel] ERROR: cannot find project root (docker-compose.yml) from $SCRIPT_DIR" >&2
  exit 1
fi
cd "$ROOT"

RUN_DIR="$ROOT/.run"

log() { printf '\033[1;34m[pathlevel]\033[0m %s\n' "$*"; }

# ── 1. Stop dev servers ─────────────────────────────────────────────────────
# Kill recorded PIDs first, then targeted fallbacks for the real worker
# processes (npm only spawns nodemon/ts-node/vite, so the recorded PID may be
# just the npm wrapper).
# Patterns use the [x] bracket trick so pkill can never match the process that
# is running this script itself (its own command line contains the pattern).
for f in "$RUN_DIR/backend.pid" "$RUN_DIR/frontend.pid"; do
  if [ -f "$f" ]; then
    log "Killing PID $(cat "$f")..."
    kill "$(cat "$f")" 2>/dev/null || true
  fi
done

pkill -f "[n]pm run dev" 2>/dev/null || true
pkill -f "[b]ackend/node_modules/.bin/nodemon" 2>/dev/null || true
pkill -f "[t]s-node --files src/server.ts" 2>/dev/null || true
pkill -f "[f]rontend/node_modules/.bin/vite" 2>/dev/null || true

sleep 1
rm -f "$RUN_DIR/backend.pid" "$RUN_DIR/frontend.pid"

# ── 2. Stop containers ──────────────────────────────────────────────────────
if docker info >/dev/null 2>&1; then
  log "Stopping containers (docker compose down)..."
  docker compose down
else
  log "Docker is not running — skipping containers."
fi

log "PathLevel stopped."
