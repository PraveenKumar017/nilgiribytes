"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderItemInput } from "@/lib/order-pricing";

interface PaymentCheckoutProps {
  amount: number; // in rupees, for display only
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  pincode: string;
  state: string;
  district: string;
  couponCode?: string;
  items: OrderItemInput[];
  codEnabled?: boolean;
  onSuccess: (paymentData: PaymentSuccessData) => void;
  onError: (error: string) => void;
  onClose?: () => void;
  onValidationError?: (errors: Record<string, string>) => void;
}

export interface PaymentSuccessData {
  orderId: string;
  paymentId: string;
  signature: string;
  orderNumber: string;
  databaseOrderId: number;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

interface RazorpayInstance {
  open(): void;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  method?: {
    netbanking?: boolean;
    card?: boolean;
    upi?: boolean;
    wallet?: boolean;
    paylater?: boolean;
  };
  modal?: {
    ondismiss: () => void;
  };
  theme: {
    color: string;
  };
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function PaymentCheckout({
  amount,
  description,
  customerName,
  customerEmail,
  customerPhone,
  address,
  pincode,
  state,
  district,
  couponCode,
  items,
  codEnabled = false,
  onSuccess,
  onError,
  onClose,
  onValidationError,
}: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");
  const scriptLoaded = useRef(false);

  // Load Razorpay script dynamically
  useEffect(() => {
    if (scriptLoaded.current) {
      console.log("Razorpay script already loaded");
      return;
    }

    console.log("Loading Razorpay script...");
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
      scriptLoaded.current = true;
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      onError("Failed to load Razorpay script. Please try again.");
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove the script to avoid reloading on component remount
    };
  }, [onError]);

  const handleCodOrder = async () => {
    setLoading(true);
    setStatus("Placing your order...");

    try {
      const response = await fetch("/api/create-cod-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          address,
          pincode,
          state,
          district,
          couponCode,
          items,
        }),
      });

      const result = await response.json().catch(() => null);

      if (
        !response.ok ||
        !result?.success ||
        typeof result.orderNumber !== "string" ||
        typeof result.paymentId !== "string"
      ) {
        throw new Error(result?.error || "Could not place your order.");
      }

      setStatus("Order placed successfully!");
      onSuccess({
        orderId: result.paymentId,
        paymentId: result.paymentId,
        signature: "",
        orderNumber: result.orderNumber,
        databaseOrderId: result.databaseOrderId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Order failed";
      setStatus(`Error: ${errorMessage}`);
      onError(errorMessage);
      setLoading(false);
    }
  };

  const handlePaymentClick = async () => {
    console.log("Payment button clicked");
    console.log("Props received:", {
      amount,
      description,
      customerName,
      customerPhone,
    });

    // Validate customer details
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.name = "Name is required";
    }

    if (!customerPhone.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(customerPhone.replace(/\D/g, ""))) {
      errors.mobile = "Enter a valid 10-digit mobile number";
    }

    if (!customerEmail.trim()) {
      errors.email = "Email ID is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      console.error("Validation errors:", errors);
      onValidationError?.(errors);
      onError("Please fill in all required fields");
      return;
    }

    if (paymentMethod === "COD") {
      await handleCodOrder();
      return;
    }

    if (!scriptLoaded.current || !window.Razorpay) {
      console.error("Razorpay script not loaded");
      onError("Razorpay is not loaded. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setStatus("Creating order...");

    try {
      console.log("Creating order with amount:", amount);
      // Step 1: Create order on backend
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          customerName,
          customerEmail,
          customerPhone,
          couponCode,
          items,
        }),
      });

      console.log("Order response status:", orderResponse.status);

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error("Order API error response:", errorText);
        throw new Error("Failed to create order");
      }

      const orderData = await orderResponse.json();
      console.log("Order created:", orderData);

      if (!orderData.success) {
        throw new Error(orderData.error || "Order creation failed");
      }

      setStatus("Opening payment gateway...");

      // Step 2: Open Razorpay checkout
      const razorpayOptions: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        order_id: orderData.orderId,
        name: "Nilgiribytes",
        description: description,
        image: "/assets/logo.png",
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        method: {
          netbanking: false,
          wallet: false,
        },
        handler: async (response: RazorpayPaymentResponse) => {
          console.log("Payment response:", response);
          setStatus("Verifying payment...");

          try {
            // Step 3: Verify payment on backend
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customerName,
                customerPhone,
                customerEmail,
                address,
                pincode,
                state,
                district,
                couponCode,
                items,
              }),
            });

            console.log("Verify response status:", verifyResponse.status);

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed");
            }

            const verifyData = await verifyResponse.json();
            console.log("Verification result:", verifyData);

            if (!verifyData.success) {
              throw new Error(verifyData.error || "Verification failed");
            }

            setStatus("Payment successful!");
            onSuccess({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              orderNumber: verifyData.orderNumber,
              databaseOrderId: verifyData.databaseOrderId,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Verification error";
            console.error("Verification error:", error);
            setStatus(`Error: ${errorMessage}`);
            onError(errorMessage);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal dismissed");
            setLoading(false);
            setStatus("");
            onClose?.();
          },
        },
        theme: {
          color: "#6B4423", // Nilgiribytes chocolate color
        },
      };

      console.log("Opening Razorpay with key:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      console.error("Payment error:", error);
      setStatus(`Error: ${errorMessage}`);
      onError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="payment-checkout">
      {codEnabled ? (
        <div className="payment-methods" role="radiogroup" aria-label="Payment method">
          <label
            className={`payment-method${
              paymentMethod === "ONLINE" ? " is-active" : ""
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="ONLINE"
              checked={paymentMethod === "ONLINE"}
              onChange={() => setPaymentMethod("ONLINE")}
              disabled={loading}
            />
            <span>Pay Online</span>
          </label>
          <label
            className={`payment-method${
              paymentMethod === "COD" ? " is-active" : ""
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
              disabled={loading}
            />
            <span>Cash on Delivery</span>
          </label>
        </div>
      ) : null}

      <button
        type="button"
        className="btn btn--primary"
        onClick={handlePaymentClick}
        disabled={loading}
        aria-busy={loading}
      >
        {loading
          ? "Processing..."
          : paymentMethod === "COD"
            ? "Place COD Order"
            : `Pay \u20b9${amount.toFixed(2)}`}
      </button>
      {status && (
        <p className="payment-status" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
