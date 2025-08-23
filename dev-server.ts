#!/usr/bin/env tsx
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from './src/lib/error-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color utilities for logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Enhanced logging function
const log = (service: string, message: string, color = colors.reset) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${service}]${colors.reset} ${message}`);
};



// Development processes
let viteProcess: ChildProcess | null = null;
let convexProcess: ChildProcess | null = null;

// Start Vite development server
const startVite = () => {
  log('VITE', 'Starting development server...', colors.blue);
  
  viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    cwd: __dirname,
  });

  viteProcess.stdout?.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log('VITE', message, colors.blue);
    }
  });

  viteProcess.stderr?.on('data', (data) => {
    const message = data.toString().trim();
    if (message && !message.includes('ExperimentalWarning')) {
      log('VITE', message, colors.yellow);
    }
  });

  viteProcess.on('close', (code) => {
    log('VITE', `Process exited with code ${code}`, code === 0 ? colors.green : colors.red);
    viteProcess = null;
  });
};

// Start Convex backend
const startConvex = () => {
  log('CONVEX', 'Starting backend...', colors.magenta);
  
  convexProcess = spawn('npx', ['convex', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    cwd: __dirname,
  });

  convexProcess.stdout?.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log('CONVEX', message, colors.magenta);
    }
  });

  convexProcess.stderr?.on('data', (data) => {
    const message = data.toString().trim();
    if (message && !message.includes('ExperimentalWarning')) {
      log('CONVEX', message, colors.yellow);
    }
  });

  convexProcess.on('close', (code) => {
    log('CONVEX', `Process exited with code ${code}`, code === 0 ? colors.green : colors.red);
    convexProcess = null;
  });
};

// Graceful shutdown
const shutdown = () => {
  log('SHUTDOWN', 'Terminating all processes...', colors.yellow);
  
  if (viteProcess) {
    viteProcess.kill('SIGTERM');
    viteProcess = null;
  }
  
  if (convexProcess) {
    convexProcess.kill('SIGTERM');
    convexProcess = null;
  }
  
  process.exit(0);
};

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', () => {
  if (viteProcess) viteProcess.kill();
  if (convexProcess) convexProcess.kill();
});

// Start development environment
const startDevelopment = async () => {
  log('DEV', '🚀 Starting Zapdev Development Environment', colors.bright);
  
  // Start services
  startVite();
  startConvex();
  
  // Import the API server (no destructuring - server starts on import)
  try {
    await import('./api-dev-server.js');
    log('API', 'Universal API server started successfully', colors.green);
  } catch (error) {
    log('API', `Failed to start API server: ${error}`, colors.red);
  }
  
  log('DEV', '✨ All services started!', colors.green);
  log('DEV', '📍 Frontend: http://localhost:5173', colors.cyan);
  log('DEV', '📍 API Server: http://localhost:3000', colors.cyan);
  log('DEV', '📍 Convex Dashboard: https://dashboard.convex.dev', colors.cyan);
  log('DEV', '🚀 Zapdev Development Environment Started!', colors.green);
};

// Start the development environment
startDevelopment().catch((error) => {
  logger.error('Failed to start development environment', error);
  process.exit(1);
});
