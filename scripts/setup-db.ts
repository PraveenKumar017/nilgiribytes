import "./load-env";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createConnection } from "mysql2/promise";
import { databaseConfig } from "./db";

async function main() {
  const connection = await createConnection({
    ...databaseConfig(),
    multipleStatements: true,
  });

  try {
    const schema = readFileSync(join(process.cwd(), "table_creation.sql"), "utf8");
    await connection.query(schema);
    console.log("Database schema is ready.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
