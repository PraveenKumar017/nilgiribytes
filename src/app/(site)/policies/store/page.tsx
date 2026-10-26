import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Store Policies | Nilgiribytes",
  description:
    "Nilgiribytes shipping, payments, returns and refund policies.",
  path: "/policies/store",
});

export default function StorePolicyPage() {
  return (
    <main id="main-content">
      <section className="page-hero" aria-labelledby="policy-title">
        <div className="container">
          <span className="section-kicker">Legal</span>
          <h1 className="page-hero_title" id="policy-title">
            Store Policies
          </h1>
          <p className="page-hero_text">
            Shipping, Payments, Returns &amp; Refunds
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="article" style={{ maxWidth: 900 }}>
            <div className="article_content">
              <h2>Account</h2>

              <h3>1. Do I have to create an account to make a purchase?</h3>
              <p>
                You don&apos;t need any registration or account creation to
                browse through our store. However, you will have to login with
                your Mobile No. via an OTP to allow us to help.
              </p>

              <h3>2. How can I see my orders?</h3>
              <p>
                You can go to the My Orders section on the storefront and see
                your orders.
              </p>

              <h3>3. Is ordering on your website secure?</h3>
              <p>
                Absolutely. We value your privacy and uphold your data to the
                highest safety standards. All transactions are completely secure
                and processed with secure paths via reputed payment gateways
                following global standards.
              </p>
              <p>All information is access controlled and cannot be released.</p>

              <h2>Shipping</h2>

              <h3>4. Do you deliver Pan-India?</h3>
              <p>Yes. We serve more than 28000 pin codes across India.</p>

              <h3>5. What are the general shipping or delivery timelines?</h3>
              <p>
                We take 24-48 hours to process your order and prepare it for
                logistics partner to pick-up. The logistics partner takes 3-4
                days to deliver the product post pick-up.
              </p>

              <h3>6. What are the shipping charges associated with an order?</h3>
              <p>
                The shipping charges for your order will be calculated and
                displayed at checkout.
              </p>

              <h3>7. How do I track my order?</h3>
              <p>
                You can track your orders from our website and separately you will
                get email and Whatsapp notifications from our logistics partner.
              </p>

              <h2>Payments</h2>

              <h3>8. What payment methods do you accept?</h3>
              <p>You can pay for your orders using any of the payment methods below:</p>
              <ul>
                <li>Cards (Visa / Mastercard / Rupay / Discover / Amex)</li>
                <li>UPI</li>
                <li>Net Banking</li>
                <li>Wallets</li>
                <li>BNPL (Buy Now, Pay Later)</li>
              </ul>

              <h3>9. Do you offer COD (Cash on Delivery)?</h3>
              <p>
                We currently don&apos;t offer COD. All other online payment
                methods are available as mentioned above.
              </p>

              <h3>10. Will I get automatic refund for failed payments?</h3>
              <p>
                Yes. You will get an automated refund into your original payment
                source within 7-10 working days.
              </p>

              <h3>11. What if I have issues with my order?</h3>
              <p>
                Please reach out to us from the Whatsapp icon on the storefront
                or contact us with the details mentioned in the &quot;Reach out
                to Us&quot; section. We will try to resolve all your issues on
                priority.
              </p>

              <h2>Return &amp; Refund Policy</h2>

              <p>
                <strong>Return items within 1 day(s) of delivery</strong>
              </p>
              <p>
                <strong>&#8377;10 return fee applicable</strong>
              </p>
              <p>
                <strong>Keep the tags and packaging intact</strong>
              </p>

              <p>
                At Nilgiribytes, we strive to deliver fresh and high-quality
                products to every customer.
              </p>
              <p>
                Due to the perishable nature of our food products, we do not
                accept returns once the order has been delivered.
              </p>
              <p>However, if you receive:</p>
              <ul>
                <li>A damaged product</li>
                <li>An incorrect product</li>
                <li>A missing item</li>
                <li>A product with packaging defects</li>
              </ul>
              <p>
                Please contact us within 24 hours of delivery with your order
                number and clear photos of the product and packaging.
              </p>
              <p>
                After verification, we may offer a replacement, store credit, or
                refund at our discretion.
              </p>
              <p>
                Refunds, if approved, will be processed within 7 business days to
                the original payment method.
              </p>

              <h3>For assistance, contact:</h3>
              <p>
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </p>
              <p>Thank you for choosing Nilgiribytes.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
