import { spawn } from 'child_process';
import { createServer } from 'http';
import { execSync } from 'child_process';

const PORT = 3000;
const PROJECT_DIR = '/home/z/my-project';

let nextProcess: ReturnType<typeof spawn> | null = null;

function startNextServer() {
  console.log(`[DevRunner] Starting Next.js production server on port ${PORT}...`);

  nextProcess = spawn(
    'bun',
    ['.next/standalone/server.js'],
    {
      cwd: PROJECT_DIR,
      env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT) },
      stdio: ['pipe', 'pipe', 'pipe'],
    }
  );

  nextProcess.stdout?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.log(`[Next] ${msg}`);
  });

  nextProcess.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.error(`[Next:ERR] ${msg}`);
  });

  nextProcess.on('exit', (code, signal) => {
    console.log(`[DevRunner] Next.js exited (code=${code}, signal=${signal}). Restarting in 3s...`);
    nextProcess = null;
    setTimeout(startNextServer, 3000);
  });

  nextProcess.on('error', (err) => {
    console.error(`[DevRunner] Failed to start: ${err.message}`);
    nextProcess = null;
    setTimeout(startNextServer, 5000);
  });
}

// Simple HTTP server to confirm this wrapper is alive
const healthServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'running',
    nextAlive: nextProcess !== null && !nextProcess.killed,
    pid: process.pid,
  }));
});
healthServer.listen(PORT + 1, () => {
  console.log(`[DevRunner] Health check on port ${PORT + 1}`);
});

// SIGTERM handler
process.on('SIGTERM', () => {
  console.log('[DevRunner] Received SIGTERM, shutting down...');
  if (nextProcess) nextProcess.kill();
  healthServer.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[DevRunner] Received SIGINT, shutting down...');
  if (nextProcess) nextProcess.kill();
  healthServer.close();
  process.exit(0);
});

// Start!
startNextServer();
