import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | Nilgiribytes",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="main-content" className="not-found">
      <section className="not-found_inner" aria-labelledby="not-found-title">
        <span className="section-kicker">404</span>
        <h1 className="section-heading" id="not-found-title">
          Page Not Found
        </h1>
        <p className="section-intro">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="not-found_actions">
          <Link className="btn btn--primary" href="/">
            Go Home
          </Link>
          <Link className="btn btn--outline" href="/shop">
            Shop Now
          </Link>
        </div>
      </section>
    </main>
  );
}
