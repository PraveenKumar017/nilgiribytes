import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content">
      <section className="section">
        <div className="container" style={{ textAlign: "center", maxWidth: 640 }}>
          <span className="section-kicker">404</span>
          <h1 className="section-heading">Page Not Found</h1>
          <p className="section-intro">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.8rem",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: "1.6rem",
            }}
          >
            <Link className="btn btn--primary" href="/">
              Go Home
            </Link>
            <Link className="btn btn--outline" href="/shop">
              Shop Now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
