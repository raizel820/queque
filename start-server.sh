#!/bin/bash
# Keep-alive server script for QueueWise
while true; do
    echo "[$(date)] Starting Next.js dev server..."
    npx next dev -p 3000 2>&1 | tee /home/z/my-project/dev.log
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..."
    sleep 3
done
