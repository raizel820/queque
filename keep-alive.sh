#!/bin/bash
# keep-alive dev server for QueueWise
# Auto-restarts Next.js whenever it exits (crash, OOM, etc.)
cd /home/z/my-project

while true; do
    echo "[$(date '+%H:%M:%S')] Starting Next.js dev server on port 3000..."
    npx next dev -p 3000
    EXIT_CODE=$?
    echo "[$(date '+%H:%M:%S')] Server exited with code $EXIT_CODE. Restarting in 2s..."
    sleep 2
done
