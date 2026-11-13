import type { Metadata } from "next";
import { CouponsManager } from "@/components/admin/coupons-manager";
import { listCoupons } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Coupons & Discounts | Nilgiribytes Admin",
  description: "Manage promotional coupons and discount prices saved in the database.",
};

export default async function AdminCouponsPage() {
  let initialCoupons: any[] = [];
  try {
    initialCoupons = await listCoupons();
  } catch (error) {
    console.error("Failed to prefetch coupons from database:", error);
  }

  return <CouponsManager initialCoupons={initialCoupons} />;
}
