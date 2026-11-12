import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import {
  CONTACT_EMAIL,
  FULL_ADDRESS,
  MAPS_EMBED_URL,
  PHONE_DISPLAY,
  PHONE_TEL,
} from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = pageMetadata({
  title: "About Us | Nilgiribytes - A Tradition Baked into Every Bite",
  description:
    "The story, craft and people behind Nilgiribytes - a traditional bakery baking fresh varkey and biscuits with care.",
  keywords: [
    "Nilgiribytes",
    "Nilgiribytes story",
    "Kotagiri bakery",
    "Ooty Varkey",
    "traditional Nilgiri bakery",
    "freshly baked biscuits",
  ],
  path: "/about",
  image: "/assets/our_story.png",
});


export default function AboutPage() {
  return (
    <main id="main-content">
      <section className="page-hero page-hero--about" aria-labelledby="about-title">
        <div className="page-hero_media" aria-hidden="true">
          <img
            src="/assets/our_story.png"
            alt=""
            width={2000}
            height={1500}
            fetchPriority="high"
          />
        </div>
        <div className="page-hero_overlay" aria-hidden="true" />
        <div className="container page-hero_content">
          <span className="section-kicker">
            Family baking tradition since 1980
          </span>
          <h1 className="page-hero_title" id="about-title">
            A Tradition That Began in 1980. A Journey That Continues.
          </h1>
          <p className="page-hero_text">
            <strong>NilgiriBytes &ndash; Crunchy Queen of Hills.</strong> In 1980,
            our family&apos;s baking journey began in the beautiful hills of the
            Nilgiris. Through the years, Vasu Ettan Bakery became more than just
            a bakery &ndash; it became a part of our family&apos;s life.
          </p>
          <ul className="page-hero_pills">
            <li>Since 1980</li>
            <li>45+ Years</li>
            <li>Kotagiri 643217</li>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="story-heading">
        <div className="container">
          <div
            className="reveal"
            data-reveal="slide-left"
            style={{ maxWidth: "820px", margin: "0 auto" }}
          >
            <span className="section-kicker text-left">Our story</span>
            <h2 className="split_title" id="story-heading">
              A Tradition That Began in 1980. A Journey That Continues.
            </h2>
            <p>
              In 1980, our family&apos;s baking journey began in the beautiful
              hills of the Nilgiris. Through the years, Vasu Ettan Bakery became
              more than just a bakery. It became a part of our family&apos;s
              life, built on dedication, countless hours of hard work and the
              trust of generations of customers.
            </p>
            <p>More than 45 years later, that passion continues to live on.</p>
            <p>
              The world has changed, tastes have evolved and new opportunities
              have emerged, but our love for traditional baking has remained
              close to our hearts.
            </p>
            <p>
              We dreamed of taking a little piece of our home, our heritage and
              the flavours we grew up with beyond the hills of Ooty. That dream
              gave birth to NilgiriBytes.
            </p>
            <p>
              Today, NilgiriBytes carries forward the spirit of our
              family&apos;s baking tradition with its own identity, bringing the
              beloved taste of Ooty Varkey and traditional bakery favourites to
              homes across India.
            </p>
            <p>
              For us, this is more than just a business. It is a journey shaped
              by generations, a tradition we are proud to carry forward and a
              story that continues to unfold.
            </p>
            <p>
              Our roots are in the Nilgiris. Our journey is taking us further.
              And every bite carries a little piece of our home.
            </p>
            <p>
              <strong>NilgiriBytes &ndash; Crunchy Queen of Hills.</strong>
              <br />
              <strong>Our Bakery</strong> &ndash; Traditional bakery products and
              Ooty Varkey.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="passion-heading">
        <div className="container">
          <span className="section-kicker reveal" data-reveal="fade-up">
            Our bakery
          </span>
          <h2
            className="section-heading reveal"
            data-reveal="fade-up"
            id="passion-heading"
          >
            A Family Passion for Quality
          </h2>
          <hr className="divider reveal" data-reveal="fade-in" />
          <p className="section-intro reveal" data-reveal="fade-up">
            At Vasu Ettan Bakery, baking is a family passion built on
            experience, dedication and customer trust. With family members
            actively involved, we specialise in manufacturing a variety of Ooty
            Varkey and traditional biscuits, focusing on quality, consistency and
            the distinctive taste of the Nilgiris.
          </p>
          <p className="section-intro reveal" data-reveal="fade-up">
            Taking our expertise beyond Ooty, we introduced NilgiriBytes, our
            premium brand bringing authentic Ooty Varkey and biscuits to homes
            across India through premium packaging and a convenient online
            experience.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="vision-heading">
        <div className="container">
          <span className="section-kicker reveal" data-reveal="fade-up">
            Our purpose
          </span>
          <h2
            className="section-heading reveal"
            data-reveal="fade-up"
            id="vision-heading"
          >
            Vision &amp; Mission
          </h2>
          <hr className="divider reveal" data-reveal="fade-in" />

          <div className="visit-grid">
            <div className="visit-card reveal" data-reveal="slide-left">
              <h3 className="visit-card_title">Our Vision</h3>
              <p>
                To make the authentic taste of Ooty Varkey and the flavours of
                the Nilgiris loved and enjoyed by people across India.
              </p>
            </div>
            <div className="visit-card reveal" data-reveal="slide-right">
              <h3 className="visit-card_title">Our Mission</h3>
              <p>
                To bring quality Ooty Varkey and traditional biscuits to every
                home through our baking expertise, carefully selected products,
                premium packaging and commitment to customer satisfaction.
              </p>
            </div>
          </div>

          <p className="text-center mt-2 reveal" data-reveal="fade-up">
            Our promise is simple:{" "}
            <strong>Quality in every pack, trust in every bite.</strong>
          </p>
        </div>
      </section>

      <section
        className="section section--alt"
        aria-labelledby="visit-heading"
        id="visit-us"
      >
        <div className="container">
          <span className="section-kicker reveal" data-reveal="fade-up">
            Visit us
          </span>
          <h2
            className="section-heading reveal"
            data-reveal="fade-up"
            id="visit-heading"
          >
            Come Say Hello
          </h2>
          <hr className="divider reveal" data-reveal="fade-in" />

          <div className="visit-grid">
            <div className="visit-card reveal" data-reveal="slide-left">
              <h3 className="visit-card_title">Location</h3>
              <div className="visit-map">
                <iframe
                  src={MAPS_EMBED_URL}
                  width="100%"
                  height="380"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Nilgiribytes location on Google Maps"
                />
              </div>
            </div>

            <div className="visit-card reveal" data-reveal="slide-right">
              <h3 className="visit-card_title">Opening hours</h3>
              <ul>
                <li>Monday - Saturday: 8:00 AM - 9:00 PM</li>
                <li>Sunday: 9:00 AM - 8:00 PM</li>
              </ul>

              <h3 className="visit-card_title">Contact</h3>
              <p>
                <a className="link-arrow" href={`tel:${PHONE_TEL}`}>
                  {PHONE_DISPLAY}
                </a>
              </p>
              <p>
                <a className="link-arrow" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <a
                  className="link-arrow"
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener"
                >
                  Chat on WhatsApp <span aria-hidden="true">↗</span>
                </a>
              </p>

              <h3 className="visit-card_title" style={{ marginTop: "1.5rem" }}>
                Address
              </h3>
              <p>{FULL_ADDRESS}</p>
            </div>
          </div>

          <p className="text-center mt-2 reveal" data-reveal="fade-up">
            <Link
              className="btn btn--primary"
              href="/shop"
              style={{
                padding: "0.5rem 1.4rem",
                fontSize: "0.86rem",
                lineHeight: 1.2,
              }}
            >
              Explore our shop
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
