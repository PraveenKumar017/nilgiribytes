import "./load-env";
import mysql from "mysql2/promise";
import { databaseConfig } from "./db";

async function main() {
  const conn = await mysql.createConnection(databaseConfig());
  try {
    const [rows] = await conn.query<any[]>("SELECT id, sizes FROM Product");
    for (const row of rows) {
      let sizes: any[] = [];
      if (typeof row.sizes === "string") {
        try {
          sizes = JSON.parse(row.sizes);
        } catch {
          sizes = [];
        }
      } else if (Array.isArray(row.sizes)) {
        sizes = row.sizes;
      }
      if (Array.isArray(sizes) && sizes.length) {
        const updated = sizes.map((s: any) => {
          const mrp = Number(s.mrpPaise ?? s.pricePaise ?? 0);
          const discountPercent = 10;
          return {
            ...s,
            mrpPaise: mrp,
            discountPercent,
            pricePaise: Math.round((mrp * (100 - discountPercent)) / 100),
          };
        });
        await conn.execute(
          "UPDATE Product SET sizes = ?, updatedAt = NOW(3) WHERE id = ?",
          [JSON.stringify(updated), row.id]
        );
      }
    }
    await conn.execute(
      "UPDATE Combo SET discountPercent = 10, pricePaise = ROUND(pricePaise * 90 / 100), updatedAt = NOW(3)"
    );
    console.log("Applied 10% discount to all products and combos");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
