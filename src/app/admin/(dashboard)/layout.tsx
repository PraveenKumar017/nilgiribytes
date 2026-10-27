import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "@/app/admin/actions";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href="/admin" className="admin-brand_name">
            Nilgiribytes
          </Link>
          <span className="admin-brand_tag">Admin</span>
        </div>

        <AdminNav />

        <div className="admin-sidebar_footer">
          <Link className="admin-sidebar_link" href="/" target="_blank">
            View website &#8599;
          </Link>
          <form action={logoutAction}>
            <button className="admin-btn" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-content">
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
