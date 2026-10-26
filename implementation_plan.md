# Nilgiribytes — Implementation Plan (Public Storefront First)

Status: Phase 1 in progress
Source migration document: `react_migration.md`
Base code: `F:\Websites\nilgiribytes-old`
Target code: `F:\Websites\niligibytes`

---

## 1. Scope decision

The migration is split into two delivery phases.

### Phase 1 — Public storefront (this phase)

Everything a customer sees and uses:

- Home, shop, cart, about, blog list, blog article, privacy policy, store policy, 404.
- Shared header/footer, mobile navigation, search, cart badge, WhatsApp ordering.
- Catalog and blog data served from MySQL through Prisma, with the existing JSON files
  kept as a build-safe fallback until the database is provisioned.
- Public read APIs for catalog and blog.
- SEO: metadata, canonical URLs, Open Graph, JSON-LD, sitemap, robots, old-URL redirects.
- Data import script to load the existing `catalog.json` and `blog.json` into MySQL.

**No admin UI in Phase 1.** Content changes are made through the import script or directly
in the database until Phase 2 ships.

### Phase 2 — Admin and operations (next phase)

- Admin login, sessions, password hashing and route guards.
- Product, combo, category and blog editors.
- Image upload to object storage.
- Order list and status updates.
- Newsletter subscriber list.
- Optional online payments.

The existing static admin (`admin.html`, `js/admin.js`, `/api/*`) remains available on the
old deployment until Phase 2 is complete and verified.

---

## 2. Phase 1 architecture

```text
Browser
  |
  |-- Next.js App Router (React 19, TypeScript, SSR/SSG/ISR)
  |
  |-- Server Components / route handlers
        |
        |-- Prisma ORM
        |
        |-- MySQL 8 (utf8mb4)
        |
        |-- Local JSON fallback (only while DATABASE_URL is absent or unreachable)
```

### Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Prisma 6 + MySQL 8
- Zod for API validation
- Existing CSS files reused unchanged apart from asset URLs
- Local `localStorage` cart (`veb_cart`) preserved for customer continuity
- WhatsApp deep-link checkout preserved

### Project layout

```text
src/
  app/
    layout.tsx
    page.tsx
    shop/page.tsx
    cart/page.tsx
    about/page.tsx
    blog/page.tsx
    blog/[slug]/page.tsx
    policies/privacy/page.tsx
    policies/store/page.tsx
    not-found.tsx
    sitemap.ts
    robots.ts
    api/
      catalog/route.ts
      posts/route.ts
      posts/[slug]/route.ts
  components/
    layout/Header.tsx
    layout/Footer.tsx
    layout/FloatingWhatsApp.tsx
    cart/CartProvider.tsx
    cart/CartPage.tsx
    shop/ProductCard.tsx
    shop/ProductGrid.tsx
    shop/ProductModal.tsx
    shop/ShopClient.tsx
    home/PosterRail.tsx
    blog/BlogCard.tsx
    blog/BlogList.tsx
    blog/ArticleBlocks.tsx
    motion/RevealObserver.tsx
    ui/LogoLoader.tsx
  data/
    catalog.json
    blog.json
  lib/
    prisma.ts
    storefront.ts
    types.ts
    format.ts
    whatsapp.ts
    cart.ts
    seo.ts
  app/styles/
    variables.css, style.css, responsive.css, animations.css, hero.css
public/
  assets/...
prisma/
  schema.prisma
  seed.ts
scripts/
  import-json.ts
```

---

## 3. Data model

Use the Prisma models defined in `react_migration.md`:

`Category`, `Product`, `ProductSize`, `Combo`, `ComboItem`, `BlogPost`,
`AdminUser`, `Session`, `Order`, `OrderItem`, `NewsletterSubscriber`, `Settings`.

Phase 1 uses the catalog/blog models in read-only mode. Order and auth models are created now
so Phase 2 does not need a destructive migration.

Money is stored as integer paise. Prices are converted with `Math.round(price * 100)`.
IDs such as `pr-001` / `cm-001` are kept as external `sku` values; the database uses numeric
primary keys and human-readable slugs.

---

## 4. Phase 1 work breakdown

### 4.1 Project setup

- [x] Create `package.json`, TypeScript config, Next config, ESLint config.
- [x] Install `next`, `react`, `react-dom`, `prisma`, `@prisma/client`, `zod`, `bcryptjs`.
- [x] Add `.env.example` with `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`.
- [x] Add npm scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `db:generate`,
      `db:migrate`, `db:seed`, `import:json`.

### 4.2 Assets and styles

- [ ] Copy `assets/` from the old site to `public/assets/`.
- [ ] Copy CSS files to `src/app/styles/` and rewrite `url("../assets/...")` to
      `url("/assets/...")`.
- [ ] Add `--font-display` to the design tokens (used by `style.css`).
- [ ] Import the CSS files once in the root layout.
- [ ] Confirm fonts load through the Google Fonts link in the root layout.

### 4.3 Data layer

- [ ] Copy `data/catalog.json` and `data/blog.json` into `src/data/`.
- [ ] Add `src/lib/types.ts` for normalized `StoreProduct`, `StoreCombo`, `StorePost`.
- [ ] Add `src/lib/storefront.ts`:
  - `getCatalog()` reads MySQL through Prisma when `DATABASE_URL` is set.
  - Falls back to bundled JSON when the database is not configured or unreachable.
  - `getPublishedPosts()` and `getPostBySlug()` follow the same rule.
  - Never leaks internal Prisma fields.
- [ ] Add `src/lib/format.ts` for `formatINR(paise)`.
- [ ] Add `src/lib/whatsapp.ts` for the message builder and `wa.me` link.
- [ ] Add `src/lib/cart.ts` for cart line keys, totals and localStorage helpers.

### 4.4 Shared layout

- [ ] Root layout with skip link, scroll progress, header, footer, WhatsApp float.
- [ ] `Header`: logo, nav links, mobile drawer, search, cart badge, active state.
- [ ] `Footer`: brand copy, explore links, visit info, policies, social, current year.
- [ ] `CartProvider`: reads/writes `veb_cart`, exposes add/update/remove/subtotal/count.
- [ ] `RevealObserver`: one IntersectionObserver for `.reveal` elements, respects reduced motion.
- [ ] Sticky cart bar on all pages except `/cart`.

### 4.5 Public pages

- [ ] Home:
  - Intro overlay (first visit per session, skippable).
  - Hero with existing copy and `hero.css`.
  - Category cards linking to `/shop?category=...`.
  - Signature poster rail with auto-advance and prev/next.
  - Bestsellers (combos first, then products).
  - Story, craftsmanship, testimonials and CTA sections.
- [ ] Shop:
  - Category chips, sort select, search from `?q=` and `?category=`.
  - Product grid and product detail modal with size selection and add-to-cart.
- [ ] Cart:
  - Empty state, line items, quantity steppers, subtotal, WhatsApp order button.
- [ ] About:
  - Hero, story, timeline, craftsmanship, visit/map/contact sections.
- [ ] Blog list:
  - Category filter and search, sorted newest first, published posts only.
- [ ] Blog article:
  - Cover, meta, block content, share buttons, related posts, JSON-LD.
- [ ] Policies: privacy and store policy content from the old site.
- [ ] Custom 404.

### 4.6 Public APIs

| Endpoint | Purpose |
|---|---|
| `GET /api/catalog` | Products + combos, cached for public reads |
| `GET /api/posts` | Published posts only |
| `GET /api/posts/[slug]` | One published post |

All responses use a consistent shape and `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

### 4.7 SEO

- [ ] Metadata API for every page with canonical URLs.
- [ ] Open Graph and Twitter tags.
- [ ] `Bakery` JSON-LD in the root layout.
- [ ] `Product` JSON-LD on shop/product views.
- [ ] `BlogPosting` JSON-LD on article pages.
- [ ] Dynamic `sitemap.xml` including products and published posts.
- [ ] `robots.txt` with sitemap URL.
- [ ] 301 redirects from all old `.html` URLs.
- [ ] Preserve existing title/description wording where possible.

### 4.8 Database import

- [ ] `scripts/import-json.ts` is idempotent.
- [ ] Creates categories, products, sizes, combos, combo items, blog posts and one admin user.
- [ ] Cleans text (trim, UTF-8) and derives unique slugs.
- [ ] Converts prices to paise.
- [ ] Verifies counts: 8 products, 3 combos, 3 blog posts.
- [ ] `prisma/seed.ts` calls the same logic for local development.

### 4.9 Verification

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes with and without `DATABASE_URL`.
- [ ] Home → shop → filter → modal → add to cart → cart → WhatsApp link works.
- [ ] Blog list → article → related post works.
- [ ] Responsive checks at 360, 768, 1024, 1440, 1920 px.
- [ ] Reduced-motion mode keeps all content visible.
- [ ] Sitemap and robots resolve.
- [ ] Old URLs return 301 to the new routes.

---

## 5. Environment variables (Phase 1)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Production | MySQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical domain |
| `AUTH_SECRET` | Phase 2 | Session/JWT signing secret |
| `ADMIN_USERNAME` | Seed only | Initial admin username |
| `ADMIN_PASSWORD` | Seed only | Initial admin password |
| `S3_*` or `CLOUDINARY_*` | Phase 2 | Image uploads |

Do not migrate `GITHUB_*` variables. The database becomes the source of truth.

---

## 6. Deployment notes

- Run `prisma migrate deploy` on deploy; never `migrate dev` in production.
- Use a managed MySQL with a connection proxy/pooler if deploying to serverless.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical domain (`https://www.niligibytes.com`).
- Keep the old static deployment available for rollback until Phase 2 is live.
- Add daily backups and test a restore before cutover.

---

## 7. Phase 2 backlog (after public sign-off)

1. Auth: login, logout, session check, bcrypt hashing, rate limiting.
2. Admin shell: sidebar, protected layout, role guard.
3. Product/combo/category CRUD with validation.
4. Blog editor with draft/publish, block editor, preview and image upload.
5. Order list and status transitions.
6. Newsletter subscriber list and CSV export.
7. Admin tests and security review.
8. Optional Razorpay/Stripe online payment channel.

---

## 8. Definition of done for Phase 1

- Every public page from the old site exists with matching content and design.
- Catalog and blog pages render from the database when configured and fall back safely otherwise.
- Cart and WhatsApp ordering work end to end.
- SEO metadata, JSON-LD, sitemap, robots and old-URL redirects are correct.
- Typecheck, lint and production build pass.
- No admin UI or admin credentials are exposed to the public bundle.
