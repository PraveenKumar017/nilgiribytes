import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import {
  MAPS_EMBED_URL,
  MAPS_URL,
  PHONE_DISPLAY,
  PHONE_TEL,
} from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = pageMetadata({
  title: "About Us | Nilgiribytes - A Tradition Baked into Every Bite",
  description:
    "The story, craft and people behind Nilgiribytes - a traditional bakery baking fresh varkey and biscuits with care.",
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
            Shopping &amp; retail &middot; Since 1980
          </span>
          <h1 className="page-hero_title" id="about-title">
            A Tradition Baked into Every Bite.
          </h1>
          <p className="page-hero_text">
            <strong>Authentic Ooty Varkey.</strong> Warm greetings from
            Nilgiribytes, Kotagiri - 45+ years of baking tradition, retail &amp;
            wholesale, with pre-order cakes also available.
          </p>
          <ul className="page-hero_pills">
            <li>Since 1980</li>
            <li>45+ Years</li>
            <li>Kotagiri 643217</li>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="story-heading">
        <div className="container split">
          <div
            className="split_media reveal"
            data-reveal="slide-right"
            data-parallax="0.35"
          >
            <img
              src="/assets/our_story.png"
              alt="Inside Nilgiribytes, with fresh bakes on display"
              width={1078}
              height={1042}
              loading="lazy"
            />
          </div>
          <div className="reveal" data-reveal="slide-left">
            <span className="section-kicker text-left">Our story</span>
            <h2 className="split_title" id="story-heading">
              Warm Greetings from Kotagiri
            </h2>
            <p>
              <strong>Nilgiribytes, Kotagiri</strong> - manufacturers of
              authentic Ooty Varkey since 1980, with 45+ years of baking
              tradition behind every batch.
            </p>
            <p>
              Retail &amp; wholesale varkey and biscuits, made with a commitment
              to quality. Pre-order cakes also available. Every batch is still
              made the traditional way, in small quantities through the day, so
              nothing sits waiting on a shelf.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="timeline-heading">
        <div className="container">
          <span className="section-kicker reveal" data-reveal="fade-up">
            Our journey
          </span>
          <h2
            className="section-heading reveal"
            data-reveal="fade-up"
            id="timeline-heading"
          >
            Milestones Along the Way
          </h2>
          <hr className="divider reveal" data-reveal="fade-in" />
          <p className="section-intro reveal" data-reveal="fade-up">
            Each entry below is a placeholder - real dates and events will be
            confirmed by the bakery.
          </p>

          <div className="timeline">
            <div className="timeline_item reveal" data-reveal="slide-right">
              <p className="timeline_date">Since 1980</p>
              <h3 className="timeline_title">Where it all began</h3>
              <p className="timeline_text">
                Authentic Ooty Varkey, baked the traditional way in Kotagiri for
                over four decades.
              </p>
            </div>
            <div className="timeline_item reveal" data-reveal="slide-right">
              <p className="timeline_date">Date - TODO</p>
              <h3 className="timeline_title">Growing the counter</h3>
              <p className="timeline_text">
                TODO: confirm with bakery - when new products such as biscuits
                and combos were introduced.
              </p>
            </div>
            <div className="timeline_item reveal" data-reveal="slide-right">
              <p className="timeline_date">Date - TODO</p>
              <h3 className="timeline_title">A milestone worth noting</h3>
              <p className="timeline_text">
                TODO: confirm with bakery - any recognitions, expansions or
                anniversaries (awards must be verified before publishing).
              </p>
            </div>
            <div className="timeline_item reveal" data-reveal="slide-right">
              <p className="timeline_date">Today</p>
              <h3 className="timeline_title">Baking for the community</h3>
              <p className="timeline_text">
                TODO: confirm with bakery - where the bakery stands today and
                what comes next.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="craft-heading">
        <div className="container split">
          <div className="reveal" data-reveal="slide-left">
            <span className="section-kicker text-left">Craftsmanship</span>
            <h2 className="split_title" id="craft-heading">
              How We Work
            </h2>
            <ul className="feature-list">
              <li>
                <span className="feature-list_icon" aria-hidden="true">
                  1
                </span>
                <div>
                  <p className="feature-list_title">Small, frequent batches</p>
                  <p className="feature-list_text">
                    We bake through the day so shelves stay fresh.
                  </p>
                </div>
              </li>
              <li>
                <span className="feature-list_icon" aria-hidden="true">
                  2
                </span>
                <div>
                  <p className="feature-list_title">Recipes kept simple</p>
                  <p className="feature-list_text">
                    Time-honoured methods, nothing complicated.
                  </p>
                </div>
              </li>
              <li>
                <span className="feature-list_icon" aria-hidden="true">
                  3
                </span>
                <div>
                  <p className="feature-list_title">Checked by hand</p>
                  <p className="feature-list_text">
                    Every tray is looked at before it is packed.
                  </p>
                </div>
              </li>
            </ul>
            <p className="todo-note">
              TODO: confirm ingredient and process claims with the bakery.
            </p>
          </div>
          <div
            className="split_media reveal"
            data-reveal="slide-right"
            data-parallax="0.3"
          >
            <img
              src="/assets/Craftsmanship.png"
              alt="Baker checking a tray of freshly baked biscuits"
              width={1376}
              height={768}
              loading="lazy"
            />
          </div>
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
              <h3 className="visit-card_title">Address</h3>
              <p>Kotagiri, Tamil Nadu 643217</p>
              <div className="visit-map">
                <iframe
                  src={MAPS_EMBED_URL}
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Nilgiribytes location on Google Maps"
                />
                <a
                  className="visit-map_link"
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener"
                >
                  Open in Google Maps &nearr;
                </a>
              </div>
            </div>

            <div className="visit-card reveal" data-reveal="slide-right">
              <h3 className="visit-card_title">Opening hours</h3>
              <ul>
                <li>Monday - Saturday: 8:00 AM - 9:00 PM</li>
                <li>Sunday: 9:00 AM - 8:00 PM</li>
              </ul>

              <h3 className="visit-card_title">Phone &amp; WhatsApp</h3>
              <p>
                <a className="link-arrow" href={`tel:${PHONE_TEL}`}>
                  {PHONE_DISPLAY}
                </a>
              </p>
              <p>
                <a
                  className="link-arrow"
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener"
                >
                  Chat on WhatsApp &nearr;
                </a>
              </p>

              <p className="todo-note">
                TODO: confirm the full street address and opening hours with the
                bakery before launch.
              </p>
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
