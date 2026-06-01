#!/bin/bash
# Persistent realtime service with auto-restart
LOG="/tmp/realtime-service.log"
while true; do
  echo "[$(date)] Starting BLASTI Realtime Service..." >> "$LOG"
  cd /home/z/my-project/mini-services/realtime-service && node index.ts >> "$LOG" 2>&1
  EXIT=$?
  echo "[$(date)] Realtime service exited with code $EXIT, restarting in 3s..." >> "$LOG"
  sleep 3
done
