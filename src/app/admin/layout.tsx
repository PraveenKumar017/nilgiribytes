import type { Metadata } from "next";
import "../styles/admin.css";

export const metadata: Metadata = {
  title: "Admin | Nilgiribytes",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-root">{children}</div>;
}
