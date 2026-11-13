"use client";

import { useMemo, useState, useEffect } from "react";
import { formatINR } from "@/lib/format";
import {
  CouponIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  TrashIcon,
} from "@/components/admin/icons";

export type Coupon = {
  id: number | string;
  code: string;
  title: string;
  discountType: "fixed" | "percentage";
  discountValue: number; // e.g. 100 for ₹100 or 15 for 15%
  minOrderPaise: number; // in paise
  maxDiscountPaise?: number | null; // in paise (for percentage)
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function CouponsManager({
  initialCoupons = [],
}: {
  initialCoupons?: Coupon[];
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isLoading, setIsLoading] = useState(initialCoupons.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "fixed" | "percentage">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<"fixed" | "percentage">("fixed");
  const [formValue, setFormValue] = useState<number>(100);
  const [formMinOrder, setFormMinOrder] = useState<number>(499);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number>(200);

  // Toast / Feedback State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Sync with database prefetched coupons
  useEffect(() => {
    try {
      localStorage.removeItem("nilgiribytes_admin_coupons_v1");
      localStorage.removeItem("nilgiri_admin_coupons");
    } catch {
      // Ignore
    }
    setCoupons(initialCoupons);
    setIsLoading(false);
  }, [initialCoupons]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormTitle("");
    setFormType("fixed");
    setFormValue(100);
    setFormMinOrder(499);
    setFormMaxDiscount(200);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormTitle(coupon.title);
    setFormType(coupon.discountType);
    setFormValue(coupon.discountValue);
    setFormMinOrder(Math.round(coupon.minOrderPaise / 100));
    setFormMaxDiscount(coupon.maxDiscountPaise ? Math.round(coupon.maxDiscountPaise / 100) : 200);
    setIsModalOpen(true);
  };

  // Save Coupon to Database (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleanCode) return;

    setIsSubmitting(true);

    try {
      if (editingCoupon) {
        // Update in DB
        const payload = {
          id: editingCoupon.id,
          code: cleanCode,
          title: formTitle.trim() || `${formType === "fixed" ? `₹${formValue} OFF` : `${formValue}% OFF`} coupon`,
          discountType: formType,
          discountValue: Number(formValue) || 0,
          minOrderPaise: (Number(formMinOrder) || 0) * 100,
          maxDiscountPaise: formType === "percentage" ? (Number(formMaxDiscount) || 0) * 100 : null,
          isActive: editingCoupon.isActive,
        };

        const res = await fetch("/api/admin/coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Failed to update coupon in database.", "error");
          setIsSubmitting(false);
          return;
        }

        // Update local state
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === editingCoupon.id
              ? {
                  ...c,
                  code: cleanCode,
                  title: payload.title,
                  discountType: formType,
                  discountValue: payload.discountValue,
                  minOrderPaise: payload.minOrderPaise,
                  maxDiscountPaise: payload.maxDiscountPaise,
                  isActive: editingCoupon.isActive,
                }
              : c
          )
        );

        showToast(`Coupon "${cleanCode}" saved to database successfully!`, "success");
      } else {
        // Create in DB (defaults to active)
        const payload = {
          code: cleanCode,
          title: formTitle.trim() || `${formType === "fixed" ? `₹${formValue} OFF` : `${formValue}% OFF`} coupon`,
          discountType: formType,
          discountValue: Number(formValue) || 0,
          minOrderPaise: (Number(formMinOrder) || 0) * 100,
          maxDiscountPaise: formType === "percentage" ? (Number(formMaxDiscount) || 0) * 100 : null,
          isActive: true,
        };

        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Failed to create coupon in database.", "error");
          setIsSubmitting(false);
          return;
        }

        if (data.coupon) {
          setCoupons((prev) => [data.coupon, ...prev]);
        }
        showToast(`Coupon "${cleanCode}" created and saved to database!`, "success");
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error saving coupon:", err);
      showToast("Network error while connecting to database.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status in DB
  const handleToggleStatus = async (id: number | string) => {
    const target = coupons.find((c) => c.id === id);
    if (!target) return;

    const nextState = !target.isActive;

    // Optimistically update
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: nextState } : c))
    );

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          toggleActive: true,
          isActive: nextState,
        }),
      });

      if (!res.ok) {
        // Revert
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: target.isActive } : c))
        );
        const data = await res.json();
        showToast(data.error || "Failed to update status in database.", "error");
        return;
      }

      showToast(
        `Coupon "${target.code}" is now ${nextState ? "Active" : "Inactive"}.`,
        "success"
      );
    } catch {
      // Revert on network failure
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: target.isActive } : c))
      );
      showToast("Network error updating status.", "error");
    }
  };

  // Delete coupon from DB
  const handleDeleteCoupon = async (id: number | string, code: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${code}" from the database?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Failed to delete coupon from database.", "error");
        return;
      }

      setCoupons((prev) => prev.filter((c) => c.id !== id));
      showToast(`Coupon "${code}" permanently removed from database.`, "success");
    } catch {
      showToast("Network error deleting coupon.", "error");
    }
  };

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? c.isActive
          : !c.isActive;

      const matchesType =
        typeFilter === "ALL" ? true : c.discountType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [coupons, search, statusFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive).length;
    const fixedOffers = coupons.filter((c) => c.discountType === "fixed").length;
    const percentOffers = coupons.filter((c) => c.discountType === "percentage").length;
    return { total, active, fixedOffers, percentOffers };
  }, [coupons]);

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Coupons &amp; Discounts</h1>
          <p className="admin-page-text">
            Create and manage promotional discount coupons saved in the MySQL database.
          </p>
        </div>
        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleOpenCreate}
          >
            + Create Coupon
          </button>
        </div>
      </header>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`admin-alert ${
            toast.type === "error" ? "admin-alert--error" : "admin-alert--success"
          }`}
          role="status"
        >
          {toast.type === "success" && <CheckIcon className="admin-alert_icon" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Stat Metrics Grid */}
      <div className="admin-stat-grid admin-coupon-stats">
        <div className="admin-stat">
          <span className="admin-stat_label">Total Coupons</span>
          <span className="admin-stat_value">{stats.total}</span>
          <span className="admin-stat_hint">Saved in database</span>
        </div>

        <div className="admin-stat">
          <span className="admin-stat_label">Active Codes</span>
          <span className="admin-stat_value" style={{ color: "#2e7d32" }}>
            {stats.active}
          </span>
          <span className="admin-stat_hint">Live on storefront</span>
        </div>

        <div className="admin-stat">
          <span className="admin-stat_label">Fixed Price Discounts</span>
          <span className="admin-stat_value">{stats.fixedOffers}</span>
          <span className="admin-stat_hint">₹ OFF direct value</span>
        </div>

        <div className="admin-stat">
          <span className="admin-stat_label">Percentage Discounts</span>
          <span className="admin-stat_value">{stats.percentOffers}</span>
          <span className="admin-stat_hint">% OFF order value</span>
        </div>
      </div>

      {/* Controls & Filters */}
      <section className="admin-panel">
        <div className="admin-coupon-toolbar">
          <div className="admin-coupon-search">
            <input
              type="text"
              placeholder="Search by code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input"
            />
            {search && (
              <button
                type="button"
                className="admin-coupon-search_clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="admin-coupon-filters">
            <div className="admin-coupon-tabs" role="tablist">
              <button
                type="button"
                className={`admin-coupon-tab${statusFilter === "ALL" ? " is-active" : ""}`}
                onClick={() => setStatusFilter("ALL")}
              >
                All ({coupons.length})
              </button>
              <button
                type="button"
                className={`admin-coupon-tab${statusFilter === "ACTIVE" ? " is-active" : ""}`}
                onClick={() => setStatusFilter("ACTIVE")}
              >
                Active ({coupons.filter((c) => c.isActive).length})
              </button>
              <button
                type="button"
                className={`admin-coupon-tab${statusFilter === "INACTIVE" ? " is-active" : ""}`}
                onClick={() => setStatusFilter("INACTIVE")}
              >
                Inactive ({coupons.filter((c) => !c.isActive).length})
              </button>
            </div>

            <select
              className="admin-coupon-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              aria-label="Filter by discount type"
            >
              <option value="ALL">All Types</option>
              <option value="fixed">Fixed Price (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>
        </div>

        {/* Coupons Table */}
        {isLoading ? (
          <div className="admin-coupon-empty">
            <p>Loading coupons from database...</p>
          </div>
        ) : filteredCoupons.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-coupon-table">
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Discount Offer</th>
                  <th>Min Order</th>
                  <th>Status</th>
                  <th className="admin-table_actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className={!coupon.isActive ? "is-inactive" : ""}>
                    <td>
                      <div className="admin-coupon-code-cell">
                        <span className="admin-coupon-code-badge">
                          <CouponIcon className="admin-coupon-code-icon" />
                          <strong>{coupon.code}</strong>
                        </span>
                        <span className="admin-coupon-title-sub" title={coupon.title}>
                          {coupon.title}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-coupon-discount-cell">
                        <span
                          className={`admin-coupon-discount-pill ${
                            coupon.discountType === "fixed" ? "is-fixed" : "is-percent"
                          }`}
                        >
                          {coupon.discountType === "fixed"
                            ? `₹${coupon.discountValue} OFF`
                            : `${coupon.discountValue}% OFF`}
                        </span>
                        {coupon.discountType === "percentage" && coupon.maxDiscountPaise && (
                          <span className="admin-coupon-discount-meta">
                            Up to {formatINR(coupon.maxDiscountPaise)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="admin-coupon-min-order">
                        {coupon.minOrderPaise > 0
                          ? formatINR(coupon.minOrderPaise)
                          : "No minimum"}
                      </span>
                    </td>

                    <td>
                      <label className="admin-coupon-toggle" title="Click to toggle status">
                        <input
                          type="checkbox"
                          checked={coupon.isActive}
                          onChange={() => handleToggleStatus(coupon.id)}
                        />
                        <span className="admin-coupon-toggle-slider" />
                        <span className="admin-coupon-toggle-label">
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                    </td>

                    <td className="admin-table_actions">
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn--icon"
                          onClick={() => handleOpenEdit(coupon)}
                          title="Edit coupon"
                          aria-label="Edit coupon"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--icon admin-btn--danger"
                          onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                          title="Delete coupon"
                          aria-label="Delete coupon"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-coupon-empty">
            <div className="admin-coupon-empty_icon">
              <CouponIcon />
            </div>
            <h3>No coupons found</h3>
            <p>
              {search || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "No coupons match the selected filter criteria."
                : "No coupons exist in the database. Create your first promotional discount!"}
            </p>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleOpenCreate}
            >
              + Create First Coupon
            </button>
          </div>
        )}
      </section>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div
          className="admin-coupon-modal-backdrop"
          onClick={() => !isSubmitting && setIsModalOpen(false)}
        >
          <div
            className="admin-coupon-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="admin-coupon-modal-head">
              <div>
                <h2 id="coupon-modal-title" className="admin-coupon-modal-title">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </h2>
                <p className="admin-coupon-modal-sub">
                  {editingCoupon
                    ? "Update coupon discount values and save to the database."
                    : "Configure discount rules and save the new coupon to the database."}
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--icon"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                aria-label="Close modal"
                disabled={isSubmitting}
              >
                <CloseIcon />
              </button>
            </header>

            <form onSubmit={handleSubmitForm} className="admin-coupon-modal-content">
              <div className="admin-coupon-modal-body">
                <div className="admin-coupon-form-grid">
                  {/* Coupon Code */}
                  <div className="admin-field admin-field--full">
                    <label htmlFor="cpn-code">Coupon Code *</label>
                    <input
                      id="cpn-code"
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                      placeholder="e.g. NILGIRI100"
                      required
                      disabled={isSubmitting}
                      className="admin-input admin-input--code"
                    />
                    <span className="admin-field_hint">
                      Codes are automatically uppercased and spaces are stripped.
                    </span>
                  </div>

                  {/* Offer Description */}
                  <div className="admin-field admin-field--full">
                    <label htmlFor="cpn-title">Offer Description *</label>
                    <input
                      id="cpn-title"
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Flat ₹100 off on first box"
                      required
                      disabled={isSubmitting}
                      className="admin-input"
                    />
                    <span className="admin-field_hint">
                      Short description displayed to customers under the coupon code.
                    </span>
                  </div>

                  {/* Discount Type */}
                  <div className="admin-field">
                    <label htmlFor="cpn-type">Discount Type *</label>
                    <select
                      id="cpn-type"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as "fixed" | "percentage")}
                      disabled={isSubmitting}
                      className="admin-input"
                    >
                      <option value="fixed">Fixed Price Discount (₹ Flat OFF)</option>
                      <option value="percentage">Percentage Discount (% OFF)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  <div className="admin-field">
                    <label htmlFor="cpn-value">
                      {formType === "fixed" ? "Discount Amount (₹) *" : "Discount Percentage (%) *"}
                    </label>
                    <input
                      id="cpn-value"
                      type="number"
                      min={1}
                      max={formType === "percentage" ? 100 : 10000}
                      value={formValue}
                      onChange={(e) => setFormValue(Number(e.target.value))}
                      required
                      disabled={isSubmitting}
                      className="admin-input"
                    />
                  </div>

                  {/* Min Order Value */}
                  <div className={`admin-field ${formType === "fixed" ? "admin-field--full" : ""}`}>
                    <label htmlFor="cpn-min">Minimum Order Value (₹)</label>
                    <input
                      id="cpn-min"
                      type="number"
                      min={0}
                      step={10}
                      value={formMinOrder}
                      onChange={(e) => setFormMinOrder(Number(e.target.value))}
                      disabled={isSubmitting}
                      className="admin-input"
                    />
                    <span className="admin-field_hint">Set 0 for no minimum threshold.</span>
                  </div>

                  {/* Max Discount Cap (Only for Percentage) */}
                  {formType === "percentage" ? (
                    <div className="admin-field">
                      <label htmlFor="cpn-max-cap">Maximum Discount Cap (₹)</label>
                      <input
                        id="cpn-max-cap"
                        type="number"
                        min={10}
                        step={10}
                        value={formMaxDiscount}
                        onChange={(e) => setFormMaxDiscount(Number(e.target.value))}
                        disabled={isSubmitting}
                        className="admin-input"
                      />
                      <span className="admin-field_hint">Limits max discount amount.</span>
                    </div>
                  ) : null}
                </div>

                {/* Live Preview Card */}
                <div className="admin-coupon-preview-box">
                  <span className="admin-coupon-preview-tag">Customer View Preview</span>
                  <div className="admin-coupon-preview-card">
                    <div className="admin-coupon-preview-left">
                      <span className="admin-coupon-preview-badge">
                        {formType === "fixed" ? `FLAT ₹${formValue || 0} OFF` : `${formValue || 0}% OFF`}
                      </span>
                      <span className="admin-coupon-preview-code">
                        {formCode.trim().toUpperCase() || "YOURCODE"}
                      </span>
                    </div>
                    <div className="admin-coupon-preview-right">
                      <span className="admin-coupon-preview-title">
                        {formTitle.trim() ||
                          (formType === "fixed"
                            ? `Flat ₹${formValue || 0} discount on your order`
                            : `${formValue || 0}% off on selected order`)}
                      </span>
                      <span className="admin-coupon-preview-terms">
                        {formMinOrder > 0 ? `Min. order ₹${formMinOrder}` : "No minimum order"}
                        {formType === "percentage" && formMaxDiscount ? ` • Max cap ₹${formMaxDiscount}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Pinned Modal Footer */}
              <footer className="admin-coupon-modal-foot">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving to DB..."
                    : editingCoupon
                    ? "Save Changes"
                    : "Create Coupon"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
