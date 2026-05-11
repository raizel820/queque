#!/bin/bash
while true; do
  if ! curl -s -o /dev/null -w "" --max-time 3 http://localhost:3000/ 2>/dev/null; then
    # Kill any stale processes
    pkill -f "next dev" 2>/dev/null
    pkill -f "next start" 2>/dev/null
    sleep 1
    # Remove lock file if stale
    rm -f /tmp/.next-lock 2>/dev/null
    # Start server
    echo "[$(date)] Restarting server..." >> /home/z/my-project/dev.log
    cd /home/z/my-project && npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    echo "[$(date)] Server started with PID $!" >> /home/z/my-project/dev.log
  fi
  sleep 5
done
