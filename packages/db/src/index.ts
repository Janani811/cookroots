import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import connectionOptions from "./config/database.config";
import * as schema from "./schema/index";

export function createDb(options?: { logger?: boolean }) {
  const connection = new Pool(connectionOptions);
  // A pooled connection that drops after being returned to the pool (idle
  // timeout from the DB provider, a frozen/thawed serverless container) makes
  // `pg` emit 'error' on the pool. Without a listener, Node treats that as an
  // uncaught exception and crashes the process — see node-postgres's README.
  connection.on("error", (err) => {
    console.error("Unexpected error on idle database client", err);
  });
  return drizzle(connection, { schema, logger: options?.logger ?? false });
}

export type Database = ReturnType<typeof createDb>;

export { and, eq, ilike, or, sql } from "drizzle-orm";

export * from "./schema/index";
