import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/admin-ui";
import { getAdminSession } from "@/lib/admin";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="admin-login">
      <div className="admin-login_card">
        <p className="admin-login_brand">Nilgiribytes</p>
        <h1 className="admin-login_title">Admin sign in</h1>
        <p className="admin-login_text">
          Manage the catalog, blog and orders for the Nilgiribytes storefront.
        </p>

        <LoginForm />

        <p className="admin-login_back">
          <Link href="/">&larr; Back to the website</Link>
        </p>
      </div>
    </main>
  );
}
