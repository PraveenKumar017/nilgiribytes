# Nilgiribytes — Migration Plan: React + Node.js + MySQL

Status: planning
Source site: static HTML/CSS/JS with Vercel Functions (`/api/*`) and JSON files in the repo
Target site: React frontend + Node.js API + MySQL database

---

## 1. Goals

- Keep the current storefront design, copy, SEO and WhatsApp ordering experience.
- Replace JSON files, GitHub commits and runtime partial loading with a real database and API.
- Make products, combos, blog posts and orders manageable from an admin panel.
- Support growth: more products, blog traffic, multiple editors, order history and future online payments.
- Keep a rollback path to the current static site until the new site is proven.

## 2. Current state (inventory)

| Area | Today |
|---|---|
| Pages | `index.html`, `shop.html`, `cart.html`, `about.html`, `blog.html`, `admin.html`, `privacy_policy.html`, `store_policy.html`, `404.html` |
| Layout | `header.html` and `footer.html` fetched at runtime into `[data-include]` |
| Styling | `css/variables.css`, `style.css`, `responsive.css`, `animations.css`, `hero.css`, `admin.css` |
| Frontend JS | `js/main.js`, `products.js`, `cart.js`, `blog.js`, `blog-render.js`, `animations.js`, `admin.js` |
| Product data | `data/catalog.json` (8 products, 3 combos), served by `/api/catalog` |
| Blog data | `data/blog.json`, served by `/api/blog` |
| Persistence | Admin publishes by committing JSON to GitHub (`GITHUB_TOKEN`) |
| Auth | Single admin username/password from env vars; signed HMAC cookie (`api/_auth.js`) |
| Cart | Client-side only: `localStorage` key `veb_cart` |
| Checkout | WhatsApp deep link with a prefilled order message (no server order record) |
| Image uploads (blog) | `/api/blog-image` commits images to the GitHub repo |
| Newsletter | Front-end validation only; nothing is stored |
| Hosting | Vercel static hosting + Vercel Functions (`.vercel/`) |
| SEO | Per-page meta tags, canonical URLs, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt` |
| Domain | `https://www.niligibytes.com` |

Known data issues to fix during migration:

- Some catalog prices are placeholders (for example `1`, `3`, `4` rupees). Confirm real prices before importing.
- Some descriptions contain mojibake (`�?`) and must be cleaned as UTF-8.
- IDs use prefixes (`pr-001`, `cm-001`). Keep them as an external `sku` or migrate to numeric IDs + slugs.

## 3. Target architecture

### Recommended: Next.js full-stack (React + Node runtime) + MySQL

```text
Browser
  |
  |-- React UI (Next.js App Router, SSR/SSG for SEO)
  |
  |-- Next.js Route Handlers / Server Actions (Node runtime)
        |
        |-- Prisma ORM
        |
        |-- MySQL 8 (managed)
        |
        |-- Object storage (S3 / Cloudinary / UploadThing) for images
```

Why Next.js: one deployable app gives React pages, Node API routes, SSR for SEO, image optimization, routing and server-side data access without maintaining a separate frontend and backend.

### Alternative: Vite React SPA + Express API

Use this only if you want the frontend and backend deployed separately:

```text
React (Vite) on Netlify/Vercel  ->  Express API on Render/Railway/VPS  ->  MySQL
```

Downside: you must add SSR/pre-rendering yourself for SEO, configure CORS, and maintain two deployments.

The rest of this plan assumes Next.js. The database and API design apply to both options.

### Stack

- Next.js (App Router) + TypeScript
- Node.js 20 LTS or newer
- MySQL 8 (`utf8mb4`)
- Prisma ORM
- Zod for request validation
- Auth: Auth.js (NextAuth) credentials provider or custom session table with `bcrypt`/`argon2`
- Image uploads: S3-compatible storage or Cloudinary
- Email (optional): Resend/Brevo
- Tests: Vitest + Playwright
- Deploy: Vercel + managed MySQL (Railway/Aiven/DigitalOcean) or a VPS with a persistent Node server

Important: serverless functions open many short-lived MySQL connections. Use a connection pooler/proxy (Prisma Accelerate, Aiven proxy, PlanetScale-compatible proxy) or run the Node server persistently.

## 4. Phase 0 — Preparation (1–2 days)

1. Create a migration branch and tag the current release:
   ```bash
   git checkout -b migration/react-node-mysql
   git tag pre-migration-static
   ```
2. Copy `data/catalog.json`, `data/blog.json` and the full `assets/` folder into a backup outside the repo.
3. Create a staging database (never migrate straight into production).
4. List every URL currently indexed in Google Search Console. This becomes the redirect map in Phase 8.
5. Decide the canonical domain (`www` vs apex) and keep it consistent everywhere.
6. Freeze product/blog edits on the old admin during the final cutover window.

## 5. Phase 1 — Database design

Create the database:

```sql
CREATE DATABASE nilgiribytes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nilgiri_app'@'%' IDENTIFIED BY 'use-a-strong-password';
GRANT ALL PRIVILEGES ON nilgiribytes.* TO 'nilgiri_app'@'%';
```

### Tables

| Table | Purpose |
|---|---|
| `categories` | Product categories (`Varkey`, `Salt Biscuit`, `Sweet Biscuit`, etc.) |
| `products` | Product master data (name, slug, description, category, images, active) |
| `product_sizes` | Weight/price variants per product (200g, 250g, 400g, 500g) |
| `combos` | Combo packs |
| `combo_items` | Products included in a combo |
| `blog_posts` | Blog articles with draft/published status |
| `admin_users` | Hashed admin credentials and roles |
| `sessions` | Server-side admin sessions (if not using JWT/Auth.js) |
| `orders` | Order header, customer and status |
| `order_items` | Snapshotted line items (price/name at order time) |
| `newsletter_subscribers` | Emails from the footer form |
| `settings` | Site settings (WhatsApp number, contact info, policies) |

Store all money as integer **paise**, never floats.

### Prisma schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Category {
  id       Int       @id @default(autoincrement())
  slug     String    @unique @db.VarChar(80)
  name     String    @db.VarChar(120)
  products Product[]
}

model Product {
  id          Int          @id @default(autoincrement())
  sku         String?      @unique @db.VarChar(40)
  slug        String       @unique @db.VarChar(160)
  name        String       @db.VarChar(160)
  description String       @db.Text
  categoryId  Int
  category    Category     @relation(fields: [categoryId], references: [id])
  posterUrl   String?      @db.VarChar(500)
  imageUrl    String?      @db.VarChar(500)
  isActive    Boolean      @default(true)
  sizes       ProductSize[]
  comboItems  ComboItem[]
  orderItems  OrderItem[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([categoryId, isActive])
}

model ProductSize {
  id         Int     @id @default(autoincrement())
  productId  Int
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  label      String  @db.VarChar(40)
  grams      Int?
  pricePaise Int
  imageUrl   String? @db.VarChar(500)
  sortOrder  Int     @default(0)

  @@unique([productId, label])
}

model Combo {
  id          Int          @id @default(autoincrement())
  slug        String       @unique @db.VarChar(160)
  name        String       @db.VarChar(160)
  description String       @db.Text
  imageUrl    String?      @db.VarChar(500)
  weightLabel String?      @db.VarChar(60)
  pricePaise  Int
  isActive    Boolean      @default(true)
  items       ComboItem[]
  orderItems  OrderItem[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model ComboItem {
  id            Int      @id @default(autoincrement())
  comboId       Int
  combo         Combo    @relation(fields: [comboId], references: [id], onDelete: Cascade)
  productId     Int?
  product       Product? @relation(fields: [productId], references: [id])
  nameSnapshot  String   @db.VarChar(160)
  quantityLabel String   @db.VarChar(60)
}

model BlogPost {
  id             Int        @id @default(autoincrement())
  slug           String     @unique @db.VarChar(200)
  title          String     @db.VarChar(240)
  category       String     @db.VarChar(80)
  date           DateTime
  coverImage     String?    @db.VarChar(500)
  status         PostStatus @default(DRAFT)
  content        Json
  readingTimeMin Int?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@index([status, date])
}

enum PostStatus {
  DRAFT
  PUBLISHED
}

model AdminUser {
  id           Int       @id @default(autoincrement())
  username     String    @unique @db.VarChar(80)
  passwordHash String    @db.VarChar(255)
  role         Role      @default(ADMIN)
  sessions     Session[]
  createdAt    DateTime  @default(now())
}

enum Role {
  ADMIN
  EDITOR
}

model Session {
  id        String    @id @db.VarChar(64)
  userId    Int
  user      AdminUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
}

model Order {
  id             Int          @id @default(autoincrement())
  orderNumber    String       @unique @db.VarChar(40)
  customerName   String       @db.VarChar(160)
  phone          String       @db.VarChar(30)
  email          String?      @db.VarChar(160)
  address        String?      @db.Text
  notes          String?      @db.Text
  subtotalPaise  Int
  totalPaise     Int
  channel        OrderChannel @default(WHATSAPP)
  status         OrderStatus  @default(NEW)
  items          OrderItem[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([status, createdAt])
}

enum OrderChannel {
  WHATSAPP
  ONLINE
}

enum OrderStatus {
  NEW
  CONFIRMED
  PACKED
  DELIVERED
  CANCELLED
}

model OrderItem {
  id             Int     @id @default(autoincrement())
  orderId        Int
  order          Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId      Int?
  product        Product? @relation(fields: [productId], references: [id])
  comboId        Int?
  combo          Combo?  @relation(fields: [comboId], references: [id])
  nameSnapshot   String  @db.VarChar(200)
  sizeLabel      String? @db.VarChar(60)
  unitPricePaise Int
  quantity       Int
  lineTotalPaise Int
}

model NewsletterSubscriber {
  id        Int      @id @default(autoincrement())
  email     String   @unique @db.VarChar(200)
  createdAt DateTime @default(now())
}
```

Run:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 6. Phase 2 — Backend / API

### Project setup

```bash
npx create-next-app@latest nilgiribytes-next \
  --typescript --eslint --app --src-dir --import-alias "@/*" --no-tailwind
cd nilgiribytes-next
npm install prisma @prisma/client zod bcryptjs
npx prisma init
```

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `AUTH_SECRET` | Session/JWT signing secret |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Used only by the one-time seed script, then remove |
| `NEXT_PUBLIC_SITE_URL` | Canonical domain for metadata, sitemap, share links |
| `S3_*` or `CLOUDINARY_*` | Image upload storage |
| `RESEND_API_KEY` | Optional email notifications |

Remove `GITHUB_*` variables after migration — the database becomes the source of truth.

### Endpoint mapping

| Current | New |
|---|---|
| `GET /api/catalog` | `GET /api/catalog` (public, cached) or direct DB query in Server Components |
| `PUT /api/catalog` | `POST/PUT/DELETE /api/admin/products`, `/api/admin/combos`, `/api/admin/categories` |
| `GET /api/blog` | `GET /api/posts`, `GET /api/posts/[slug]` (published only) |
| `PUT/POST/DELETE /api/blog` | `POST/PUT/DELETE /api/admin/posts`, `POST /api/admin/posts/[id]/publish` |
| `POST /api/blog-image` | `POST /api/admin/uploads` (signed upload to object storage) |
| `POST /api/login` | `POST /api/auth/login` |
| `POST /api/logout` | `POST /api/auth/logout` |
| `GET /api/me` | `GET /api/auth/session` |
| — (WhatsApp only) | `POST /api/orders` (new) |
| — (not stored) | `POST /api/newsletter` (new) |

### API rules

- Validate every request body with Zod before touching the database.
- Use Prisma parameterized queries; never concatenate SQL.
- Hash admin passwords with `bcrypt` (cost 12+) or `argon2`.
- Store sessions server-side or use short-lived signed cookies; keep `HttpOnly`, `Secure`, `SameSite=Lax`.
- Protect all `/api/admin/*` routes with a shared auth guard and role check.
- Rate-limit login, order and newsletter endpoints.
- Return consistent errors: `{ error, code, fieldErrors? }`.
- Add `Cache-Control` headers for public catalog/post reads.
- Wrap order creation in a transaction and recalculate totals on the server; never trust client prices.
- Add an `audit_log` table if multiple editors will use the admin.

### Reuse logic

Port these existing utilities into `src/lib/`:

- `escapeHTML` → not needed in React (React escapes by default); remove manual HTML injection.
- `formatPrice` → keep as `formatINR(paise)`.
- `normalizeProduct` / `normalizeCombo` → convert to server serializers that never leak internal fields.
- Cart line keys and WhatsApp message builder → keep in shared client helpers.

## 7. Phase 3 — Frontend migration

### Route map

| Current file | New route |
|---|---|
| `index.html` | `/` |
| `shop.html?category=...&q=...` | `/shop` (search params) |
| `cart.html` | `/cart` |
| `about.html` | `/about` |
| `blog.html` | `/blog` |
| `blog.html?slug=...` | `/blog/[slug]` |
| `admin.html` | `/admin` (protected) |
| `privacy_policy.html` | `/policies/privacy` |
| `store_policy.html` | `/policies/store` |
| `404.html` | `app/not-found.tsx` |
| `header.html` / `footer.html` | `components/layout/Header.tsx`, `Footer.tsx` |

### Component plan

- `Header` (nav, search, cart badge, mobile drawer)
- `Footer` (links, newsletter form, WhatsApp)
- `Hero` (background image + copy; keep the current `hero.css`)
- `CategoryCards`
- `SignatureRail` (poster deck)
- `ProductCard`, `ProductGrid`, `ProductModal`
- `CartDrawer`, `CartPage`, `CartBar`
- `BlogCard`, `BlogList`, `BlogArticle`
- `Admin` shell: login, product table, combo table, blog editor, image uploader
- `Reveal` wrapper for the existing scroll-reveal behavior

Keep the current CSS files and import them in the root layout, or convert them gradually to CSS Modules. Do not rewrite the visual design during the migration.

### Client state

- Keep `localStorage` cart for now (`veb_cart`) to preserve existing behavior; move to a React `CartProvider`.
- Later, persist carts server-side if you need cross-device carts or abandoned-cart tracking.
- Use TanStack Query only where client-side fetching is needed; prefer Server Components for catalog and blog reads.

### SEO

- Replace per-page `<meta>` tags with the Next.js Metadata API.
- Generate `sitemap.xml` and `robots.txt` from the database.
- Keep JSON-LD (`Bakery`) and add `Product` and `BlogPosting` schema.
- Use `generateStaticParams` + ISR for product and blog pages.
- Add canonical URLs, Open Graph images and breadcrumbs.
- Preserve existing title/description wording where possible.

### Animations

- Keep `animations.css` and the IntersectionObserver reveal engine as a small React hook or component.
- Reuse `hero.css` unchanged; the hero is already a static background.
- Respect `prefers-reduced-motion`.

## 8. Phase 4 — Data migration

Write a one-time Node script (`scripts/import-json.ts`) that reads the old JSON and inserts into MySQL through Prisma:

1. Clean strings: trim, fix UTF-8/mojibake, normalize dashes and quotes.
2. Create categories from unique product categories.
3. Insert products:
   - `id` → keep as `sku`
   - `name` → `name`
   - derive `slug` (lowercase, hyphenated, unique)
   - `description`, `poster`, `image` → URLs
   - `sizes[]` → `product_sizes` with `pricePaise = Math.round(price * 100)`
   - `sizeImages` → `product_sizes.imageUrl`
4. Insert combos:
   - `price` → `pricePaise`
   - `weight` → `weightLabel`
   - `includes[]` → `combo_items`, linking `productId` by matching `sku`, but always storing `nameSnapshot` and `quantityLabel`
   - derive `slug`
5. Insert blog posts:
   - `date` → `DateTime`
   - `content` → JSON
   - `status` → `DRAFT`/`PUBLISHED`
   - keep `coverImage`
6. Seed one admin user from `ADMIN_USERNAME`/`ADMIN_PASSWORD` with a hashed password.
7. Insert a `settings` row with the WhatsApp number and site URL.

After import, verify:

- Product count = old count (currently 8).
- Combo count = old count (currently 3).
- Every product has at least one size.
- Every combo item resolves to a product where possible.
- No duplicate slugs or SKUs.
- Prices match after paise conversion.
- Blog post count and statuses match.
- Spot-check 5 product pages and 3 blog pages against the old site.

Keep the original JSON files in the repo until the new site has been live and verified for at least two weeks.

## 9. Phase 5 — Admin panel

Rebuild `admin.html` as protected React pages:

- Login (server session cookie, no credentials in the bundle).
- Product list: search, filter, active toggle, edit, delete.
- Product editor: name, slug, category, description, images, size/price rows.
- Combo editor: name, slug, description, image, weight, price, included products.
- Blog editor: title, slug, category, date, cover image, block editor, draft/publish.
- Image upload: upload to object storage and save the returned URL. Stop committing images to GitHub.
- Publish flow: direct database write; no SHA conflicts or redeploys.
- Optional: order list with status updates (NEW → CONFIRMED → PACKED → DELIVERED).
- Optional: newsletter subscriber list and CSV export.

## 10. Phase 6 — New capabilities (optional but recommended)

### Orders

Even if checkout stays on WhatsApp:

1. `POST /api/orders` saves the customer details and line items.
2. Return an order number and the generated WhatsApp link.
3. Show the order number in the WhatsApp message.
4. Add an admin order list.

Later add Razorpay/Stripe and an `ONLINE` payment channel.

### Newsletter

Replace the front-end-only form with `POST /api/newsletter` and the `newsletter_subscribers` table. Add double opt-in if you send marketing email.

## 11. Phase 7 — Testing and QA

- Unit tests: price formatting, cart totals, slug generation, API validation.
- Integration tests: catalog CRUD, blog publish/unpublish, order creation, auth guard.
- E2E (Playwright): home → shop → filter → product modal → add to cart → cart → WhatsApp link.
- E2E admin: login → create product → publish → visible on shop; create draft post → not public; publish post → public.
- Responsive checks at 360, 768, 1024, 1440, 1920 px.
- Accessibility: keyboard nav, focus trap, labels, contrast, reduced motion.
- Security: login rate limit, authorization on every admin route, SQL injection attempts, XSS in blog content, upload file-type validation.
- Performance: Lighthouse mobile ≥ 90, image formats (AVIF/WebP), lazy loading.
- SEO: verify canonical URLs, sitemap, robots, structured data, 200/301 status codes.

## 12. Phase 8 — Deployment and DevOps

### Recommended deployment

- Frontend/API: Vercel
- Database: Railway, Aiven, DigitalOcean Managed MySQL, or AWS RDS
- Uploads: S3-compatible bucket or Cloudinary
- DNS: keep the current registrar; point to the new deployment at cutover

### Alternative

- VPS (Ubuntu) with Nginx + Node (PM2) + MySQL on the same or separate host.
- Use this if MySQL connection limits or long-running jobs become a problem on serverless.

### Checklist

- Separate `staging` and `production` databases.
- Run `prisma migrate deploy` during deploys; never `migrate dev` in production.
- Automatic daily database backups, tested restore.
- Store all secrets in the host's environment variables, not in the repo.
- Add error monitoring (Sentry) and uptime checks.
- Add database indexes for catalog, blog and order queries.
- Configure `NEXT_PUBLIC_SITE_URL`, canonical domain and HTTPS.
- Add security headers (CSP, HSTS, `X-Content-Type-Options`, frame deny).

## 13. Phase 9 — Cutover

1. Finish data import and run a full staging review.
2. Freeze edits on the old admin.
3. Run the import one final time against production.
4. Deploy the new site to a preview URL and smoke-test:

   - Home, shop filters, product modal, add to cart
   - Cart page/drawer, totals, WhatsApp message
   - Blog list and article
   - Admin login and one safe edit
   - Policy pages
   - 404 page

5. Point DNS to the new deployment.
6. Add 301 redirects for every old URL:

   ```text
   /index.html                  -> /
   /shop.html                   -> /shop
   /shop.html?category=Varkey   -> /shop?category=Varkey
   /cart.html                   -> /cart
   /about.html                  -> /about
   /blog.html                   -> /blog
   /blog.html?slug=...          -> /blog/...
   /privacy_policy.html         -> /policies/privacy
   /store_policy.html           -> /policies/store
   /admin.html                  -> /admin
   ```

7. Submit the new sitemap in Google Search Console and request indexing.
8. Keep the old static site available on a subdomain or branch for at least 30 days.
9. Monitor logs, 404s and order flow for 48 hours.

### Rollback

- Keep the `pre-migration-static` tag deployable.
- Revert DNS to the old deployment if a critical issue appears.
- Keep the MySQL import script idempotent so it can be re-run safely.

## 14. Suggested timeline

| Phase | Work | Estimate |
|---|---|---|
| 0 | Backup, inventory, staging | 1–2 days |
| 1 | Database + Prisma schema | 2–3 days |
| 2 | API, auth, uploads | 1–2 weeks |
| 3 | React pages/components | 2–3 weeks |
| 4 | Data import + verification | 2–4 days |
| 5 | Admin panel | 1–2 weeks |
| 6 | Orders/newsletter | 3–5 days |
| 7 | Testing/QA | 1 week |
| 8 | Deployment | 2–3 days |
| 9 | Cutover + monitoring | 1–2 days |

For one developer, plan roughly 8–12 weeks for a careful migration with the admin panel, testing and cutover. A stripped-down catalog + blog + cart launch can be done sooner; add orders and editor workflows afterward.

## 15. Risks and gotchas

- **Prices**: current values may be test data. Confirm before import.
- **Text encoding**: fix `�?` sequences in descriptions during import.
- **Serverless + MySQL**: connection exhaustion is common; use pooling or a persistent server.
- **SEO loss**: do not skip 301 redirects, metadata and sitemap regeneration.
- **Admin security**: never keep plain-text credentials in env vars longer than the initial seed; never expose DB credentials to the browser.
- **Images**: migrate files off GitHub commits to object storage; keep original filenames in the DB.
- **Cart**: if you keep localStorage, users lose carts across devices; decide before launch.
- **WhatsApp flow**: preserve it as a fallback while online ordering is introduced.
- **Big-bang rewrite**: build the new site in parallel and cut over only after staging sign-off.

## 16. Definition of done

- All pages from the current site exist in React with matching content and design.
- Products, combos and blog posts are stored in and served from MySQL.
- Admin can create, edit, publish and delete content without touching GitHub.
- Cart and WhatsApp ordering work end to end; orders are recorded.
- Old URLs redirect to new URLs with 301s.
- Sitemap, robots, metadata and structured data are correct.
- Automated tests pass in CI.
- Daily backups and monitoring are in place.
- The old static site remains deployable for rollback.
