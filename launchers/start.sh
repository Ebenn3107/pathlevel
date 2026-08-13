#!/usr/bin/env bash
#
# PathLevel — start everything (Docker, backend, frontend) and open the browser.
#
# Entry points:
#   Windows : double-click  Start PathLevel.bat   (thin wrapper around this file)
#   WSL     : ./start.sh
#
# Readiness is polled (curl / docker / pg_isready), not a fixed sleep.
# Press Ctrl+C in the control-panel window to stop the servers only; containers
# stay up so the next start is fast. For a full shutdown (containers, Docker
# Desktop, WSL) use Stop PathLevel.bat / ./stop.sh.

set -euo pipefail

# ── Locate project root (the folder containing docker-compose.yml) ──────────
# Walk up from this script's folder so the launcher works whether it lives in
# the project root, a launchers/ subfolder, or anywhere below the project.
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
LOG_DIR="$ROOT/.logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PID="$RUN_DIR/backend.pid"
FRONTEND_PID="$RUN_DIR/frontend.pid"

BACKEND_HEALTH_URL="http://localhost:4000/api/health"
FRONTEND_URL="http://localhost:5173"

# ── Bootstrap Node ───────────────────────────────────────────────────────────
# nvm is not loaded in non-interactive shells (the .bat calls bash directly),
# so make sure node/npm are available regardless of how we were launched.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "[pathlevel] ERROR: node not found on PATH. Install Node.js (or nvm) and retry." >&2
  exit 1
fi

mkdir -p "$RUN_DIR" "$LOG_DIR"

# ── Helpers ─────────────────────────────────────────────────────────────────
log()   { printf '\033[1;34m[pathlevel]\033[0m %s\n' "$*"; }
error() { printf '\033[1;31m[pathlevel] ERROR:\033[0m %s\n' "$*" >&2; }

# wait_until <label> <max_seconds> <command...>
# Polls <command> every 1s until it succeeds. Returns 1 after the cap.
wait_until() {
  local label="$1" max="$2"
  shift 2
  local n=0
  while ! "$@" >/dev/null 2>&1; do
    n=$((n + 1))
    if [ "$n" -ge "$max" ]; then
      error "$label did not become ready within ${max}s."
      return 1
    fi
    sleep 1
  done
}

open_browser() {
  # Run from /mnt/c so cmd.exe does not print the cosmetic "UNC paths" warning.
  (cd /mnt/c && cmd.exe /c start "" "$FRONTEND_URL") >/dev/null 2>&1 || true
}

stop_servers() {
  log "Stopping servers..."
  for f in "$BACKEND_PID" "$FRONTEND_PID"; do
    if [ -f "$f" ]; then
      kill "$(cat "$f")" 2>/dev/null || true
    fi
  done
  # Targeted fallbacks in case the recorded PID was only the npm parent wrapper.
  # [x] bracket trick: pattern text cannot match the invoking shell's cmdline.
  pkill -f "[n]pm run dev" 2>/dev/null || true
  pkill -f "[b]ackend/node_modules/.bin/nodemon" 2>/dev/null || true
  pkill -f "[t]s-node --files src/server.ts" 2>/dev/null || true
  pkill -f "[f]rontend/node_modules/.bin/vite" 2>/dev/null || true
  sleep 1
  rm -f "$BACKEND_PID" "$FRONTEND_PID"
  log "Servers stopped. Containers are left running (use Stop PathLevel.bat for full shutdown)." || true
}

trap 'echo; stop_servers; exit 0' INT TERM

# ── Already running? Just open the browser. ─────────────────────────────────
if curl -fsS "$BACKEND_HEALTH_URL" >/dev/null 2>&1 && curl -fsS "$FRONTEND_URL" >/dev/null 2>&1; then
  log "PathLevel is already running."
  open_browser
  exit 0
fi

# ── 1. Wait for Docker (engine) ─────────────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
  log "Waiting for Docker to become ready..."
  if ! wait_until "Docker" 180 docker info; then
    error "Docker did not start. Open Docker Desktop and try again."
    exit 1
  fi
fi
log "Docker is ready."

# ── 2. Start containers ─────────────────────────────────────────────────────
log "Starting containers (docker compose up -d)..."
docker compose up -d

# ── 3. Wait for PostgreSQL ──────────────────────────────────────────────────
log "Waiting for PostgreSQL..."
if ! wait_until "PostgreSQL" 60 docker compose exec -T postgres pg_isready -U pathlevel -d pathlevel; then
  error "PostgreSQL did not become ready. Check the container: docker compose ps"
  exit 1
fi
log "PostgreSQL is ready."

# ── 4. Backend ──────────────────────────────────────────────────────────────
if ! curl -fsS "$BACKEND_HEALTH_URL" >/dev/null 2>&1; then
  log "Starting backend (npm run dev)..."
  (cd "$ROOT/backend" && exec npm run dev) >>"$BACKEND_LOG" 2>&1 &
  echo $! > "$BACKEND_PID"
  if ! wait_until "Backend" 60 curl -fsS "$BACKEND_HEALTH_URL"; then
    error "Backend failed to start. Last lines of $BACKEND_LOG:"
    tail -n 20 "$BACKEND_LOG" >&2
    stop_servers
    exit 1
  fi
fi
log "Backend is ready ($BACKEND_HEALTH_URL)."

# ── 5. Frontend ─────────────────────────────────────────────────────────────
if ! curl -fsS "$FRONTEND_URL" >/dev/null 2>&1; then
  log "Starting frontend (npm run dev)..."
  (cd "$ROOT/frontend" && exec npm run dev) >>"$FRONTEND_LOG" 2>&1 &
  echo $! > "$FRONTEND_PID"
  if ! wait_until "Frontend" 60 curl -fsS "$FRONTEND_URL"; then
    error "Frontend failed to start. Last lines of $FRONTEND_LOG:"
    tail -n 20 "$FRONTEND_LOG" >&2
    stop_servers
    exit 1
  fi
fi
log "Frontend is ready ($FRONTEND_URL)."

# ── 6. Open browser and stay open as a control panel ────────────────────────
open_browser
echo
log "PathLevel is running."
log "  App        : $FRONTEND_URL"
log "  API health : $BACKEND_HEALTH_URL"
log "  Backend log : $BACKEND_LOG"
log "  Frontend log: $FRONTEND_LOG"
log "Press Ctrl+C to stop the servers (containers stay up)."
echo
while true; do sleep 2; done
