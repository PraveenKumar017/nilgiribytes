"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { useCart } from "@/components/cart-provider";
import { SafeImage } from "@/components/safe-image";
import { PaymentCheckout } from "@/components/payment-checkout";

interface CustomerDetails {
  name: string;
  mobile: string;
  address: string;
  pincode: string;
  state: string;
  district: string;
}

const STORAGE_KEY = "nilgiribytes_customer_details";

export function CartView() {
  const { lines, ready, count, subtotal, changeQty } = useCart();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [previousCount, setPreviousCount] = useState(0);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    mobile: "",
    address: "",
    pincode: "",
    state: "",
    district: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load customer details from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomerDetails(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load customer details from storage:", error);
      }
    }
  }, []);

  // Show modal when cart count increases
  useEffect(() => {
    if (ready && count > 0 && previousCount === 0) {
      // First item added
      console.log("First item added, showing customer modal");
      setShowCustomerModal(true);
    } else if (ready && count > previousCount && previousCount > 0) {
      // Cart count increased but customer details already saved
      if (!customerDetails.name) {
        setShowCustomerModal(true);
      }
    }
    setPreviousCount(count);
  }, [count, ready, previousCount, customerDetails.name]);

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
    }

    if (!customerDetails.district.trim()) {
      errors.district = "District is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomerDetails = () => {
    if (validateForm()) {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerDetails));
      console.log("Customer details saved:", customerDetails);
      setShowCustomerModal(false);
    }
  };

  const handlePaymentSuccess = (data: any) => {
    setShowPaymentForm(false);
    alert(`Payment successful! Order ID: ${data.orderId}`);
    // TODO: Clear cart and redirect to success page
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const handleValidationError = (errors: Record<string, string>) => {
    setFormErrors(errors);
  };

  const handlePayOnlineClick = () => {
    console.log("Pay online clicked");
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

  const orderHref = whatsappLink(buildOrderMessage(lines));

  return (
    <>
      {/* Customer Details Modal */}
      {showCustomerModal && (
        <>
          <div
            className="modal-overlay"
            onClick={() => {
              if (customerDetails.name) setShowCustomerModal(false);
            }}
          />
          <div className="modal modal-customer" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2 className="modal-title">Delivery Details</h2>
            </div>
            <div className="modal-body">
              <p className="modal-description">Please provide your delivery details to proceed.</p>

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
                  <input
                    type="text"
                    id="modal-state"
                    name="state"
                    value={customerDetails.state}
                    onChange={handleInputChange}
                    placeholder="State name"
                    className={`form-input ${formErrors.state ? "is-error" : ""}`}
                  />
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
                className="btn btn--primary"
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
              </div>
            </div>
          ))}
        </div>

        <aside className="cart-page_summary" aria-label="Order summary">
          <h2 className="cart-page_summary-title">Order Summary</h2>
          <div className="cart-summary">
            <span>Items</span>
            <span>{count} {count === 1 ? "item" : "items"}</span>
          </div>
          <hr className="cart-page_summary-rule" />
          <div className="cart-summary cart-summary--total">
            <span>Subtotal</span>
            <span className="cart-summary_total">{formatINR(subtotal)}</span>
          </div>
          <p className="cart-page_delivery-note">
            Delivery or pickup charges, if any, are confirmed on WhatsApp.
          </p>

          {paymentError && (
            <div className="cart-page_payment-error" role="alert">
              {paymentError}
            </div>
          )}

          {showPaymentForm ? (
            <>
              <div className="cart-page_payment-verification">
                <h3 className="verification-title">Verify Your Details</h3>
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

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Edit Details
                  </button>
                  <PaymentCheckout
                    amount={Math.ceil(subtotal / 100)}
                    description="Nilgiribytes Bakery Order"
                    customerName={customerDetails.name}
                    customerEmail={`${customerDetails.mobile}@order.nilgiribytes`}
                    customerPhone={customerDetails.mobile}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onValidationError={handleValidationError}
                    onClose={() => setShowPaymentForm(false)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <a
                className="btn btn--whatsapp cart-page_order-btn"
                href={orderHref}
                target="_blank"
                rel="noopener"
                style={{
                  padding: "0.5rem 1.4rem",
                  fontSize: "0.86rem",
                  lineHeight: 1.2,
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="cart-page_wa-icon">
                  <path d="M12 2a9.9 9.9 0 0 0-8.5 15.1L2 22l5-1.4A9.9 9.9 0 1 0 12 2Zm0 1.8a8.1 8.1 0 0 1 6.6 12.9 8.1 8.1 0 0 1-11.2 2.2l-.4-.2-3 .8.8-2.9-.2-.4A8.1 8.1 0 0 1 12 3.8Zm-3.3 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.7s1.5-.6 1.7-1.2c.2-.6.2-1.1.1-1.2l-.6-.3-1.6-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.8-1.9c-.2-.4-.4-.4-.6-.4h-.5Z" />
                </svg>
                Order on WhatsApp
              </a>

              <button
                type="button"
                className="btn btn--primary"
                onClick={handlePayOnlineClick}
                style={{
                  padding: "0.5rem 1.4rem",
                  fontSize: "0.86rem",
                  lineHeight: 1.2,
                  marginTop: "0.75rem",
                  width: "100%",
                }}
              >
                Pay Online
              </button>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
