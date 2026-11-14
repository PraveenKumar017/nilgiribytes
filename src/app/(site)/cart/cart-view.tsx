"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";
import { cartLinePackedWeightGrams, itemMrp } from "@/lib/cart";
import { getShippingQuote, INDIAN_STATES, stateToZone } from "@/lib/shipping";
import { useCart } from "@/components/cart-provider";
import { SafeImage } from "@/components/safe-image";
import {
  PaymentCheckout,
  type PaymentSuccessData,
} from "@/components/payment-checkout";
import type { CartLine, StoreProduct, Catalog, AppliedCoupon } from "@/lib/types";
import { ProductCollection } from "@/components/product-collection";

interface CustomerDetails {
  name: string;
  email: string;
  mobile: string;
  address: string;
  pincode: string;
  state: string;
  district: string;
}

const STORAGE_KEY = "nilgiribytes_customer_details";

function isComboLine(line: {
  kind?: string;
  category?: string;
  slug?: string;
  name?: string;
}): boolean {
  return (
    line.kind === "combo" ||
    line.category === "Combos" ||
    line.slug === "build-your-own-combo" ||
    /\bcombo\b/i.test(line.name ?? "")
  );
}

function isTrialCombo(line: { slug?: string; name?: string }): boolean {
  const slug = (line.slug ?? "").toLowerCase();
  const name = (line.name ?? "").toLowerCase();
  return slug === "trial-combo" || /\btrial\b|\btrail\b/.test(name);
}

function lineMrpFromCatalog(
  line: CartLine,
  catalog: Catalog | null
): number | null {
  if (!catalog) return null;
  const item = [...catalog.products, ...catalog.combos].find(
    (entry) => entry.slug === line.slug
  );
  if (!item) return null;
  const sizeIndex =
    item.kind === "product"
      ? Math.max(
          0,
          item.sizes.findIndex((size) => size.label === line.sizeLabel)
        )
      : 0;
  return itemMrp(item, sizeIndex);
}

function buildItemsPayload(lines: CartLine[]) {
  return lines.map((line) => ({
    kind: line.kind,
    slug: line.slug,
    sizeLabel: line.sizeLabel,
    quantity: line.qty,
    picks: line.picks?.map((pick) => ({ slug: pick.slug })),
  }));
}

const EMPTY_CUSTOMER_DETAILS: CustomerDetails = {
  name: "",
  email: "",
  mobile: "",
  address: "",
  pincode: "",
  state: "",
  district: "",
};

export function CartView({
  offerBannerEnabled,
  codEnabled,
}: {
  offerBannerEnabled: boolean;
  codEnabled: boolean;
}) {
  const router = useRouter();
  const { lines, ready, count, subtotal, changeQty, clear } = useCart();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [hasShownModalOnce, setHasShownModalOnce] = useState(false);
  const [customerDetailsReady, setCustomerDetailsReady] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [previousCount, setPreviousCount] = useState(0);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<StoreProduct[]>([]);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(
    EMPTY_CUSTOMER_DETAILS
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Load customer details from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomerDetails({ ...EMPTY_CUSTOMER_DETAILS, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error("Failed to load customer details from storage:", error);
    } finally {
      setCustomerDetailsReady(true);
    }
  }, []);

  // Fetch catalog and generate related products
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch("/api/catalog");
        if (response.ok) {
          const data: Catalog = await response.json();
          setCatalog(data);
          console.log("Catalog fetched, total products:", data.products.length);
          console.log("Cart lines:", lines.length);
          console.log("Cart item details:", lines.map(l => ({ id: l.id, name: l.name, kind: l.kind })));

          // Get IDs of items already in cart (both products and combos)
          const cartItemIds = new Set(lines.map((line) => line.id));
          console.log("Cart item IDs to exclude:", Array.from(cartItemIds));

          // Filter products not in cart
          const availableProducts = data.products.filter(
            (p) => !cartItemIds.has(p.id)
          );
          console.log("Available products after filtering:", availableProducts.length);
          console.log("Available product IDs:", availableProducts.map(p => p.id).slice(0, 4));

          if (availableProducts.length > 0) {
            // Shuffle and select 4 random products
            const shuffled = availableProducts.sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(4, shuffled.length));
            console.log("Selected related products count:", selected.length);
            console.log("Selected products:", selected.map(p => ({ id: p.id, name: p.name })));
            setRelatedProducts(selected);
          } else {
            console.warn("No products available after filtering - showing first 4 products anyway");
            // If all products are in cart, show the first 4 anyway
            const fallback = data.products.slice(0, 4).sort(() => Math.random() - 0.5);
            setRelatedProducts(fallback);
          }
        } else {
          console.error("Failed to fetch catalog, status:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch catalog:", error);
      }
    };

    if (lines.length > 0) {
      console.log("Fetching catalog for", lines.length, "cart items");
      fetchCatalog();
    } else {
      console.log("No items in cart, clearing related products");
      setRelatedProducts([]);
    }
  }, [lines]);

  // Show modal only on FIRST cart item add if no customer details are saved yet
  useEffect(() => {
    if (!ready || !customerDetailsReady) return;

    if (
      count > 0 &&
      previousCount === 0 &&
      (!customerDetails.name || !customerDetails.email) &&
      !hasShownModalOnce
    ) {
      // First item added, details incomplete, and haven't shown modal before
      setShowCustomerModal(true);
      setHasShownModalOnce(true); // Mark that we've shown the modal once
    }
    // Update previous count
    if (count !== previousCount) {
      setPreviousCount(count);
    }
  }, [
    count,
    ready,
    customerDetailsReady,
    previousCount,
    customerDetails.name,
    customerDetails.email,
    hasShownModalOnce,
  ]);

  // Re-validate the applied coupon whenever the cart changes.
  useEffect(() => {
    const appliedCode = coupon?.code;
    if (!appliedCode || lines.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: appliedCode,
            items: buildItemsPayload(lines),
          }),
        });
        const data = await response.json().catch(() => null);
        if (cancelled) return;

        if (!response.ok || !data?.success) {
          setCoupon(null);
          setCouponError(data?.error || "This coupon is no longer valid.");
          return;
        }

        setCoupon(data.coupon as AppliedCoupon);
      } catch {
        // Keep the current coupon; checkout re-validates server-side.
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [subtotal, coupon?.code, lines]);

  // Lock page scroll and close on Escape while the verification panel is open.
  useEffect(() => {
    if (!showPaymentForm) return;

    document.body.classList.add("is-locked");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowPaymentForm(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("is-locked");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showPaymentForm]);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: buildItemsPayload(lines),
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data.coupon) {
        setCoupon(null);
        setCouponError(data?.error || "Could not apply this coupon.");
        return;
      }

      setCoupon(data.coupon as AppliedCoupon);
      setCouponInput(data.coupon.code);
    } catch {
      setCouponError("Could not apply this coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerDetails.name.trim()) {
      errors.name = "Name is required";
    }

    if (!customerDetails.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(customerDetails.mobile.replace(/\D/g, ""))) {
      errors.mobile = "Enter a valid 10-digit mobile number";
    }

    if (!customerDetails.email.trim()) {
      errors.email = "Email ID is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (!customerDetails.address.trim()) {
      errors.address = "Address is required";
    }

    if (!customerDetails.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(customerDetails.pincode)) {
      errors.pincode = "Pincode must be 6 digits";
    }

    if (!customerDetails.state.trim()) {
      errors.state = "State is required";
    } else if (!stateToZone(customerDetails.state)) {
      errors.state = "Select a valid delivery state";
    }

    if (!customerDetails.district.trim()) {
      errors.district = "District is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const persistCustomerDetails = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customerDetails));
    console.log("Customer details saved:", customerDetails);
  };

  const handleSaveCustomerDetails = () => {
    if (validateForm()) {
      persistCustomerDetails();
      setShowCustomerModal(false);
      // Don't show modal again even if cart count changes
    }
  };

  const handlePaymentSuccess = (data: PaymentSuccessData) => {
    setShowPaymentForm(false);
    clear();
    router.push(
      `/order-confirmation?order=${encodeURIComponent(
        data.orderNumber
      )}&payment=${encodeURIComponent(data.paymentId)}`
    );
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const handleValidationError = (errors: Record<string, string>) => {
    setFormErrors(errors);
  };

  const handlePayOnlineClick = () => {
    if (!validateForm()) {
      setShowPaymentForm(false);
      setShowCustomerModal(true);
      return;
    }
    setShowPaymentForm(true);
    setPaymentError("");
  };

  if (!ready) {
    return (
      <div className="cart-page_head">
        <div>
          <span className="section-kicker">Your order</span>
          <h1 className="section-heading cart-page_title" id="cart-title">
            Shopping Cart
          </h1>
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <>
        <div className="cart-page_head reveal" data-reveal="fade-up">
          <div>
            <span className="section-kicker">Your order</span>
            <h1 className="section-heading cart-page_title" id="cart-title">
              Shopping Cart
            </h1>
          </div>
          <Link className="cart-page_continue" href="/shop">
            &larr; Continue shopping
          </Link>
        </div>

        <div className="empty-state cart-page_empty reveal" data-reveal="fade-up">
          <svg className="cart-page_empty-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6 5 3H2" />
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
          <p className="cart-page_empty-title">Your cart is empty</p>
          <p className="cart-page_empty-text">Fresh varkey and biscuits are waiting at the shop.</p>
          <Link
            className="btn btn--primary"
            href="/shop"
            style={{
              padding: "0.5rem 1.4rem",
              fontSize: "0.86rem",
              lineHeight: 1.2,
            }}
          >
            Browse Products
          </Link>
        </div>
      </>
    );
  }

  const showComboSample = lines.some(
    (line) => isComboLine(line) && !isTrialCombo(line)
  );

  const orderSavings = lines.reduce((sum, line) => {
    const mrp = line.mrpPaise ?? lineMrpFromCatalog(line, catalog);
    if (typeof mrp === "number" && mrp > line.pricePaise) {
      return sum + (mrp - line.pricePaise) * line.qty;
    }
    return sum;
  }, 0);

  const paymentItems = buildItemsPayload(lines);
  const discountPaise = coupon?.discountPaise ?? 0;
  const shippingQuote = getShippingQuote(
    customerDetails.state,
    subtotal,
    lines.map((line) => ({
      packedWeightGrams: cartLinePackedWeightGrams(line),
      quantity: line.qty,
    }))
  );
  const shippingPaise = shippingQuote?.shippingPaise ?? 0;
  const totalPaise = Math.max(0, subtotal - discountPaise) + shippingPaise;

  return (
    <>
      {/* Customer Details Modal - Show on first item add (no saved details) or when user clicks Edit Details */}
      {customerDetailsReady && showCustomerModal && (
        <>
          <div
            className="modal-overlay"
            // Don't allow dismissing until details are saved
            onClick={() => {}}
            style={{ pointerEvents: customerDetails.name ? "auto" : "none" }}
          />
          <div className="modal modal-customer" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2 className="modal-title">Delivery Details</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Close delivery details"
                onClick={() => setShowCustomerModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">

              <div className="form-group">
                <label htmlFor="modal-name">Name *</label>
                <input
                  type="text"
                  id="modal-name"
                  name="name"
                  value={customerDetails.name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className={`form-input ${formErrors.name ? "is-error" : ""}`}
                />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="modal-mobile">Mobile Number *</label>
                <input
                  type="tel"
                  id="modal-mobile"
                  name="mobile"
                  value={customerDetails.mobile}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  className={`form-input ${formErrors.mobile ? "is-error" : ""}`}
                />
                {formErrors.mobile && <span className="form-error">{formErrors.mobile}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="modal-email">Email ID *</label>
                <input
                  type="email"
                  id="modal-email"
                  name="email"
                  value={customerDetails.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`form-input ${formErrors.email ? "is-error" : ""}`}
                />
                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="modal-address">Address *</label>
                <textarea
                  id="modal-address"
                  name="address"
                  value={customerDetails.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  rows={3}
                  className={`form-textarea ${formErrors.address ? "is-error" : ""}`}
                />
                {formErrors.address && <span className="form-error">{formErrors.address}</span>}
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="modal-pincode">Pincode *</label>
                  <input
                    type="text"
                    id="modal-pincode"
                    name="pincode"
                    value={customerDetails.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    className={`form-input ${formErrors.pincode ? "is-error" : ""}`}
                  />
                  {formErrors.pincode && <span className="form-error">{formErrors.pincode}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="modal-state">State *</label>
                  <select
                    id="modal-state"
                    name="state"
                    value={customerDetails.state}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.state ? "is-error" : ""}`}
                  >
                    <option value="">Select delivery state</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {formErrors.state && <span className="form-error">{formErrors.state}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-district">District *</label>
                <input
                  type="text"
                  id="modal-district"
                  name="district"
                  value={customerDetails.district}
                  onChange={handleInputChange}
                  placeholder="District name"
                  className={`form-input ${formErrors.district ? "is-error" : ""}`}
                />
                {formErrors.district && <span className="form-error">{formErrors.district}</span>}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--outline"
                onClick={handleSaveCustomerDetails}
              >
                Save Details
              </button>
            </div>
          </div>
        </>
      )}

      <div className="cart-page_head reveal" data-reveal="fade-up">
        <div>
          <span className="section-kicker">Your order</span>
          <h1 className="section-heading cart-page_title" id="cart-title">
            Shopping Cart
          </h1>
        </div>
        <Link className="cart-page_continue" href="/shop">
          &larr; Continue shopping
        </Link>
      </div>

      {offerBannerEnabled && showComboSample && (
        <div className="cart-page_sample-note">
          <span className="cart-page_sample-note-title">
            A Little Something Extra !
          </span>
          <p className="cart-page_sample-note-text">
            Enjoy this complimentary 10g sample from NilgiriBytes. Discover
            another favourite. <span className="cart-page_sample-note-small">
            With every combo purchase, except the Trial Combo.
          </span>
          </p>
          
        </div>
      )}

      <div className="cart-page_grid">
        <div className="cart-page_lines">
          {lines.map((line) => (
            <div className="cart-line" key={line.key}>
              <div className="cart-line_media">
                <SafeImage
                  className="cart-line_img"
                  src={line.image}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                />
              </div>
              <div className="cart-line_info">
                <div className="cart-line_row">
                  <p className="cart-line_name">{line.name}</p>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      onClick={() => changeQty(line.key, -1)}
                      aria-label={`Decrease quantity of ${line.name}`}
                    >
                      &minus;
                    </button>
                    <span aria-live="polite">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(line.key, 1)}
                      aria-label={`Increase quantity of ${line.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-line_row">
                  <p className="cart-line_meta">
                    {line.sizeLabel} &middot; {formatINR(line.pricePaise)} each
                  </p>
                  <p className="cart-line_price">{formatINR(line.pricePaise * line.qty)}</p>
                </div>
                {line.picks?.length ? (
                  <p className="cart-line_meta">
                    {line.picks.map((pick) => pick.name).join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <aside className="cart-page_summary" aria-label="Order summary">
          <h2 className="cart-page_summary-title">Order Summary</h2>
          <div className="cart-page_summary-lines">
            <div className="cart-summary">
              <span>Total Items</span>
              <span>{count} {count === 1 ? "item" : "items"}</span>
            </div>
            <div className="cart-summary">
              <span>Price</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            {coupon && discountPaise > 0 && (
              <div className="cart-summary cart-page_coupon-discount">
                <span>Coupon ({coupon.code})</span>
                <span>&minus;{formatINR(discountPaise)}</span>
              </div>
            )}
            <div className="cart-summary">
              <span>Delivery Fee</span>
              <span className={shippingPaise === 0 ? "cart-summary_free" : undefined}>
                {shippingQuote
                  ? shippingQuote.baseShippingPaise === 0
                    ? "Free"
                    : formatINR(shippingQuote.baseShippingPaise)
                  : "Select state"}
              </span>
            </div>
            {shippingQuote && shippingQuote.shippingDiscountPaise > 0 && (
              <div className="cart-summary cart-page_coupon-discount">
                <span>Delivery offer</span>
                <span>
                  &minus;{formatINR(shippingQuote.shippingDiscountPaise)}
                </span>
              </div>
            )}
            <hr className="cart-page_summary-rule" />
            <div className="cart-summary cart-summary--total">
              <span>Total</span>
              <span className="cart-summary_total">{formatINR(totalPaise)}</span>
            </div>
          </div>

          <div className="cart-page_coupon">
            <label className="cart-page_coupon-label" htmlFor="cart-coupon">
              Have a coupon?
            </label>
            <div className="cart-page_coupon-row">
              <input
                id="cart-coupon"
                type="text"
                className="cart-page_coupon-input"
                value={couponInput}
                onChange={(event) => {
                  setCouponInput(event.target.value.toUpperCase());
                  if (couponError) setCouponError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !coupon && !couponLoading) {
                    event.preventDefault();
                    handleApplyCoupon();
                  }
                }}
                placeholder="Enter coupon code"
                autoComplete="off"
                spellCheck={false}
                disabled={!!coupon || couponLoading}
              />
              {coupon ? (
                <button
                  type="button"
                  className="cart-page_coupon-btn is-remove"
                  onClick={handleRemoveCoupon}
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="cart-page_coupon-btn"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                >
                  {couponLoading ? "Checking..." : "Apply"}
                </button>
              )}
            </div>
            {couponError && (
              <p className="cart-page_coupon-message is-error" role="alert">
                {couponError}
              </p>
            )}
            {coupon && (
              <p className="cart-page_coupon-message is-success">
                {coupon.title} applied. You saved {formatINR(discountPaise)}.
              </p>
            )}
          </div>

          {orderSavings > 0 && (
            <div className="cart-page_savings">
              <span className="cart-page_savings-label">
                Savings on this order
              </span>
              <span className="cart-page_savings-value">
                {formatINR(orderSavings)}
              </span>
            </div>
          )}

          {paymentError && (
            <div className="cart-page_payment-error" role="alert">
              {paymentError}
            </div>
          )}

          <button
            type="button"
            className="btn btn--primary"
            onClick={handlePayOnlineClick}
            style={{
              padding: "0.5rem 1.4rem",
              fontSize: "0.86rem",
              lineHeight: 1.2,
              width: "100%",
            }}
          >
            Pay Now
          </button>
        </aside>
      </div>

      {showPaymentForm && (
        <>
          <div
            className="cart-verify-overlay"
            onClick={() => setShowPaymentForm(false)}
          />
          <div
            className="cart-verify-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="verify-title"
          >
            <div className="cart-verify-panel_header">
              <h3 className="verification-title" id="verify-title">
                Verify Your Details
              </h3>
              <button
                type="button"
                className="modal-close cart-verify-panel_close"
                aria-label="Close verification"
                onClick={() => setShowPaymentForm(false)}
              >
                &times;
              </button>
            </div>

            <div className="cart-verify-panel_body">
              <div className="verification-details">
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{customerDetails.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Mobile:</span>
                  <span className="detail-value">{customerDetails.mobile}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{customerDetails.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{customerDetails.address}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pincode:</span>
                  <span className="detail-value">{customerDetails.pincode}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">State:</span>
                  <span className="detail-value">{customerDetails.state}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">District:</span>
                  <span className="detail-value">{customerDetails.district}</span>
                </div>
              </div>

              <div className="cart-verify-panel_note">
                <span>Amount payable</span>
                <strong>{formatINR(totalPaise)}</strong>
              </div>

              {paymentError && (
                <div className="cart-page_payment-error" role="alert">
                  {paymentError}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setShowCustomerModal(true);
                  }}
                >
                  Edit Details
                </button>
                <PaymentCheckout
                  amount={Math.ceil(totalPaise / 100)}
                  description="Nilgiribytes Bakery Order"
                  customerName={customerDetails.name}
                  customerEmail={customerDetails.email}
                  customerPhone={customerDetails.mobile}
                  address={customerDetails.address}
                  pincode={customerDetails.pincode}
                  state={customerDetails.state}
                  district={customerDetails.district}
                  couponCode={coupon?.code}
                  items={paymentItems}
                  codEnabled={codEnabled}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onValidationError={handleValidationError}
                  onClose={() => setShowPaymentForm(false)}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* You may also like section - Full width white background */}
      {relatedProducts.length > 0 && (
        <section 
          className="section section--alt" 
          aria-labelledby="related-title" 
          style={{ 
            marginTop: "3rem",
            marginLeft: "calc(-50vw + 50%)", 
            marginRight: "calc(-50vw + 50%)",
            marginBottom: 0,
            paddingTop: "3rem",
            paddingBottom: "3rem",
            paddingLeft: "var(--page-padding)",
            paddingRight: "var(--page-padding)"
          }}
        >
          <div className="container">
            <span className="section-kicker reveal" data-reveal="fade-up">
              You may also like
            </span>
            <h2
              className="section-heading"
              style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)" }}
              data-reveal="fade-up"
              id="related-title"
            >
              More Products
            </h2>
            <p 
              className="section-intro reveal" 
              data-reveal="fade-up"
              style={{ marginTop: "1rem", marginBottom: "2rem" }}
            >
              Explore our other delicious offerings and discover your next favorite treat.
            </p>
            <div className="product-grid" style={{ marginTop: "2.5rem" }}>
              <ProductCollection items={relatedProducts} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
