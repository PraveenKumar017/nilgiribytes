import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, AutoDismissAlert } from "@/components/admin/admin-ui";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { OrdersTable } from "@/components/admin/orders-table";
import { WhatsAppIcon } from "@/components/admin/icons";
import { getOrder, listOrders } from "@/lib/admin";
import { formatINR } from "@/lib/format";
import {
  ORDER_STATUS_OPTIONS,
  normalizeOrderStatus,
  orderStatusLabel,
} from "@/lib/order-status";

type PageProps = {
  searchParams: Promise<{ id?: string; saved?: string; deleted?: string }>;
};

const STATUSES = ORDER_STATUS_OPTIONS;

function sanitizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = Number(params.id);

  if (params.id && !id) notFound();

  // Single Order Details View
  if (params.id) {
    const order = await getOrder(id);
    if (!order) notFound();

    const waNumber = sanitizePhoneForWhatsApp(order.phone);
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
      `Hello ${order.customerName}, regarding your Nilgiribytes order ${order.orderNumber}:`
    )}`;

    return (
      <>
        <header className="admin-page-head">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.45rem", flexWrap: "wrap" }}>
              <Link
                href="/admin/orders"
                className="admin-btn admin-btn--small admin-btn--ghost"
                style={{ padding: "0.22rem 0.55rem", fontSize: "0.74rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                title="Return to orders table view"
              >
                &larr; Back
              </Link>
              <p className="admin-breadcrumb" style={{ margin: 0 }}>
                <Link href="/admin/orders">Orders</Link> / <span>{order.orderNumber}</span>
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 className="admin-page-title" style={{ margin: 0 }}>
                {order.orderNumber}
              </h1>
              <span className={`admin-badge admin-badge--${normalizeOrderStatus(order.status).toLowerCase()}`}>
                {orderStatusLabel(order.status)}
              </span>
              <span className={`admin-orders_channel-badge admin-orders_channel-badge--${order.channel.toLowerCase()}`}>
                {order.channel}
              </span>
            </div>
            <p className="admin-page-text">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })} via {order.channel.toLowerCase()}.
            </p>
          </div>
          <div className="admin-page-actions">
            <Link className="admin-btn" href="/admin/orders">
              &larr; Back to all orders
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-orders_wa-link"
              style={{ padding: "0.5rem 0.85rem", fontSize: "0.78rem" }}
            >
              <WhatsAppIcon className="admin-orders_inline-icon admin-orders_inline-icon--wa" />
              <span>WhatsApp Customer</span>
            </a>
          </div>
        </header>

        {params.saved ? (
          <AutoDismissAlert message="Order status updated." param="saved" />
        ) : null}

        <div className="admin-detail-grid">
          {/* Order Items */}
          <section className="admin-panel">
            <div className="admin-panel_head">
              <h2 className="admin-panel_title">Purchased Items ({order.itemsCount})</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Size / Pack</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.nameSnapshot}</strong>
                      </td>
                      <td>{item.sizeLabel ?? "—"}</td>
                      <td style={{ textAlign: "right" }}>{formatINR(item.unitPricePaise)}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>{formatINR(item.lineTotalPaise)}</td>
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
                <dt>Shipping</dt>
                <dd>
                  {order.shippingPaise > 0
                    ? formatINR(order.shippingPaise)
                    : "Free"}
                </dd>
              </div>
              {order.shippingDiscountPaise > 0 ? (
                <div>
                  <dt>Shipping offer</dt>
                  <dd>&minus;{formatINR(order.shippingDiscountPaise)}</dd>
                </div>
              ) : null}
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-chocolate)" }}>
                <dt>Grand Total</dt>
                <dd>{formatINR(order.totalPaise)}</dd>
              </div>
            </dl>
          </section>

          {/* Customer & Delivery Details */}
          <section className="admin-panel">
            <h2 className="admin-panel_title">Customer & Payment</h2>
            <dl className="admin-details">
              <div>
                <dt>Customer</dt>
                <dd>
                  <strong>{order.customerName}</strong>
                </dd>
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
                <dd>
                  {order.email ? (
                    <a className="admin-link" href={`mailto:${order.email}`}>
                      {order.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd style={{ whiteSpace: "pre-line" }}>{order.address ?? "—"}</dd>
              </div>
              <div>
                <dt>Notes</dt>
                <dd>{order.notes ?? "—"}</dd>
              </div>
              {order.paymentId ? (
                <div>
                  <dt>Payment ID</dt>
                  <dd className="admin-mono">{order.paymentId}</dd>
                </div>
              ) : null}
              {order.razorpayOrderId ? (
                <div>
                  <dt>Razorpay Order</dt>
                  <dd className="admin-mono">{order.razorpayOrderId}</dd>
                </div>
              ) : null}
            </dl>

            <div className="admin-form_section">
              <h2 className="admin-panel_title">Update status</h2>
              <ActionForm action={updateOrderStatusAction} submitLabel="Update status">
                <input type="hidden" name="id" value={order.id} />
                <label className="admin-field">
                  <span>Status</span>
                  <select name="status" defaultValue={normalizeOrderStatus(order.status)}>
                    {STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
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

  // Orders Table View
  const orders = await listOrders();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-text">
            All customer orders from storefront checkout and direct WhatsApp inquiry.
          </p>
        </div>
      </header>

      {params.saved ? (
        <AutoDismissAlert
          message="Order status updated successfully."
          param="saved"
        />
      ) : null}

      {params.deleted ? (
        <AutoDismissAlert
          message="Order deleted successfully."
          param="deleted"
        />
      ) : null}

      <OrdersTable orders={orders} />
    </>
  );
}
