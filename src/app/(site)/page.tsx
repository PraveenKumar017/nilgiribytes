import type { Metadata } from "next";
import Link from "next/link";
import { IntroOverlay } from "@/components/intro-overlay";
import { JsonLd } from "@/components/json-ld";
import { PosterRail } from "@/components/poster-rail";
import { ProductCollection } from "@/components/product-collection";
import {
  bakeryJsonLd,
  faqJsonLd,
  pageMetadata,
  websiteJsonLd,
} from "@/lib/seo";
import { getCatalog } from "@/lib/storefront";

export const dynamic = "force-dynamic";

const faqs = [
  {
    question: "Where are Nilgiribytes products baked?",
    answer:
      "Every Nilgiribytes product is baked in Kotagiri, in the heart of the Nilgiris, using traditional methods and recipes we have followed since 1980.",
  },
  {
    question: "How fresh are the varkey and biscuits?",
    answer:
      "We bake in small batches through the day and pack each order the same day it leaves the oven, so your varkey and biscuits arrive crisp and fresh.",
  },
  {
    question: "How long do the products stay fresh?",
    answer:
      "Most of our varkey and biscuits have a shelf life of up to 90 days. Please check the freshness date printed on the pack and store items in an airtight container.",
  },
  {
    question: "Do you deliver across India?",
    answer:
      "Yes. We deliver pan-India to more than 28,000 pin codes through trusted logistics partners.",
  },
  {
    question: "How long will my order take to arrive?",
    answer:
      "Orders are processed within 24-48 hours. After pickup, delivery usually takes 3-4 days depending on your location. You will receive tracking updates by email and WhatsApp.",
  },
  {
    question: "Do you supply wholesale or bulk orders?",
    answer:
      "Yes. We welcome retail and wholesale enquiries, including bulk gifting and corporate orders. Please use our wholesale enquiry form and our team will get back to you.",
  },
  {
    question: "How should I store varkey and biscuits?",
    answer:
      "Keep them in an airtight container away from moisture and direct sunlight. In humid weather, a food-safe silica sachet in the container helps keep them crisp.",
  },
];

export const metadata: Metadata = pageMetadata({
  title:
    "Nilgiribytes | Freshly Baked Ooty Varkey, Biscuits & Combos in Kotagiri",
  description:
    "Buy authentic Ooty Varkey, traditional Nilgiri biscuits and tea-time combos online from Nilgiribytes, a Kotagiri bakery baking fresh every day.",
  path: "/",
  image: "/assets/og-image.jpg",
  imageWidth: 768,
  imageHeight: 1257,
});

export default async function HomePage() {
  const catalog = await getCatalog();
  const bestsellers = [...catalog.combos, ...catalog.products].slice(0, 4);

  return (
    <>
      <IntroOverlay />
      <main id="main-content">
        <section
          className="hero-story"
          aria-label="NilgiriBytes Artisan Baking Kitchen & Authentic Varkey Experience"
        >
          <div className="hero-stage">
            <div className="hero-vignette" aria-hidden="true" />
            <div className="hero-copy">
              <p className="hero-eyebrow">
                NILGIRIBYTES &middot; BAKED IN KOTAGIRI
              </p>
              <h1 className="hero-heading" id="hero-title">
                Crafted by Heat.
                <br />
                <span className="highlight">Made to Delight.</span>
              </h1>
              <p className="hero-desc">
                Authentic Ooty Varkey &middot; Multi-layered, golden, crisp
                traditional Nilgiri favourites baked fresh daily since 1980.
              </p>
              <div className="hero-cta-group">
                <Link className="btn btn--primary" href="/shop">
                  Shop Fresh Varkey
                </Link>
                <a className="btn btn--outline" href="#categories-title">
                  Explore Bakery &darr;
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          className="section category-collection"
          id="categories-section"
          aria-labelledby="categories-title"
          style={{ background: "#FFFFFF" }}
        >
          <div className="container">
            <div className="category-collection_head">
              <div className="category-collection_title">
                <span
                  className="section-kicker text-left reveal"
                  data-reveal="fade-up"
                >
                  Our range
                </span>
                <h2
                  className="section-heading reveal"
                  data-reveal="fade-up"
                  id="categories-title"
                >
                  Shop by <em>Choice</em>
                </h2>
              </div>
              <div
                className="category-collection_note reveal"
                data-reveal="fade-up"
              >
                <p>
                  From flaky Ooty varkey to tea-time biscuits, every batch is
                  baked in small quantities and packed the day it leaves the
                  oven.
                </p>
              </div>
            </div>

            <div className="category-grid">
              <Link
                className="category-card category-card--light reveal"
                data-reveal="drop"
                href="/shop?category=Varkey"
                style={{ gridRow: "span 2" }}
              >
                <div
                  className="category-card_media"
                  style={{ flex: "0 0 auto", aspectRatio: "4 / 4" }}
                >
                  <img
                    className="category-card_texture"
                    src="/assets/images/Categories/varkey.png"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>
                <span className="category-card_index" aria-hidden="true">
                  01
                </span>
                <div
                  className="category-card_body"
                  style={{ marginTop: "auto" }}
                >
                  <h3 className="category-card_title">Ooty Varkey</h3>
                  <p className="category-card_text">
                    Crisp, golden perfection defines the flaky, buttery layers baked fresh every morning - the taste the Nilgiris is known for.
                  </p>
                  <span className="category-card_link">Shop varkey</span>
                </div>
              </Link>

              <Link
                className="category-card category-card--light reveal"
                data-reveal="fade-up"
                href="/shop?category=Salt%20Biscuit"
              >
                <span className="category-card_index" aria-hidden="true">
                  02
                </span>
                <div className="category-card_media">
                  <img
                    className="category-card_texture"
                    src="/assets/images/Categories/salt_biscuit.png"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>
                <div className="category-card_body">
                  <h3 className="category-card_title">Salt Biscuit</h3>
                  <p className="category-card_text">
                    Savoury, subtly salted and crumbly - made for a hot cup of
                    chai.
                  </p>
                  <span className="category-card_link">
                    Shop salt biscuit
                  </span>
                </div>
              </Link>

              <Link
                className="category-card category-card--light reveal"
                data-reveal="fade-up"
                href="/shop?category=Sweet%20Biscuit"
              >
                <span className="category-card_index" aria-hidden="true">
                  03
                </span>
                <div className="category-card_media">
                  <img
                    className="category-card_texture"
                    src="/assets/images/Categories/sweet_biscuit.png"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>
                <div className="category-card_body">
                  <h3 className="category-card_title">Sweet Biscuit</h3>
                  <p className="category-card_text">
                    Gently sweet, golden-baked and perfect with evening tea or
                    coffee.
                  </p>
                  <span className="category-card_link">
                    Shop sweet biscuit
                  </span>
                </div>
              </Link>

              <Link
                className="category-card category-card--light category-card--wide reveal"
                data-reveal="fade-up"
                href="/shop?category=Combos"
              >
                <span className="category-card_index" aria-hidden="true">
                  04
                </span>
                <div className="category-card_media">
                  <img
                    className="category-card_texture"
                    src="/assets/images/combo_choice.jpg"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>
                <div className="category-card_body">
                  <h3 className="category-card_title">Trail Combos</h3>
                  <p className="category-card_text">
                    Thoughtfully paired varkey and biscuits - the perfect gift or
                    tea-time spread.
                  </p>
                  <span className="category-card_link">Shop combos</span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section
          className="section section--posters"
          aria-labelledby="range-title"
        >
          <div className="container">
            <span className="section-kicker reveal" data-reveal="fade-up">
              From the bakery
            </span>
            <h2
              className="section-heading reveal"
              data-reveal="fade-up"
              id="range-title"
            >
              The Signature Range
            </h2>
            <hr className="divider reveal" data-reveal="fade-in" />
            <p className="section-intro reveal" data-reveal="fade-up">
              Our full range of Ooty varkey and biscuits - tap a poster to see
              sizes and add to your order.
            </p>
            <PosterRail products={catalog.products} />
          </div>
        </section>

        <section
          className="section section--alt"
          aria-labelledby="bestsellers-title"
        >
          <div className="container">
            <span className="section-kicker reveal" data-reveal="fade-up">
              Customer favourites
            </span>
            <h2
              className="section-heading reveal"
              data-reveal="fade-up"
              id="bestsellers-title"
            >
              Bestsellers
            </h2>
            <p className="section-intro reveal" data-reveal="fade-up">
              Our signature combos and most-loved bakes, ready to add to your
              cart.
            </p>
            <div className="product-grid" id="bestsellers-grid">
              <ProductCollection items={bestsellers} />
            </div>
            <p className="text-center reveal mt-2" data-reveal="fade-up">
              <Link
                className="btn btn--outline"
                href="/shop"
                style={{
                  padding: "0.5rem 1.4rem",
                  fontSize: "0.86rem",
                  lineHeight: 1.2,
                }}
              >
                View all products
              </Link>
            </p>
          </div>
        </section>

        <section className="section" aria-labelledby="story-title">
          <div className="container split">
            <div
              className="split_media reveal"
              data-reveal="slide-right"
              data-parallax="0.35"
            >
              <img
                src="/assets/our_story.png"
                alt="Baker preparing dough by hand at Nilgiribytes"
                width={1078}
                height={1042}
                loading="lazy"
              />
            </div>
            <div className="reveal" data-reveal="slide-left">
              <span className="section-kicker text-left">Our story</span>
              <h2 className="split_title" id="story-title">
                Warm Greetings from Kotagiri
              </h2>
              <p>
                Manufacturers of <strong>authentic Ooty Varkey since 1980</strong>{" "}
                - with a variety of varkey and biscuits made with a commitment to
                quality. Retail &amp; wholesale, and pre-order cakes also
                available.
              </p>
              <Link className="link-arrow" href="/about">
                Read our full story &rarr;
              </Link>
            </div>
          </div>
        </section>

        <section className="section section--alt" aria-labelledby="craft-title">
          <div className="container split">
            <div className="reveal" data-reveal="slide-left">
              <span className="section-kicker text-left">Freshly baked</span>
              <h2 className="split_title" id="craft-title">
                Craftsmanship in Every Batch
              </h2>
              <p>
                We bake in small batches through the day so what reaches you is
                never off the shelf for long. Traditional methods, careful
                timing, and a close eye on every tray.
              </p>
              <ul className="feature-list">
                <li>
                  <span className="feature-list_icon" aria-hidden="true">
                    &#10022;
                  </span>
                  <div>
                    <p className="feature-list_title">Baked fresh daily</p>
                    <p className="feature-list_text">
                      Multiple batches through the day for that just-baked
                      texture.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="feature-list_icon" aria-hidden="true">
                    &#10055;
                  </span>
                  <div>
                    <p className="feature-list_title">Traditional recipes</p>
                    <p className="feature-list_text">
                      Time-tested methods passed down through generations.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="feature-list_icon" aria-hidden="true">
                    &#10003;
                  </span>
                  <div>
                    <p className="feature-list_title">Consistent quality</p>
                    <p className="feature-list_text">
                      The same taste and crunch, box after box.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div
              className="split_media reveal"
              data-reveal="slide-right"
              data-parallax="0.35"
            >
              <img
                src="/assets/Craftsmanship.png"
                alt="Golden varkey arranged on a baking tray"
                width={1376}
                height={768}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="testimonials-title">
          <div className="container">
            <span className="section-kicker reveal" data-reveal="fade-up">
              Kind words
            </span>
            <h2
              className="section-heading reveal"
              data-reveal="fade-up"
              id="testimonials-title"
            >
              What Our Customers Say
            </h2>
            <hr className="divider reveal" data-reveal="fade-in" />
            <div className="testimonial-grid">
              <figure
                className="testimonial reveal"
                data-reveal="fade-up"
              >
                <blockquote className="testimonial_quote">
                  &ldquo;The Special Varkey tastes exactly like the one my
                  grandmother used to bring back from Ooty - light, flaky, and
                  not overly sweet. It disappeared before the tea got cold.&rdquo;
                </blockquote>
                <figcaption className="testimonial_author">
                  Priya Raghavan
                </figcaption>
                <p className="testimonial_meta">
                  Coimbatore &middot; Special Varkey
                </p>
              </figure>
              <figure
                className="testimonial reveal"
                data-reveal="fade-up"
              >
                <blockquote className="testimonial_quote">
                  &ldquo;I ordered the Salt Biscuits and Mini Varkey for a family
                  gathering, and everyone asked where they were from. Fresh,
                  crisp, and packed carefully - not a single broken
                  piece.&rdquo;
                </blockquote>
                <figcaption className="testimonial_author">
                  Arjun Menon
                </figcaption>
                <p className="testimonial_meta">
                  Bengaluru &middot; Salt Biscuit &amp; Mini Varkey
                </p>
              </figure>
              <figure
                className="testimonial reveal"
                data-reveal="fade-up"
              >
                <blockquote className="testimonial_quote">
                  &ldquo;We have been buying their varkey for our morning tea for
                  months now. The quality is consistent every time, and you can
                  taste the butter. It is the closest thing to home baking I have
                  found online.&rdquo;
                </blockquote>
                <figcaption className="testimonial_author">
                  Meera Krishnan
                </figcaption>
                <p className="testimonial_meta">Ooty &middot; Regular Varkey</p>
              </figure>
            </div>
          </div>
        </section>

        <section
          className="section"
          aria-labelledby="faq-title"
          id="faq"
          style={{ background: "#FFFFFF" }}
        >
          <div className="container">
            <span className="section-kicker reveal" data-reveal="fade-up">
              Good to know
            </span>
            <h2
              className="section-heading reveal"
              data-reveal="fade-up"
              id="faq-title"
            >
              Frequently Asked Questions
            </h2>
            <hr className="divider reveal" data-reveal="fade-in" />
            <div className="faq-list">
              {faqs.map((faq) => (
                <details
                  className="faq-item reveal"
                  data-reveal="fade-up"
                  key={faq.question}
                >
                  <summary className="faq-question">{faq.question}</summary>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="cta-title">
          <div className="container">
            <div className="cta reveal" data-reveal="zoom-in">
              <h2 className="cta_title" id="cta-title">
                Taste the Nilgiris
              </h2>
              <p className="cta_text">
                Freshly baked varkey, biscuits and combos made daily in Kotagiri.
                Order now and bring home the taste of Ooty.
              </p>
              <div className="cta-group">
                <Link className="btn btn--primary" href="/shop">
                  Shop Now
                </Link>
                <Link className="btn btn--primary" href="/about">
                  Know More
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={bakeryJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />
    </>
  );
}
