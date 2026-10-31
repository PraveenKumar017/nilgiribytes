import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata } from "@/lib/seo";
import {
  absoluteUrl,
  CONTACT_EMAIL,
  PHONE_TEL,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import { WholesaleEnquiryForm } from "./enquiry-form";
import { PartnersMarquee } from "./partners-marquee";

export const metadata: Metadata = pageMetadata({
  title: "Wholesale, Bulk Orders & Corporate Gifting | Nilgiribytes",
  description:
    "Partner with Nilgiribytes for wholesale Ooty Varkey, distributor supply, cafe and restaurant orders, bulk purchases and corporate gifting from Kotagiri.",
  keywords: [
    "wholesale Ooty Varkey",
    "Ooty Varkey distributor",
    "Ooty Varkey bulk order",
    "wholesale bakery Kotagiri",
    "Nilgiri bakery distributor",
    "cafe bakery supplier",
    "corporate gifting Nilgiris",
    "bulk biscuits supplier",
  ],
  path: "/wholesale",
  image: "/assets/wholesale_bg.png",
});

const CARD_TYPE_TO_FORM_TYPE: Record<string, string> = {
  "Wholesale supply": "Wholesale supply",
  "Distributor partnership": "Distributor partnership",
  "Cafes & restaurants": "Cafe / restaurant supply",
  "Bulk orders": "Bulk order",
  "Corporate gifting": "Corporate gifting",
};

const ENQUIRY_TYPES = [
  {
    title: "Wholesale supply",
    text: "Retail-ready varkey and biscuits for shops, supermarkets and stores.",
    icon: "package",
  },
  {
    title: "Distributor partnership",
    text: "Discuss territory, repeat supply and distribution for your market.",
    icon: "distribution",
  },
  {
    title: "Cafes & restaurants",
    text: "Tea-time bakes and biscuits for cafes, bakeries and hospitality menus.",
    icon: "cafe",
  },
  {
    title: "Bulk orders",
    text: "Larger quantities for events, festivals, resale or community orders.",
    icon: "bulk",
  },
  {
    title: "Corporate gifting",
    text: "Thoughtful Nilgiri bakery gifts for employees, clients and occasions.",
    icon: "gift",
  },
] as const;

const WHY_REASONS = [
  {
    title: "Bakery-direct pricing",
    text: "Straight-from-the-bakery wholesale rates with margin-friendly pack options for your business.",
  },
  {
    title: "Small-batch freshness",
    text: "Baked through the day and packed for dispatch, so your shelves get product that still tastes fresh.",
  },
  {
    title: "Retail-ready range",
    text: "Varkey, biscuits and gift combos in formats built for counters, cafes and corporate hampers.",
  },
  {
    title: "Dependable repeat supply",
    text: "Plan recurring orders with stable recipes, careful quality checks and responsive support.",
  },
] as const;

const WHY_STATS = [
  { value: "1980", label: "Baking since" },
  { value: "28,000+", label: "Pin codes served" },
  { value: "90 days", label: "Shelf life" },
] as const;

type EnquiryIconName = (typeof ENQUIRY_TYPES)[number]["icon"];

function EnquiryIcon({ name }: { name: EnquiryIconName }) {
  if (name === "package") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </svg>
    );
  }
  if (name === "distribution") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h11v10H3z" />
        <path d="M14 9h4l3 3v4h-7" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  }
  if (name === "cafe") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
        <path d="M16 10h2a3 3 0 0 1 0 6h-2" />
        <path d="M8 5c0-1 .8-1.4.8-2.4M12 5c0-1 .8-1.4.8-2.4" />
      </svg>
    );
  }
  if (name === "bulk") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 8 9-4 9 4-9 4-9-4Z" />
        <path d="m3 12 9 4 9-4" />
        <path d="m3 16 9 4 9-4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10h16v10H4z" />
      <path d="M2 6h20v4H2z" />
      <path d="M12 6v14" />
      <path d="M12 6c-1-3-5-3-5-.5S10 6 12 6Zm0 0c1-3 5-3 5-.5S14 6 12 6Z" />
    </svg>
  );
}

const enquiryJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Wholesale, Bulk Orders & Corporate Gifting",
  description:
    "Wholesale, distributor, cafe, bulk order and corporate gifting enquiries for Nilgiribytes.",
  url: absoluteUrl("/wholesale"),
  mainEntity: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#bakery`,
    name: SITE_NAME,
    telephone: PHONE_TEL,
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kotagiri",
      addressRegion: "Tamil Nadu",
      postalCode: "643217",
      addressCountry: "IN",
    },
  },
};

export default function WholesalePage() {
  return (
    <main id="main-content">
      <section className="page-hero page-hero--wholesale">
        <div className="page-hero_media" aria-hidden="true">
          <picture>
            <source
              media="(max-width: 767.98px)"
              srcSet="/assets/wholesale_mobile_bg.png"
              width={768}
              height={1090}
            />
            <img
              src="/assets/wholesale_bg.png"
              alt=""
              width={1376}
              height={768}
              fetchPriority="high"
            />
          </picture>
        </div>
        <h1 className="sr-only" id="wholesale-title">
          Wholesale, Bulk Orders &amp; Corporate Gifting
        </h1>
      </section>

      <section
        className="section wholesale-partners"
        aria-labelledby="partners-heading"
      >
        <div className="container">
          <span className="section-kicker reveal" data-reveal="fade-up">
            Who we work with
          </span>
          <h2
            className="section-heading reveal"
            data-reveal="fade-up"
            id="partners-heading"
          >
            Built for Your Business
          </h2>
          <hr className="divider reveal" data-reveal="fade-in" />
          <p className="section-intro reveal" data-reveal="fade-up">
            From a single cafe to a growing distribution network, tell us what
            you need and we will help you plan the right supply.
          </p>

          <PartnersMarquee>
            <div className="wholesale-partners_grid">
              {[0, 1].map((group) => (
                <div
                  className="wholesale-partners_group"
                  key={group}
                  aria-hidden={group === 1 ? true : undefined}
                >
                  {ENQUIRY_TYPES.map((item, index) => (
                    <article
                      className="wholesale-partner-card"
                      key={item.title}
                    >
                      <span
                        className="wholesale-partner_index"
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {index === 0 && (
                        <span className="wholesale-partner_badge">
                          Most requested
                        </span>
                      )}
                      <div className="wholesale-partner_top">
                        <span
                          className="wholesale-partner_icon"
                          aria-hidden="true"
                        >
                          <EnquiryIcon name={item.icon} />
                        </span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                      <a
                        className="wholesale-partner_link"
                        href={`#wholesale-enquiry?type=${encodeURIComponent(CARD_TYPE_TO_FORM_TYPE[item.title])}`}
                        tabIndex={group === 1 ? -1 : undefined}
                      >
                        Start an enquiry{" "}
                        <span aria-hidden="true">&rarr;</span>
                      </a>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </PartnersMarquee>
        </div>
      </section>

      <section
        className="section wholesale-why"
        aria-labelledby="wholesale-why-title"
        id="why-nilgiribytes"
      >
        <div className="container">
          <div className="wholesale-why_layout">
            <div className="wholesale-why_head">
              <span className="section-kicker reveal" data-reveal="fade-up">
                The Nilgiribytes advantage
              </span>
              <h2
                className="wholesale-why_title reveal"
                data-reveal="fade-up"
                id="wholesale-why-title"
              >
                Why Businesses Choose <em>Nilgiribytes</em>
              </h2>
              <p className="wholesale-why_intro reveal" data-reveal="fade-up">
                A Nilgiri bakery with a name customers trust, and a supply
                partner built around the way your business orders.
              </p>
              <div className="wholesale-why_cta reveal" data-reveal="fade-up">
                <span className="wholesale-why_badge">Since 1980</span>
                <a className="btn btn--primary" href="#wholesale-enquiry">
                  Start a wholesale enquiry
                </a>
              </div>
            </div>

            <div className="wholesale-why_list">
              {WHY_REASONS.map((reason, index) => (
                <article
                  className="wholesale-why_item reveal"
                  data-reveal="fade-up"
                  key={reason.title}
                >
                  <span className="wholesale-why_item-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{reason.title}</h3>
                    <p>{reason.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <dl className="wholesale-why_stats reveal" data-reveal="fade-up">
            {WHY_STATS.map((stat) => (
              <div className="wholesale-why_stat" key={stat.label}>
                <dt className="wholesale-why_stat-label">{stat.label}</dt>
                <dd className="wholesale-why_stat-value">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        className="section section--alt"
        aria-labelledby="wholesale-enquiry-heading"
        id="wholesale-enquiry"
      >
        <div className="container">
          <span className="section-kicker reveal" data-reveal="fade-up">
            Enquire now
          </span>
          <h2
            className="section-heading reveal"
            data-reveal="fade-up"
            id="wholesale-enquiry-heading"
          >
            Tell Us What You Need
          </h2>
          <hr className="divider reveal" data-reveal="fade-in" />

          <div className="wholesale-enquiry_form">
            <WholesaleEnquiryForm />
          </div>
        </div>
      </section>

      <JsonLd data={enquiryJsonLd} />
    </main>
  );
}
