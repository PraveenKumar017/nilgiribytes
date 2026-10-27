import type { ConnectionOptions } from "mysql2/promise";

export function databaseConfig(): ConnectionOptions {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, "");

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    charset: "utf8mb4",
  };
}
