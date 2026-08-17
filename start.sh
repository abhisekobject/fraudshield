#!/usr/bin/env bash
# =============================================================
# FraudShield — Full Stack Launcher
# Usage: ./start.sh
# Starts: Backend (FastAPI) + Frontend (Next.js)
# =============================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ███████╗██████╗  █████╗ ██╗   ██╗██████╗ ███████╗██╗  ██╗██╗███████╗██╗     ██████╗ "
echo "  ██╔════╝██╔══██╗██╔══██╗██║   ██║██╔══██╗██╔════╝██║  ██║██║██╔════╝██║     ██╔══██╗"
echo "  █████╗  ██████╔╝███████║██║   ██║██║  ██║███████╗███████║██║█████╗  ██║     ██║  ██║"
echo "  ██╔══╝  ██╔══██╗██╔══██║██║   ██║██║  ██║╚════██║██╔══██║██║██╔══╝  ██║     ██║  ██║"
echo "  ██║     ██║  ██║██║  ██║╚██████╔╝██████╔╝███████║██║  ██║██║███████╗███████╗██████╔╝"
echo "  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝"
echo -e "${NC}"
echo -e "${YELLOW}  Starting full stack...${NC}\n"

cleanup() {
  echo -e "\n${YELLOW}  Shutting down all services...${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo -e "${GREEN}  Done. Goodbye!${NC}"
}
trap cleanup EXIT INT TERM

# --- Backend ---
echo -e "${CYAN}[1/2] Starting Backend (FastAPI on :8000)...${NC}"
cd "$BACKEND_DIR"
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/fraudshield_backend.log 2>&1 &
BACKEND_PID=$!

echo -n "  Waiting for backend"
for i in $(seq 1 20); do
  curl -s http://localhost:8000/health > /dev/null 2>&1 && break
  echo -n "." && sleep 1
done
echo -e "\n${GREEN}  ✓ Backend  →  http://localhost:8000${NC}"
echo -e "    API Docs  →  http://localhost:8000/api/docs"

# --- Frontend ---
echo -e "\n${CYAN}[2/2] Starting Frontend (Next.js on :3000)...${NC}"
cd "$FRONTEND_DIR"
npm run dev > /tmp/fraudshield_frontend.log 2>&1 &
FRONTEND_PID=$!

echo -n "  Waiting for frontend"
for i in $(seq 1 30); do
  curl -s http://localhost:3000 > /dev/null 2>&1 && break
  echo -n "." && sleep 1
done
echo -e "\n${GREEN}  ✓ Frontend →  http://localhost:3000${NC}"

echo ""
echo -e "${GREEN}  ============================================"
echo -e "  🚀  FraudShield is fully up and running!"
echo -e "  ============================================${NC}"
echo -e "  Frontend  →  ${CYAN}http://localhost:3000${NC}"
echo -e "  Backend   →  ${CYAN}http://localhost:8000${NC}"
echo -e "  API Docs  →  ${CYAN}http://localhost:8000/api/docs${NC}"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop everything.${NC}\n"

wait
