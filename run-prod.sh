#!/bin/bash
cd /home/z/my-project
while true; do
    echo "[$(date '+%H:%M:%S')] Starting production server on port 3000..."
    NODE_ENV=production bun .next/standalone/server.js
    EXIT_CODE=$?
    echo "[$(date '+%H:%M:%S')] Server exited (code=$EXIT_CODE). Restarting in 2s..."
    sleep 2
done
