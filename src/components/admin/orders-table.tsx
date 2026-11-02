"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  updateOrderStatusAction,
  deleteOrderAction,
} from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/admin-ui";
import {
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  MailIcon,
  PhoneIcon,
  PrintIcon,
  SearchIcon,
  TrashIcon,
  WhatsAppIcon,
} from "@/components/admin/icons";
import type { AdminOrderRow } from "@/lib/admin";
import { formatINR } from "@/lib/format";

const STATUSES = [
  "NEW",
  "CONFIRMED",
  "PACKED",
  "DELIVERED",
  "CANCELLED",
] as const;

type StatusType = (typeof STATUSES)[number];

function formatOrderDateTime(date: Date | string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);

  const dateStr = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { dateStr, timeStr, full: `${dateStr}, ${timeStr}` };
}

function timeAgo(date: Date | string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function sanitizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [activeModalOrder, setActiveModalOrder] = useState<AdminOrderRow | null>(
    null
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const newOrders = orders.filter((o) => o.status === "NEW").length;
    const inProgress = orders.filter(
      (o) => o.status === "CONFIRMED" || o.status === "PACKED"
    ).length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
    const totalRevenuePaise = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.totalPaise, 0);

    return {
      totalOrders,
      newOrders,
      inProgress,
      delivered,
      cancelled,
      totalRevenuePaise,
    };
  }, [orders]);

  // Status counts for tabs
  const countsByStatus = useMemo(() => {
    const map: Record<string, number> = {
      ALL: orders.length,
      NEW: 0,
      CONFIRMED: 0,
      PACKED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const o of orders) {
      if (map[o.status] !== undefined) {
        map[o.status]++;
      }
    }
    return map;
  }, [orders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders
      .filter((order) => {
        // Status filter
        if (statusFilter !== "ALL" && order.status !== statusFilter) {
          return false;
        }

        // Channel filter
        if (channelFilter !== "ALL" && order.channel !== channelFilter) {
          return false;
        }

        // Text search
        if (!q) return true;

        const inOrderNum = order.orderNumber.toLowerCase().includes(q);
        const inCustomer = order.customerName.toLowerCase().includes(q);
        const inPhone = order.phone.toLowerCase().includes(q);
        const inEmail = order.email ? order.email.toLowerCase().includes(q) : false;
        const inAddress = order.address
          ? order.address.toLowerCase().includes(q)
          : false;
        const inItems = order.itemsSummary.toLowerCase().includes(q);
        const inPayment = order.paymentId
          ? order.paymentId.toLowerCase().includes(q)
          : false;

        return (
          inOrderNum ||
          inCustomer ||
          inPhone ||
          inEmail ||
          inAddress ||
          inItems ||
          inPayment
        );
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "highest") {
          return b.totalPaise - a.totalPaise;
        }
        if (sortBy === "lowest") {
          return a.totalPaise - b.totalPaise;
        }
        // Default: newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [orders, search, statusFilter, channelFilter, sortBy]);

  function copyToClipboard(text: string, key: string) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  function exportCSV() {
    if (!filteredOrders.length) return;

    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Phone",
      "Email",
      "Address",
      "Channel",
      "Status",
      "Total (INR)",
      "Payment ID",
      "Items Count",
      "Items Summary",
      "Notes",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleString("en-IN")}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.phone}"`,
      `"${(o.email ?? "").replace(/"/g, '""')}"`,
      `"${(o.address ?? "").replace(/"/g, '""')}"`,
      `"${o.channel}"`,
      `"${o.status}"`,
      `"${(o.totalPaise / 100).toFixed(2)}"`,
      `"${o.paymentId ?? ""}"`,
      `"${o.itemsCount}"`,
      `"${o.itemsSummary.replace(/"/g, '""')}"`,
      `"${(o.notes ?? "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `nilgiribytes_orders_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrintInvoice(order: AdminOrderRow) {
    setActiveModalOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
  }

  return (
    <>
      {/* Metrics Row */}
      <div className="admin-stat-grid admin-orders_stats">
        <div className="admin-stat">
          <span className="admin-stat_label">Total Orders</span>
          <span className="admin-stat_value">{stats.totalOrders}</span>
          <span className="admin-stat_hint">All time placed</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat_label">Revenue</span>
          <span className="admin-stat_value">
            {formatINR(stats.totalRevenuePaise)}
          </span>
          <span className="admin-stat_hint">Excl. cancelled</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat_label">New Orders</span>
          <span className="admin-stat_value admin-stat_value--highlight">
            {stats.newOrders}
          </span>
          <span className="admin-stat_hint">Action required</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat_label">In Progress</span>
          <span className="admin-stat_value">{stats.inProgress}</span>
          <span className="admin-stat_hint">Confirmed & Packed</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat_label">Delivered</span>
          <span className="admin-stat_value">{stats.delivered}</span>
          <span className="admin-stat_hint">Fulfilled</span>
        </div>
      </div>

      {/* Main Table Container */}
      <section className="admin-panel admin-orders_panel">
        {/* Status Filter Tabs */}
        <div className="admin-orders_tabs" role="tablist" aria-label="Order status tabs">
          {(["ALL", ...STATUSES] as const).map((tab) => {
            const count = countsByStatus[tab] ?? 0;
            const active = statusFilter === tab;

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                className={`admin-orders_tab${active ? " is-active" : ""}`}
                onClick={() => setStatusFilter(tab)}
              >
                <span>{tab === "ALL" ? "All Orders" : tab}</span>
                <span className="admin-orders_tab-badge">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search, Channel Filter, Sort, CSV Export */}
        <div className="admin-orders_toolbar">
          <div className="admin-orders_search">
            <SearchIcon className="admin-orders_search-icon" />
            <input
              type="text"
              value={search}
              placeholder="Search by order #, customer, phone, email, address, or item..."
              onChange={(e) => setSearch(e.target.value)}
              className="admin-orders_search-input"
            />
            {search ? (
              <button
                type="button"
                className="admin-orders_search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                title="Clear search"
              >
                &times;
              </button>
            ) : null}
          </div>

          <div className="admin-orders_filters">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="admin-orders_filter-select"
              aria-label="Filter by channel"
            >
              <option value="ALL">All Channels</option>
              <option value="ONLINE">Online (Razorpay)</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="admin-orders_filter-select"
              aria-label="Sort orders"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>

            <button
              type="button"
              className="admin-btn admin-btn--small admin-orders_export-btn"
              onClick={exportCSV}
              disabled={!filteredOrders.length}
              title="Export current view to CSV"
            >
              <DownloadIcon className="admin-orders_btn-icon" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="admin-orders_summary-bar">
          <span className="admin-orders_count-text">
            Showing <strong>{filteredOrders.length}</strong> of{" "}
            <strong>{orders.length}</strong> order
            {orders.length === 1 ? "" : "s"}
          </span>
          {search || statusFilter !== "ALL" || channelFilter !== "ALL" ? (
            <button
              type="button"
              className="admin-link admin-orders_reset-link"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setChannelFilter("ALL");
              }}
            >
              Reset filters
            </button>
          ) : null}
        </div>

        {/* Orders Table */}
        {filteredOrders.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-orders_table">
              <thead>
                <tr>
                  <th style={{ width: "42px" }}>#</th>
                  <th>Order</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Channel & Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="admin-table_actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const { dateStr, timeStr } = formatOrderDateTime(order.createdAt);
                  const waNumber = sanitizePhoneForWhatsApp(order.phone);
                  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
                    `Hello ${order.customerName}, regarding your Nilgiribytes order ${order.orderNumber}:`
                  )}`;

                  return (
                    <tr key={order.id} className="admin-orders_row">
                      <td className="admin-orders_sno">{index + 1}</td>

                      {/* Order Number */}
                      <td>
                        <button
                          type="button"
                          className="admin-orders_num-btn"
                          onClick={() => setActiveModalOrder(order)}
                          title="Click to view order details"
                        >
                          <span className="admin-mono admin-orders_num">
                            {order.orderNumber}
                          </span>
                        </button>
                        <span className="admin-orders_time-ago">
                          {timeAgo(order.createdAt)}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td>
                        <span className="admin-orders_date">{dateStr}</span>
                        <span className="admin-orders_time">{timeStr}</span>
                      </td>

                      {/* Customer info */}
                      <td>
                        <span className="admin-table_primary">
                          {order.customerName}
                        </span>
                        <div className="admin-orders_contact-row">
                          <a
                            href={`tel:${order.phone}`}
                            className="admin-orders_contact-link"
                            title="Call customer"
                          >
                            <PhoneIcon className="admin-orders_inline-icon" />
                            <span>{order.phone}</span>
                          </a>

                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-orders_wa-link"
                            title="Message customer on WhatsApp"
                          >
                            <WhatsAppIcon className="admin-orders_inline-icon admin-orders_inline-icon--wa" />
                            <span>Chat</span>
                          </a>
                        </div>
                        {order.email ? (
                          <a
                            href={`mailto:${order.email}`}
                            className="admin-orders_email-link"
                            title={order.email}
                          >
                            <MailIcon className="admin-orders_inline-icon" />
                            <span>{order.email}</span>
                          </a>
                        ) : null}
                        {order.address ? (
                          <p className="admin-orders_address-preview" title={order.address}>
                            {order.address}
                          </p>
                        ) : null}
                      </td>

                      {/* Items */}
                      <td>
                        <div className="admin-orders_items-cell">
                          <span className="admin-orders_items-badge">
                            {order.itemsCount} item{order.itemsCount === 1 ? "" : "s"}
                          </span>
                          <span
                            className="admin-orders_items-summary"
                            title={order.itemsSummary}
                          >
                            {order.itemsSummary || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Channel & Payment */}
                      <td>
                        <div className="admin-orders_channel-cell">
                          <span
                            className={`admin-orders_channel-badge admin-orders_channel-badge--${order.channel.toLowerCase()}`}
                          >
                            {order.channel}
                          </span>

                          {order.paymentId ? (
                            <button
                              type="button"
                              className="admin-orders_payment-pill"
                              onClick={() =>
                                copyToClipboard(order.paymentId!, `pay-${order.id}`)
                              }
                              title="Click to copy Razorpay Payment ID"
                            >
                              <span className="admin-mono">{order.paymentId}</span>
                              <CopyIcon className="admin-orders_copy-icon" />
                              {copiedKey === `pay-${order.id}` ? (
                                <span className="admin-orders_copied-tooltip">
                                  Copied!
                                </span>
                              ) : null}
                            </button>
                          ) : null}
                        </div>
                      </td>

                      {/* Total */}
                      <td>
                        <span className="admin-orders_total">
                          {formatINR(order.totalPaise)}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <form
                          action={updateOrderStatusAction}
                          className="admin-orders_status-form"
                        >
                          <input type="hidden" name="id" value={order.id} />
                          <input type="hidden" name="returnTo" value="/admin/orders" />
                          <select
                            name="status"
                            defaultValue={order.status}
                            aria-label={`Update status for order ${order.orderNumber}`}
                            className={`admin-status-select admin-status-select--${order.status.toLowerCase()}`}
                            onChange={(e) => e.currentTarget.form?.requestSubmit()}
                          >
                            {STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </form>
                      </td>

                      {/* Actions */}
                      <td className="admin-table_actions">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--small admin-btn--icon"
                            onClick={() => setActiveModalOrder(order)}
                            title="Quick view order details & invoice"
                            aria-label={`View order ${order.orderNumber}`}
                          >
                            <EyeIcon />
                          </button>

                          <button
                            type="button"
                            className="admin-btn admin-btn--small admin-btn--ghost admin-btn--icon"
                            onClick={() => handlePrintInvoice(order)}
                            title="Print invoice slip"
                            aria-label={`Print order ${order.orderNumber}`}
                          >
                            <PrintIcon />
                          </button>

                          <Link
                            className="admin-btn admin-btn--small"
                            href={`/admin/orders?id=${order.id}`}
                            title="Open full order page"
                          >
                            Detail
                          </Link>

                          <form action={deleteOrderAction}>
                            <input type="hidden" name="id" value={order.id} />
                            <ConfirmSubmit
                              className="admin-btn admin-btn--small admin-btn--danger admin-btn--icon"
                              message={`Are you sure you want to delete order "${order.orderNumber}"? This cannot be undone.`}
                              label={`Delete order ${order.orderNumber}`}
                            >
                              <TrashIcon />
                            </ConfirmSubmit>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-orders_empty-state">
            <p className="admin-empty">No orders matching your filters.</p>
            {search || statusFilter !== "ALL" || channelFilter !== "ALL" ? (
              <button
                type="button"
                className="admin-btn admin-btn--small admin-btn--primary"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setChannelFilter("ALL");
                }}
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        )}
      </section>

      {/* Quick View / Invoice Slip Modal */}
      {activeModalOrder ? (
        <div
          className="admin-orders_modal-backdrop"
          onClick={() => setActiveModalOrder(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-order-title"
        >
          <div
            className="admin-orders_modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Head */}
            <div className="admin-orders_modal-head">
              <div>
                <p className="admin-orders_modal-sub">Order Details</p>
                <h2 id="modal-order-title" className="admin-orders_modal-title">
                  {activeModalOrder.orderNumber}
                </h2>
              </div>
              <div className="admin-orders_modal-head-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--small"
                  onClick={() => window.print()}
                  title="Print invoice slip"
                >
                  <PrintIcon className="admin-orders_btn-icon" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--small admin-btn--ghost admin-btn--icon"
                  onClick={() => setActiveModalOrder(null)}
                  aria-label="Close dialog"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Modal Body / Invoice View */}
            <div className="admin-orders_modal-body admin-print-invoice">
              {/* Brand Header for Print */}
              <div className="admin-invoice_brand">
                <div>
                  <h3 className="admin-invoice_brand-name">NILGIRIBYTES</h3>
                  <p className="admin-invoice_brand-sub">
                    Authentic Ooty Varkey & Hill Confections
                  </p>
                </div>
                <div className="admin-invoice_meta-head">
                  <p>
                    <strong>Invoice / Packing Slip</strong>
                  </p>
                  <p className="admin-mono">{activeModalOrder.orderNumber}</p>
                  <p>{new Date(activeModalOrder.createdAt).toLocaleString("en-IN")}</p>
                </div>
              </div>

              {/* Status and summary chips */}
              <div className="admin-invoice_chips no-print">
                <span
                  className={`admin-badge admin-badge--${activeModalOrder.status.toLowerCase()}`}
                >
                  Status: {activeModalOrder.status}
                </span>
                <span
                  className={`admin-orders_channel-badge admin-orders_channel-badge--${activeModalOrder.channel.toLowerCase()}`}
                >
                  Channel: {activeModalOrder.channel}
                </span>
                {activeModalOrder.paymentId ? (
                  <span className="admin-orders_payment-pill">
                    Payment ID: {activeModalOrder.paymentId}
                  </span>
                ) : null}
              </div>

              {/* Grid: Customer & Shipping Details */}
              <div className="admin-invoice_grid">
                <div className="admin-invoice_card">
                  <h4 className="admin-invoice_card-title">Customer Information</h4>
                  <dl className="admin-details">
                    <div>
                      <dt>Name</dt>
                      <dd>
                        <strong>{activeModalOrder.customerName}</strong>
                      </dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>
                        <a
                          className="admin-link"
                          href={`tel:${activeModalOrder.phone}`}
                        >
                          {activeModalOrder.phone}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{activeModalOrder.email ?? "—"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="admin-invoice_card">
                  <h4 className="admin-invoice_card-title">Delivery & Notes</h4>
                  <dl className="admin-details">
                    <div>
                      <dt>Address</dt>
                      <dd>{activeModalOrder.address ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Notes</dt>
                      <dd>{activeModalOrder.notes ?? "—"}</dd>
                    </div>
                    {activeModalOrder.razorpayOrderId ? (
                      <div>
                        <dt>Razorpay Order</dt>
                        <dd className="admin-mono">
                          {activeModalOrder.razorpayOrderId}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>

              {/* Items Table */}
              <div className="admin-invoice_items-card">
                <h4 className="admin-invoice_card-title">Order Items</h4>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-invoice_table">
                    <thead>
                      <tr>
                        <th style={{ width: "32px" }}>#</th>
                        <th>Item</th>
                        <th>Pack Size</th>
                        <th style={{ textAlign: "right" }}>Unit Price</th>
                        <th style={{ textAlign: "center" }}>Qty</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeModalOrder.items.map((item, i) => (
                        <tr key={item.id}>
                          <td>{i + 1}</td>
                          <td>
                            <strong>{item.nameSnapshot}</strong>
                          </td>
                          <td>{item.sizeLabel ?? "—"}</td>
                          <td style={{ textAlign: "right" }}>
                            {formatINR(item.unitPricePaise)}
                          </td>
                          <td style={{ textAlign: "center" }}>{item.quantity}</td>
                          <td style={{ textAlign: "right" }}>
                            {formatINR(item.lineTotalPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <dl className="admin-totals admin-invoice_totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{formatINR(activeModalOrder.subtotalPaise)}</dd>
                  </div>
                  <div>
                    <dt>Shipping</dt>
                    <dd>Free</dd>
                  </div>
                  <div className="admin-invoice_grand-total">
                    <dt>Grand Total</dt>
                    <dd>{formatINR(activeModalOrder.totalPaise)}</dd>
                  </div>
                </dl>
              </div>

              {/* Update Status Section inside Modal (hidden when printing) */}
              <div className="admin-invoice_update-section no-print">
                <h4 className="admin-invoice_card-title">Update Status</h4>
                <form
                  action={updateOrderStatusAction}
                  className="admin-orders_modal-status-form"
                >
                  <input type="hidden" name="id" value={activeModalOrder.id} />
                  <input type="hidden" name="returnTo" value="/admin/orders" />
                  <div className="admin-orders_modal-status-row">
                    <select
                      name="status"
                      defaultValue={activeModalOrder.status}
                      className="admin-field select"
                      style={{ padding: "0.55rem 0.8rem", width: "auto" }}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="admin-btn admin-btn--primary admin-btn--small"
                    >
                      Update Status
                    </button>
                    <Link
                      href={`/admin/orders?id=${activeModalOrder.id}`}
                      className="admin-btn admin-btn--small admin-btn--ghost"
                    >
                      Full Page View &rarr;
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
