import type { Metadata } from "next";
import Link from "next/link";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { ensureOrderShippingColumns } from "@/lib/order-shipping";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed | Nilgiribytes",
  description: "Your Nilgiribytes order confirmation.",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ order?: string; payment?: string }>;
};

type OrderRow = RowDataPacket & {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string | null;
  subtotalPaise: number;
  shippingPaise: number;
  shippingDiscountPaise: number;
  totalPaise: number;
  status: string;
  createdAt: Date | string;
  paymentId: string | null;
};

type OrderItemRow = RowDataPacket & {
  id: number;
  nameSnapshot: string;
  sizeLabel: string | null;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
};

type OrderDetails = {
  order: OrderRow;
  items: OrderItemRow[];
};

async function loadOrder(
  orderNumber: string,
  paymentId: string
): Promise<OrderDetails | null> {
  const pool = getPool();
  if (!pool || !orderNumber || !paymentId) return null;
  await ensureOrderShippingColumns();

  const [rows] = await pool.query<OrderRow[]>(
    `SELECT id, orderNumber, customerName, phone, email, address,
            subtotalPaise, shippingPaise, shippingDiscountPaise,
            totalPaise, status, createdAt, paymentId
       FROM \`Order\`
      WHERE orderNumber = ? AND paymentId = ?
      LIMIT 1`,
    [orderNumber, paymentId]
  );

  const order = rows[0];
  if (!order) return null;

  const [items] = await pool.query<OrderItemRow[]>(
    `SELECT id, nameSnapshot, sizeLabel, unitPricePaise, quantity, lineTotalPaise
       FROM OrderItem
      WHERE orderId = ?
      ORDER BY id ASC`,
    [order.id]
  );

  return { order, items };
}

function formatOrderDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function OrderConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderNumber = typeof params.order === "string" ? params.order : "";
  const paymentId = typeof params.payment === "string" ? params.payment : "";
  const details = await loadOrder(orderNumber, paymentId);

  if (!details) {
    return (
      <main id="main-content">
        <section className="section">
          <div className="container">
            <div className="empty-state cart-page_empty">
              <p className="cart-page_empty-title">We could not find that order</p>
              <p className="cart-page_empty-text">
                The confirmation link may be incomplete. If money was deducted,
                please contact us with your payment reference.
              </p>
              <Link className="btn btn--primary" href="/shop">
                Back to shop
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { order, items } = details;
  const firstName = order.customerName.split(" ")[0] || "there";
  const isCod = order.paymentId?.startsWith("COD-") ?? false;

  return (
    <main id="main-content">
      <section className="section order-confirmation">
        <div className="container">
          <div className="order-confirmation_head">
            <span className="section-kicker text-left">Order confirmed</span>
            <h1 className="section-heading">Thank you, {firstName}.</h1>
            <p className="order-confirmation_lead">
              {isCod
                ? "Your order is confirmed. Please keep the amount ready to pay on delivery."
                : "Your payment was successful and we have started preparing your order. A copy of these details is shown below."}
            </p>
          </div>

          <div className="cart-page_grid">
            <div className="cart-page_lines order-confirmation_items">
              {items.map((item) => (
                <div className="order-confirmation_item" key={item.id}>
                  <div>
                    <p className="order-confirmation_item-name">
                      {item.nameSnapshot}
                    </p>
                    <p className="order-confirmation_item-meta">
                      {item.sizeLabel ? `${item.sizeLabel} · ` : ""}
                      Qty {item.quantity} · {formatINR(item.unitPricePaise)} each
                    </p>
                  </div>
                  <p className="order-confirmation_item-total">
                    {formatINR(item.lineTotalPaise)}
                  </p>
                </div>
              ))}
            </div>

            <aside className="cart-page_summary">
              <div className="order-confirmation_badge">
                {isCod ? "COD" : "Paid"}
              </div>
              <h2 className="cart-page_summary-title">{order.orderNumber}</h2>
              <p className="cart-page_delivery-note">
                Placed {formatOrderDate(order.createdAt)}
              </p>
              <hr className="cart-page_summary-rule" />
              <div className="cart-summary">
                <span>Subtotal</span>
                <span>{formatINR(order.subtotalPaise)}</span>
              </div>
              <div className="cart-summary">
                <span>Shipping</span>
                <span>
                  {order.shippingPaise > 0
                    ? formatINR(order.shippingPaise)
                    : "Free"}
                </span>
              </div>
              {order.shippingDiscountPaise > 0 ? (
                <div className="cart-summary cart-page_coupon-discount">
                  <span>Delivery offer</span>
                  <span>&minus;{formatINR(order.shippingDiscountPaise)}</span>
                </div>
              ) : null}
              <div className="cart-summary cart-summary--total">
                <span>{isCod ? "Amount due on delivery" : "Total paid"}</span>
                <span>{formatINR(order.totalPaise)}</span>
              </div>
              <hr className="cart-page_summary-rule" />
              <div className="cart-summary">
                <span>Status</span>
                <span>Ordered</span>
              </div>
              <p className="cart-page_delivery-note">
                {isCod
                  ? "Payment method: Cash on Delivery"
                  : `Payment reference: ${order.paymentId ?? paymentId}`}
              </p>
              <Link className="btn btn--primary" href="/shop">
                Continue shopping
              </Link>
              <Link
                className="btn btn--outline"
                href={`/track-order?order=${encodeURIComponent(
                  order.orderNumber
                )}`}
              >
                Track this order
              </Link>
            </aside>
          </div>

          <div className="order-confirmation_details">
            <div>
              <h2 className="cart-page_summary-title">Delivery address</h2>
              <p className="order-confirmation_address">
                {order.customerName}
                <br />
                {order.address}
                <br />
                Phone: {order.phone}
                {order.email ? (
                  <>
                    <br />
                    Email: {order.email}
                  </>
                ) : null}
              </p>
            </div>
            <p className="cart-page_delivery-note">
              Need help with this order? Contact us on WhatsApp with your order
              number {order.orderNumber}.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
