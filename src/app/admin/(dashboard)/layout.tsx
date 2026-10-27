import { AdminSidebar } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/admin";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <div className="admin-content">
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
