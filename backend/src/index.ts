import { app, bootstrapAdmin } from './app.js';

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH] Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[CRASH] Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3010;

app.listen(PORT, async () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  await bootstrapAdmin();
});
