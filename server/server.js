const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');

let server;

if (!process.env.VERCEL) {
  server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Failed to disconnect Prisma client', error);
    } finally {
      server.close(() => {
        console.log(`Received ${signal}. Server closed.`);
        process.exit(0);
      });
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = app;
