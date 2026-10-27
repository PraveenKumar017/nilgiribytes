import { createPool, type Pool } from "mysql2/promise";

const globalForDb = globalThis as unknown as {
  mysqlPool?: Pool | null;
};

export function getPool(): Pool | null {
  if (globalForDb.mysqlPool !== undefined) return globalForDb.mysqlPool;

  const url = process.env.DATABASE_URL;
  if (!url) {
    globalForDb.mysqlPool = null;
    return null;
  }

  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, "");

  globalForDb.mysqlPool = createPool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return globalForDb.mysqlPool;
}
