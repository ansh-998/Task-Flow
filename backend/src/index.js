// ============================================================================
// File: backend/src/index.js
// Description: Node.js server listener and cron bootstrap
// ============================================================================

import env from './config/env.js';
import { app } from './app.js';
import { initCron } from './cron/recurring.js';
import prisma from './config/prisma.js';

// Initialize scheduled recurring worker
initCron();

const server = app.listen(env.PORT, () => {
  console.log(`TaskFlow backend server listening on port ${env.PORT}`);
  console.log(`API URL: http://localhost:${env.PORT}/api`);
});

function handleFatalError(type, err) {
  console.error(`FATAL: ${type}:`, err);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error('Error disconnecting Prisma on shutdown:', e);
    }
    process.exit(1);
  });
}

process.on('unhandledRejection', (reason) => {
  handleFatalError('unhandledRejection', reason);
});

process.on('uncaughtException', (err) => {
  handleFatalError('uncaughtException', err);
});

function handleGracefulShutdown(signal) {
  console.log(`Received ${signal}. Gracefully shutting down TaskFlow server...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('Database connection cleanly closed.');
    } catch (e) {
      console.error('Error disconnecting Prisma on shutdown:', e);
    }
    process.exit(0);
  });

  // Force close after 10s if keep-alive connections hang
  setTimeout(() => {
    console.error('Forcing server shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
