import { app, bootstrapAdmin } from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  await bootstrapAdmin();
});
