import { config } from "dotenv";
import type { PoolConfig } from "pg";

config();

const isProd = process.env.NODE_ENV === "production";

const connectionOptions: PoolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Managed Postgres (Neon/Supabase) requires TLS; their pooler certs don't
  // chain to a root the Node bundle trusts, so don't reject on verification.
  ssl: isProd ? { rejectUnauthorized: false } : false,
};

export default connectionOptions;
