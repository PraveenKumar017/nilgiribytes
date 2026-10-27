import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/admin-ui";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { getOrder, listOrders } from "@/lib/admin";
import { formatINR } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ id?: string; saved?: string }>;
};

const STATUSES = ["NEW", "CONFIRMED", "PACKED", "DELIVERED", "CANCELLED"] as const;

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = Number(params.id);

  if (params.id && !id) notFound();

  if (params.id) {
    const order = await getOrder(id);
    if (!order) notFound();

    return (
      <>
        <header className="admin-page-head">
          <div>
            <p className="admin-breadcrumb">
              <Link href="/admin/orders">Orders</Link> / {order.orderNumber}
            </p>
            <h1 className="admin-page-title">{order.orderNumber}</h1>
            <p className="admin-page-text">
              Placed {new Date(order.createdAt).toLocaleString("en-IN")} via{" "}
              {order.channel.toLowerCase()}.
            </p>
          </div>
        </header>

        {params.saved ? (
          <p className="admin-alert admin-alert--success">Order status updated.</p>
        ) : null}

        <div className="admin-detail-grid">
          <section className="admin-panel">
            <h2 className="admin-panel_title">Items</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Size</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nameSnapshot}</td>
                      <td>{item.sizeLabel ?? "—"}</td>
                      <td>{formatINR(item.unitPricePaise)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatINR(item.lineTotalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="admin-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatINR(order.subtotalPaise)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatINR(order.totalPaise)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-panel">
            <h2 className="admin-panel_title">Customer</h2>
            <dl className="admin-details">
              <div>
                <dt>Name</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  <a className="admin-link" href={`tel:${order.phone}`}>
                    {order.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{order.email ?? "—"}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{order.address ?? "—"}</dd>
              </div>
              <div>
                <dt>Notes</dt>
                <dd>{order.notes ?? "—"}</dd>
              </div>
            </dl>

            <div className="admin-form_section">
              <h2 className="admin-panel_title">Update status</h2>
              <ActionForm action={updateOrderStatusAction} submitLabel="Update status">
                <input type="hidden" name="id" value={order.id} />
                <label className="admin-field">
                  <span>Status</span>
                  <select name="status" defaultValue={order.status}>
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </ActionForm>
            </div>
          </section>
        </div>
      </>
    );
  }

  const orders = await listOrders();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-text">
            Orders created from the storefront will appear here.
          </p>
        </div>
      </header>

      <section className="admin-panel">
        {orders.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Channel</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="admin-mono">{order.orderNumber}</td>
                    <td>{order.customerName}</td>
                    <td>{order.phone}</td>
                    <td>{order.channel.toLowerCase()}</td>
                    <td>{formatINR(order.totalPaise)}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleString("en-IN")}</td>
                    <td>
                      <Link
                        className="admin-btn admin-btn--small"
                        href={`/admin/orders?id=${order.id}`}
                      >
                        View
                      </Link>
                    </td>
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
