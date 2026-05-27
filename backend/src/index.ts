import { app, bootstrapAdmin } from './app.js';
import { logger } from './lib/logger.js';
import { registerAllCrons } from './crons/index.js';
import { selfTestEncryption } from './services/metaTokenService.js';

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[CRASH] Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('[CRASH] Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3010;

app.listen(PORT, async () => {
  logger.info(`✓ Server running on http://localhost:${PORT}`);
  await bootstrapAdmin();
  selfTestEncryption();
  registerAllCrons();
});
