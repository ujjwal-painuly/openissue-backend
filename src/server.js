import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import app from './app.js';
import mongoose from 'mongoose';

let server;

async function startServer() {
  await connectDatabase();
  server = app.listen(env.PORT, () => {
    console.info(`OpenIssue API listening on http://localhost:${env.PORT}`);
  });
}

async function shutdown(signal) {
  console.info(`${signal} received. Closing server...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await mongoose.disconnect();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer().catch(async (error) => {
  console.error('Unable to start OpenIssue API:', error);
  await mongoose.disconnect();
  process.exit(1);
});
