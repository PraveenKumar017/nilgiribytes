"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  updateOrderStatusAction,
  updateOrderTrackingAction,
  deleteOrderAction,
} from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/admin-ui";
import {
  CloseIcon,
  DownloadIcon,
  EyeIcon,
  FilterIcon,
  PrintIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/admin/icons";
import type { AdminOrderRow } from "@/lib/admin";
import { formatINR } from "@/lib/format";
import {
  ORDER_STATUS_OPTIONS,
  normalizeOrderStatus,
  orderStatusLabel,
} from "@/lib/order-status";

// Typed wrappers so <form action={...}> gets (formData: FormData) => Promise<void>
async function updateStatus(formData: FormData): Promise<void> {
  await updateOrderStatusAction(null, formData);
}
async function updateTracking(formData: FormData): Promise<void> {
  await updateOrderTrackingAction(null, formData);
}
async function deleteOrder(formData: FormData): Promise<void> {
  await deleteOrderAction(null, formData);
}

const STATUS_OPTIONS = ORDER_STATUS_OPTIONS;

const STATUS_TABS = [
  { value: "ALL", label: "All Orders" },
  ...ORDER_STATUS_OPTIONS,
] as const;

function formatOrderDateTime(date: Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function numberToWordsINR(amountPaise: number): string {
  const amountRupees = Math.floor(amountPaise / 100);
  if (amountRupees <= 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertChunk(num: number): string {
    let s = "";
    if (num >= 100) {
      s += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      s += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }
    if (num > 0) {
      s += ones[num] + " ";
    }
    return s.trim();
  }

  const crore = Math.floor(amountRupees / 10000000);
  const lakh = Math.floor((amountRupees % 10000000) / 100000);
  const thousand = Math.floor((amountRupees % 100000) / 1000);
  const remainder = amountRupees % 1000;

  let res = "";
  if (crore) res += convertChunk(crore) + " Crore ";
  if (lakh) res += convertChunk(lakh) + " Lakh ";
  if (thousand) res += convertChunk(thousand) + " Thousand ";
  if (remainder) res += convertChunk(remainder) + " ";

  return res.trim() + " Rupees Only";
}

export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [activeModalOrder, setActiveModalOrder] = useState<AdminOrderRow | null>(
    null
  );
  const [printOrder, setPrintOrder] = useState<AdminOrderRow | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    if (!filterModalOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFilterModalOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filterModalOpen]);

  // Statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const ordered = orders.filter(
      (o) => normalizeOrderStatus(o.status) === "NEW"
    ).length;
    const packed = orders.filter(
      (o) => normalizeOrderStatus(o.status) === "PACKED"
    ).length;
    const dispatched = orders.filter(
      (o) => normalizeOrderStatus(o.status) === "DELIVERED"
    ).length;
    const totalRevenuePaise = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.totalPaise, 0);

    return {
      totalOrders,
      ordered,
      packed,
      dispatched,
      totalRevenuePaise,
    };
  }, [orders]);

  // Status counts for tabs
  const countsByStatus = useMemo(() => {
    const map: Record<string, number> = { ALL: orders.length };
    for (const option of STATUS_OPTIONS) {
      map[option.value] = 0;
    }
    for (const o of orders) {
      const value = normalizeOrderStatus(o.status);
      map[value] = (map[value] ?? 0) + 1;
    }
    return map;
  }, [orders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders
      .filter((order) => {
        // Status filter
        if (
          statusFilter !== "ALL" &&
          normalizeOrderStatus(order.status) !== statusFilter
        ) {
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
      `"${orderStatusLabel(o.status)}"`,
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
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintOrder(null), 500);
    }, 80);
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
          <span className="admin-stat_label">Ordered</span>
          <span className="admin-stat_value admin-stat_value--highlight">
            {stats.ordered}
          </span>
          <span className="admin-stat_hint">Awaiting packing</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat_label">Packed</span>
          <span className="admin-stat_value">{stats.packed}</span>
          <span className="admin-stat_hint">Ready to dispatch</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat_label">Dispatched</span>
          <span className="admin-stat_value">{stats.dispatched}</span>
          <span className="admin-stat_hint">On the way</span>
        </div>
      </div>

      {/* Main Table Container */}
      <section className="admin-panel admin-orders_panel">
        {/* Status Filter Tabs */}
        <div className="admin-orders_tabs" role="tablist" aria-label="Order status tabs">
          {STATUS_TABS.map((tab) => {
            const count = countsByStatus[tab.value] ?? 0;
            const active = statusFilter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                className={`admin-orders_tab${active ? " is-active" : ""}`}
                onClick={() => setStatusFilter(tab.value)}
              >
                <span>{tab.label}</span>
                <span className="admin-orders_tab-badge">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search, Channel Filter, Sort, CSV Export */}
        <div className="admin-orders_toolbar">
          <button
            type="button"
            className="admin-orders_filter-btn"
            onClick={() => setFilterModalOpen(true)}
            aria-label="Filter orders by status"
          >
            <FilterIcon className="admin-orders_btn-icon" />
            <span>Filters</span>
            {statusFilter !== "ALL" ? (
              <span className="admin-orders_filter-btn-badge">
                {countsByStatus[statusFilter] ?? 0}
              </span>
            ) : null}
          </button>

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
                  <th>Channel</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="admin-table_actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  return (
                    <tr key={order.id} className="admin-orders_row">
                      <td className="admin-orders_sno">{index + 1}</td>

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
                      </td>

                      {/* Date & Time (dd/mm/yyyy HH:mm) */}
                      <td>
                        <span className="admin-orders_date">
                          {formatOrderDateTime(order.createdAt)}
                        </span>
                      </td>

                      {/* Customer info: Name and Phone only */}
                      <td>
                        <span className="admin-table_primary">
                          {order.customerName}
                        </span>
                        <span
                          className="admin-table_sub"
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-ink)",
                            marginTop: "0.2rem",
                          }}
                        >
                          {order.phone}
                        </span>
                      </td>

                      {/* Items: count only */}
                      <td>
                        <span className="admin-orders_items-badge">
                          {order.itemsCount} item{order.itemsCount === 1 ? "" : "s"}
                        </span>
                      </td>

                      {/* Channel: badge only (no payment ID) */}
                      <td>
                        <span
                          className={`admin-orders_channel-badge admin-orders_channel-badge--${order.channel.toLowerCase()}`}
                        >
                          {order.channel}
                        </span>
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
                          action={updateStatus}
                          className="admin-orders_status-form"
                        >
                          <input type="hidden" name="id" value={order.id} />
                          <input type="hidden" name="returnTo" value="/admin/orders" />
                          <select
                            name="status"
                            defaultValue={normalizeOrderStatus(order.status)}
                            aria-label={`Update status for order ${order.orderNumber}`}
                            className={`admin-status-select admin-status-select--${normalizeOrderStatus(order.status).toLowerCase()}`}
                            onChange={(e) => e.currentTarget.form?.requestSubmit()}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </form>
                      </td>

                      {/* Actions: Eye, Print, Delete icon only */}
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
                            className="admin-btn admin-btn--small admin-btn--icon"
                            onClick={() => handlePrintInvoice(order)}
                            title="Print invoice slip"
                            aria-label={`Print order ${order.orderNumber}`}
                          >
                            <PrintIcon />
                          </button>

                          <form action={deleteOrder}>
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

      {/* Order Detail Modal */}
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
            {/* Modal Header */}
            <div className="odm-head">
              <div className="odm-head_info">
                <span className={`admin-badge admin-badge--${normalizeOrderStatus(activeModalOrder.status).toLowerCase()} odm-status-badge`}>
                  {orderStatusLabel(activeModalOrder.status)}
                </span>
                <h2 id="modal-order-title" className="odm-order-num">
                  {activeModalOrder.orderNumber}
                </h2>
                <span className="odm-date">{formatOrderDateTime(activeModalOrder.createdAt)}</span>
              </div>
              <div className="odm-head_actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--small admin-btn--ghost"
                  onClick={() => handlePrintInvoice(activeModalOrder)}
                  title="Print invoice"
                >
                  <PrintIcon className="admin-orders_btn-icon" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--small admin-btn--ghost admin-btn--icon"
                  onClick={() => setActiveModalOrder(null)}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="odm-body">

              {/* Top info row: channel + payment */}
              <div className="odm-meta-row">
                <div className="odm-meta-item">
                  <span className="odm-meta-label">Channel</span>
                  <span className={`admin-orders_channel-badge admin-orders_channel-badge--${activeModalOrder.channel.toLowerCase()}`}>
                    {activeModalOrder.channel}
                  </span>
                </div>
                <div className="odm-meta-item">
                  <span className="odm-meta-label">Payment</span>
                  <span className="odm-meta-value">
                    {activeModalOrder.channel === "ONLINE" ? "Online (Razorpay)" : "WhatsApp / COD"}
                  </span>
                </div>
                {activeModalOrder.paymentId ? (
                  <div className="odm-meta-item odm-meta-item--wide">
                    <span className="odm-meta-label">Payment ID</span>
                    <span className="odm-meta-value admin-mono" style={{ fontSize: "0.78rem" }}>
                      {activeModalOrder.paymentId}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Two-col: Customer + Shipping */}
              <div className="odm-two-col">
                {/* Customer */}
                <div className="odm-card">
                  <div className="odm-card_title">Customer</div>
                  <div className="odm-card_body">
                    <p className="odm-customer-name">{activeModalOrder.customerName}</p>
                    <div className="odm-field-row">
                      <span className="odm-field-label">Phone</span>
                      <a href={`tel:${activeModalOrder.phone}`} className="odm-field-val odm-link">
                        {activeModalOrder.phone}
                      </a>
                    </div>
                    {activeModalOrder.email ? (
                      <div className="odm-field-row">
                        <span className="odm-field-label">Email</span>
                        <a href={`mailto:${activeModalOrder.email}`} className="odm-field-val odm-link">
                          {activeModalOrder.email}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="odm-card">
                  <div className="odm-card_title">Shipping Address</div>
                  <div className="odm-card_body">
                    {activeModalOrder.address ? (
                      <p className="odm-address">{activeModalOrder.address}</p>
                    ) : (
                      <p className="odm-address odm-address--empty">No address provided</p>
                    )}
                    {activeModalOrder.notes ? (
                      <div className="odm-notes">
                        <span className="odm-notes-label">Notes:</span>
                        <span className="odm-notes-val">{activeModalOrder.notes}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="odm-card">
                <div className="odm-card_title">
                  Items
                  <span className="odm-items-count">{activeModalOrder.itemsCount} item{activeModalOrder.itemsCount === 1 ? "" : "s"}</span>
                </div>
                <div className="odm-items-list">
                  {activeModalOrder.items.map((item, idx) => (
                    <div key={item.id} className="odm-item-row">
                      <span className="odm-item-idx">{idx + 1}</span>
                      <div className="odm-item-info">
                        <span className="odm-item-name">{item.nameSnapshot}</span>
                        {item.sizeLabel ? (
                          <span className="odm-item-size">{item.sizeLabel}</span>
                        ) : null}
                      </div>
                      <span className="odm-item-unit">{formatINR(item.unitPricePaise)}</span>
                      <span className="odm-item-qty">× {item.quantity}</span>
                      <span className="odm-item-total">{formatINR(item.lineTotalPaise)}</span>
                    </div>
                  ))}

                  {/* Total row */}
                  <div className="odm-total-row">
                    <span className="odm-total-label">Total</span>
                    <span className="odm-total-val">{formatINR(activeModalOrder.totalPaise)}</span>
                  </div>
                </div>
              </div>

              {/* Tracking ID */}
              <div className="odm-card">
                <div className="odm-card_title">Tracking ID</div>
                <div className="odm-card_body">
                  <form action={updateTracking} className="odm-status-form">
                    <input type="hidden" name="id" value={activeModalOrder.id} />
                    <input type="hidden" name="returnTo" value="/admin/orders" />
                    <input
                      type="text"
                      name="trackingId"
                      defaultValue={activeModalOrder.trackingId ?? ""}
                      placeholder="Enter courier tracking ID"
                      maxLength={120}
                      className="odm-tracking-input"
                      aria-label="Tracking ID"
                    />
                    <button
                      type="submit"
                      className="admin-btn admin-btn--primary admin-btn--small"
                    >
                      Save
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </div>

      ) : null}

      {/* Mobile Status Filter Modal */}
      {filterModalOpen ? (
        <div
          className="admin-orders_modal-backdrop"
          onClick={() => setFilterModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="orders-filter-title"
        >
          <div
            className="admin-orders_filter-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="odm-head">
              <div className="odm-head_info">
                <h2 id="orders-filter-title" className="odm-order-num">
                  Filter Orders
                </h2>
                <span className="odm-date">Filter by order status</span>
              </div>
              <div className="odm-head_actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--small admin-btn--ghost admin-btn--icon"
                  onClick={() => setFilterModalOpen(false)}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="admin-orders_filter-list">
              {STATUS_TABS.map((tab) => {
                const count = countsByStatus[tab.value] ?? 0;
                const active = statusFilter === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    className={`admin-orders_filter-option${active ? " is-active" : ""}`}
                    onClick={() => {
                      setStatusFilter(tab.value);
                      setFilterModalOpen(false);
                    }}
                  >
                    <span>{tab.label}</span>
                    <span className="admin-orders_tab-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Hidden print-only invoice — rendered outside modal, shown only via @media print */}
      {printOrder ? (
        <div className="inv-print-only" aria-hidden="true">
          <div className="admin-invoice-sheet">
            {/* Watermark */}
            <div className="inv-watermark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo-bg.png" alt="" />
            </div>

            <div className="inv-header">
              <div className="inv-brand-box">
                <h1 className="inv-brand-title">NILGIRIBYTES</h1>
                <p className="inv-brand-tagline">Authentic Ooty Varkey &amp; Hill Confections</p>
                <p className="inv-company-details">
                  Commercial Road, Ooty, The Nilgiris, Tamil Nadu - 643001<br />
                  FSSAI Lic. No: <strong>12423018000451</strong><br />
                  Support: +91 94897 45317 | support@nilgiribytes.com<br />
                  Website: www.nilgiribytes.com
                </p>
              </div>
              <div className="inv-meta-box">
                <div className="inv-tax-badge">TAX INVOICE</div>
                <table className="inv-meta-table">
                  <tbody>
                    <tr>
                      <th>Invoice / Order:</th>
                      <td className="inv-order-no">{printOrder.orderNumber}</td>
                    </tr>
                    <tr>
                      <th>Invoice Date:</th>
                      <td>{formatOrderDateTime(printOrder.createdAt)}</td>
                    </tr>
                    <tr>
                      <th>Payment Mode:</th>
                      <td>
                        <strong>
                          {printOrder.channel === "ONLINE"
                            ? "PAID (Online Razorpay)"
                            : "WHATSAPP ORDER"}
                        </strong>
                      </td>
                    </tr>
                    {printOrder.paymentId ? (
                      <tr>
                        <th>Payment ID:</th>
                        <td className="admin-mono" style={{ fontSize: "0.74rem" }}>
                          {printOrder.paymentId}
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <th>Status:</th>
                      <td>
                        <span className={`admin-badge admin-badge--${normalizeOrderStatus(printOrder.status).toLowerCase()}`}>
                          {orderStatusLabel(printOrder.status)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="inv-parties-grid">
              <div className="inv-party-card">
                <div className="inv-party-card_head">BILLED TO / SHIP TO</div>
                <div className="inv-party-card_body">
                  <p className="inv-customer-name">{printOrder.customerName}</p>
                  <p className="inv-customer-line"><strong>Phone:</strong> {printOrder.phone}</p>
                  {printOrder.email ? (
                    <p className="inv-customer-line"><strong>Email:</strong> {printOrder.email}</p>
                  ) : null}
                  <p className="inv-customer-address">
                    <strong>Shipping Address:</strong><br />
                    {printOrder.address || "Standard delivery address on file"}
                  </p>
                </div>
              </div>
              <div className="inv-party-card">
                <div className="inv-party-card_head">DISPATCH &amp; FULFILLMENT</div>
                <div className="inv-party-card_body">
                  <p className="inv-customer-line"><strong>Channel:</strong> {printOrder.channel}</p>
                  <p className="inv-customer-line"><strong>State / Supply Code:</strong> Tamil Nadu (33)</p>
                  <p className="inv-customer-line"><strong>Dispatch Facility:</strong> Ooty Bakery Hub</p>
                  {printOrder.notes ? (
                    <p className="inv-customer-notes">
                      <strong>Delivery Instructions:</strong><br />
                      {printOrder.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="inv-table-wrap">
              <table className="inv-items-table">
                <thead>
                  <tr>
                    <th style={{ width: "36px", textAlign: "center" }}>#</th>
                    <th style={{ textAlign: "left" }}>Item Description</th>
                    <th style={{ width: "110px", textAlign: "center" }}>Pack Size</th>
                    <th style={{ width: "105px", textAlign: "right" }}>Unit Price</th>
                    <th style={{ width: "55px", textAlign: "center" }}>Qty</th>
                    <th style={{ width: "115px", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {printOrder.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td><strong>{item.nameSnapshot}</strong></td>
                      <td style={{ textAlign: "center" }}>{item.sizeLabel ?? "—"}</td>
                      <td style={{ textAlign: "right" }}>{formatINR(item.unitPricePaise)}</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{formatINR(item.lineTotalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="inv-calculation-grid">
              <div className="inv-terms-box">
                <p className="inv-amount-words">
                  <strong>Amount in Words:</strong><br />
                  <em>{numberToWordsINR(printOrder.totalPaise)}</em>
                </p>
                <div className="inv-notes-block">
                  <p className="inv-notes-title">Terms &amp; Conditions:</p>
                  <ol className="inv-terms-list">
                    <li>Freshness guaranteed. Store in an airtight container upon receipt.</li>
                    <li>All applicable taxes &amp; packaging fees are included in the price.</li>
                    <li>For queries or reorders, WhatsApp or call us at +91 94897 45317.</li>
                  </ol>
                </div>
              </div>
              <div className="inv-totals-box">
                <table className="inv-totals-table">
                  <tbody>
                    <tr>
                      <th>Items Subtotal:</th>
                      <td>{formatINR(printOrder.subtotalPaise)}</td>
                    </tr>
                    <tr>
                      <th>Shipping / Courier:</th>
                      <td style={{ color: "#2e7d32", fontWeight: 700 }}>FREE</td>
                    </tr>
                    <tr>
                      <th>Taxes &amp; Packaging:</th>
                      <td>Included</td>
                    </tr>
                    <tr className="inv-grand-total-row">
                      <th>Grand Total:</th>
                      <td>{formatINR(printOrder.totalPaise)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="inv-footer">
              <div className="inv-stamp-box">
                <span className="inv-check-mark">&#10003;</span>
                <div>
                  <p className="inv-stamp-title">AUTHENTIC NILGIRIBYTES INVOICE</p>
                  <p className="inv-stamp-sub">Computer Generated — No Physical Signature Required</p>
                </div>
              </div>
              <div className="inv-thanks-box">
                <p className="inv-thanks-title">Thank you for ordering with Nilgiribytes!</p>
                <p className="inv-thanks-sub">Bringing Ooty&apos;s authentic bakery heritage to your home.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
