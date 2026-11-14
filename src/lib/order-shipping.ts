import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

const globalForShipping = globalThis as unknown as {
  orderShippingColumnsReady?: Promise<void>;
};

async function addColumnIfMissing(column: string, definition: string) {
  const pool = getPool();
  if (!pool) return;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Order'
        AND COLUMN_NAME = ?`,
    [column]
  );

  if (Number(rows[0]?.count ?? 0) > 0) return;

  await pool.query(`ALTER TABLE \`Order\` ADD COLUMN ${definition}`);
}

async function ensureColumns(): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  await addColumnIfMissing(
    "shippingPaise",
    "`shippingPaise` INTEGER NOT NULL DEFAULT 0 AFTER `subtotalPaise`"
  );
  await addColumnIfMissing(
    "shippingDiscountPaise",
    "`shippingDiscountPaise` INTEGER NOT NULL DEFAULT 0 AFTER `shippingPaise`"
  );
}

export function ensureOrderShippingColumns(): Promise<void> {
  if (!globalForShipping.orderShippingColumnsReady) {
    globalForShipping.orderShippingColumnsReady = ensureColumns().catch(
      (error) => {
        globalForShipping.orderShippingColumnsReady = undefined;
        throw error;
      }
    );
  }
  return globalForShipping.orderShippingColumnsReady;
}
