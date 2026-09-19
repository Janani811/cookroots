import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import connectionOptions from "./config/database.config";
import * as schema from "./schema/index";

export function createDb(options?: { logger?: boolean }) {
  const connection = new Pool(connectionOptions);
  return drizzle(connection, { schema, logger: options?.logger ?? false });
}

export type Database = ReturnType<typeof createDb>;

export { and, eq, ilike, or, sql } from "drizzle-orm";

export * from "./schema/index";
