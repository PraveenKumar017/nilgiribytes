import Link from "next/link";
import { getDashboard } from "@/lib/admin";
import { formatINR } from "@/lib/format";

export default async function AdminDashboardPage() {
  const data = await getDashboard();

  const cards = [
    { label: "Products", value: data.products, href: "/admin/products" },
    { label: "Combos", value: data.combos, href: "/admin/combos" },
    { label: "Categories", value: data.categories, href: "/admin/categories" },
    {
      label: "Blog posts",
      value: data.posts,
      href: "/admin/blog",
      hint: `${data.drafts} draft${data.drafts === 1 ? "" : "s"}`,
    },
    { label: "New orders", value: data.newOrders, href: "/admin/orders" },
  ];

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-text">
            A quick overview of the storefront content and recent activity.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link className="admin-btn admin-btn--primary" href="/admin/products?new=1">
            New product
          </Link>
          <Link className="admin-btn" href="/admin/blog?new=1">
            New post
          </Link>
        </div>
      </header>

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="admin-stat">
            <span className="admin-stat_label">{card.label}</span>
            <span className="admin-stat_value">{card.value}</span>
            {card.hint ? <span className="admin-stat_hint">{card.hint}</span> : null}
          </Link>
        ))}
      </div>

      <section className="admin-panel">
        <div className="admin-panel_head">
          <h2 className="admin-panel_title">Recent orders</h2>
          <Link className="admin-link" href="/admin/orders">
            View all
          </Link>
        </div>

        {data.recentOrders.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link className="admin-link" href={`/admin/orders?id=${order.id}`}>
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>{order.customerName}</td>
                    <td>{formatINR(order.totalPaise)}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No orders yet.</p>
        )}
      </section>
    </>
  );
}
