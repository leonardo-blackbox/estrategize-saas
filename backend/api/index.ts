import { app, bootstrapAdmin } from '../src/app.js';

// Run bootstrap once on cold start (idempotent)
bootstrapAdmin().catch(console.error);

export default app;
