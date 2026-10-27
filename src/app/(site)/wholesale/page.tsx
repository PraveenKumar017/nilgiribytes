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
  image: "/assets/Fresh_Pastries.png",
});

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
      <section
        className="page-hero page-hero--wholesale"
        aria-labelledby="wholesale-title"
      >
        <div className="page-hero_media" aria-hidden="true">
          <img
            src="/assets/Fresh_Pastries.png"
            alt=""
            width={2000}
            height={1500}
            fetchPriority="high"
          />
        </div>
        <div className="page-hero_overlay" aria-hidden="true" />
        <div className="container page-hero_content">
          <span className="section-kicker">
            Wholesale &middot; Cafes &middot; Gifting
          </span>
          <h1 className="page-hero_title" id="wholesale-title">
            Bring Nilgiribytes to Your Business.
          </h1>
          <p className="page-hero_text">
            Authentic Ooty Varkey and Nilgiri biscuits for wholesale, retail,
            cafes, bulk orders and corporate gifting - baked in Kotagiri since
            1980.
          </p>
          <ul className="page-hero_pills">
            <li>Wholesale supply</li>
            <li>Distributors</li>
            <li>Bulk &amp; corporate</li>
          </ul>
        </div>
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

          <div className="wholesale-partners_grid">
            {ENQUIRY_TYPES.map((item, index) => (
              <article
                className={`wholesale-partner-card reveal${
                  index === 0 ? " is-featured" : ""
                }`}
                data-reveal="fade-up"
                key={item.title}
              >
                <span className="wholesale-partner_index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="wholesale-partner_icon" aria-hidden="true">
                  <EnquiryIcon name={item.icon} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {index === 0 && (
                  <ul className="wholesale-partner_highlights">
                    <li>Retail-ready packs</li>
                    <li>Repeat supply</li>
                    <li>Direct bakery pricing</li>
                  </ul>
                )}
                <a className="wholesale-partner_link" href="#wholesale-enquiry">
                  Start an enquiry <span aria-hidden="true">&rarr;</span>
                </a>
              </article>
            ))}
          </div>
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
