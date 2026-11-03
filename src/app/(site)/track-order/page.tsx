import type { Metadata } from "next";
import Link from "next/link";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { formatINR } from "@/lib/format";
import {
  ORDER_STATUS_OPTIONS,
  normalizeOrderStatus,
  orderStatusLabel,
  orderStatusStep,
} from "@/lib/order-status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Your Order | Nilgiribytes",
  description:
    "Track the status of your Nilgiribytes order using your Order ID.",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ order?: string }>;
};

type OrderRow = RowDataPacket & {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string | null;
  subtotalPaise: number;
  totalPaise: number;
  status: string;
  createdAt: Date | string;
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

function normalizeOrderNumber(value: string): string {
  return value.trim().replace(/^#/, "").trim().toUpperCase();
}

async function loadOrder(orderNumber: string): Promise<OrderDetails | null> {
  const pool = getPool();
  if (!pool || !orderNumber) return null;

  const [rows] = await pool.query<OrderRow[]>(
    `SELECT id, orderNumber, customerName, phone, address,
            subtotalPaise, totalPaise, status, createdAt
       FROM \`Order\`
      WHERE orderNumber = ?
      LIMIT 1`,
    [orderNumber]
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
    timeZone: "Asia/Kolkata",
  });
}

export default async function TrackOrderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderNumber = normalizeOrderNumber(
    typeof params.order === "string" ? params.order : ""
  );
  const details = orderNumber ? await loadOrder(orderNumber) : null;
  const status = details?.order.status ?? "";
  const statusLabel = orderStatusLabel(status);
  const statusKey = normalizeOrderStatus(status).toLowerCase();
  const currentStep = orderStatusStep(status);

  return (
    <main id="main-content">
      <section className="section order-confirmation">
        <div className="container">
          <div className="track-order_shell">
          <div className="order-confirmation_head">
            <h1 className="section-heading">Track your order</h1>
            <p className="order-confirmation_lead">
              Enter the Order ID from your confirmation email or receipt to see
              the latest status of your order.
            </p>
          </div>

          <form
            className="track-order_form"
            method="get"
            action="/track-order"
          >
            <div className="form-group">
              <label htmlFor="track-order-id">Order ID</label>
              <input
                id="track-order-id"
                name="order"
                type="text"
                className="form-input"
                placeholder="e.g. NB10001"
                defaultValue={orderNumber}
                autoComplete="off"
                required
              />
            </div>
            <button type="submit" className="btn btn--primary">
              Track order
            </button>
          </form>

          {orderNumber && !details ? (
            <div className="empty-state cart-page_empty track-order_empty">
              <p className="cart-page_empty-title">Order not found</p>
              <p className="cart-page_empty-text">
                We could not find an order with the ID {orderNumber}. Please
                check the ID and try again.
              </p>
            </div>
          ) : null}

          {details ? (
            <div className="track-order_result">
              <div className="track-order_panel">
                <div className="track-order_summary">
                  <div>
                    <p className="order-confirmation_item-meta">Order ID</p>
                    <h2 className="cart-page_summary-title">
                      {details.order.orderNumber}
                    </h2>
                    <p className="cart-page_delivery-note">
                      Placed {formatOrderDate(details.order.createdAt)}
                    </p>
                  </div>
                  <span className={`track-order_badge track-order_badge--${statusKey}`}>
                    {statusLabel}
                  </span>
                </div>

                <ol className="track-order_steps" aria-label="Order status">
                  {ORDER_STATUS_OPTIONS.map((step, index) => {
                    const state =
                      index < currentStep
                        ? " is-complete"
                        : index === currentStep
                          ? " is-current"
                          : "";
                    return (
                      <li key={step.value} className={state.trim()}>
                        <span>{step.label}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="cart-page_grid track-order_grid">
                <div className="cart-page_lines order-confirmation_items">
                  {details.items.map((item) => (
                    <div className="order-confirmation_item" key={item.id}>
                      <div>
                        <p className="order-confirmation_item-name">
                          {item.nameSnapshot}
                        </p>
                        <p className="order-confirmation_item-meta">
                          {item.sizeLabel ? `${item.sizeLabel} · ` : ""}
                          Qty {item.quantity} ·{" "}
                          {formatINR(item.unitPricePaise)} each
                        </p>
                      </div>
                      <p className="order-confirmation_item-total">
                        {formatINR(item.lineTotalPaise)}
                      </p>
                    </div>
                  ))}
                </div>

                <aside className="cart-page_summary">
                  <h2 className="cart-page_summary-title">Order summary</h2>
                  <hr className="cart-page_summary-rule" />
                  <div className="cart-summary">
                    <span>Subtotal</span>
                    <span>{formatINR(details.order.subtotalPaise)}</span>
                  </div>
                  <div className="cart-summary cart-summary--total">
                    <span>Total</span>
                    <span>{formatINR(details.order.totalPaise)}</span>
                  </div>
                  <hr className="cart-page_summary-rule" />
                  <div className="cart-summary">
                    <span>Status</span>
                    <span>{statusLabel}</span>
                  </div>
                  <Link className="btn btn--primary" href="/shop">
                    Continue shopping
                  </Link>
                </aside>
              </div>

              <div className="order-confirmation_details">
                <div>
                  <h2 className="cart-page_summary-title">Delivery details</h2>
                  <p className="order-confirmation_address">
                    {details.order.customerName}
                    <br />
                    {details.order.address}
                    <br />
                    Phone: {details.order.phone}
                  </p>
                </div>
                <p className="cart-page_delivery-note">
                  Need help with this order? Contact us with your Order ID{" "}
                  {details.order.orderNumber}.
                </p>
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
