import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config();

export default {
  out: "./drizzle",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME!,
    password: process.env.DB_PASSWORD,
    user: process.env.DB_USER,
    ssl: process.env.NODE_ENV === "production",
  },
} satisfies Config;
