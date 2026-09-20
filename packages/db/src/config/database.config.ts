import { config } from "dotenv";
import type { PoolConfig } from "pg";

config();

const isProd = process.env.NODE_ENV === "production";
// Each serverless invocation can cold-start its own pool; left at pg's
// default (10), concurrent invocations can quickly exhaust a managed
// Postgres's connection limit. Cap it low on Vercel unless overridden.
const isServerless = process.env.VERCEL === "1";

const connectionOptions: PoolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Managed Postgres (Neon/Supabase) requires TLS; their pooler certs don't
  // chain to a root the Node bundle trusts, so don't reject on verification.
  ssl: isProd ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DB_POOL_MAX) || (isServerless ? 1 : undefined),
};

export default connectionOptions;
