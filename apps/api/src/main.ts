import { createApp } from './bootstrap';

async function main(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}

void main();
