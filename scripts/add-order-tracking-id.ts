import "./load-env";
import type { RowDataPacket } from "mysql2";
import { createConnection } from "mysql2/promise";
import { databaseConfig } from "./db";

async function main() {
  const connection = await createConnection(databaseConfig());

  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'Order'
          AND COLUMN_NAME = 'trackingId'`
    );

    if (Number(rows[0]?.count ?? 0) > 0) {
      console.log("Order.trackingId already exists.");
      return;
    }

    await connection.query(
      "ALTER TABLE `Order` ADD COLUMN `trackingId` VARCHAR(120) NULL AFTER `paymentId`"
    );
    console.log("Added Order.trackingId column.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
