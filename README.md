# Vela — Dressed in Silence

> A full-stack luxury fashion e-commerce application: React + Vite storefront and admin dashboard, an Express + MongoDB REST API, first-party authentication, and a Razorpay **test-mode** payment flow verified on the server.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-test%20mode-0C2451?logo=razorpay&logoColor=white)

- **Repository:** https://github.com/Riya17171/Vela
- **Live site:** https://vela-black.vercel.app/ (Vercel) · **API:** https://vela-api-5pkm.onrender.com/api/v1/health (Render, free plan; the first request after ~15 idle minutes takes up to a minute while it wakes) · **Database:** MongoDB Atlas · **Payments:** Razorpay test mode

---

## Contents

1. [Overview](#overview) · [Problem](#problem-statement) · [Users](#target-users) · [Solution](#solution)
2. [Features](#features)
3. [Technology stack](#technology-stack)
4. [Architecture](#architecture)
5. [Project structure](#project-structure)
6. [Getting started](#getting-started) — prerequisites, install, environment, database, admin, run
7. [Authentication](#authentication)
8. [Razorpay test mode](#razorpay-test-mode)
9. [API & Postman](#api--postman)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Security](#security)
13. [Known limitations](#known-limitations)

Further reading: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DATABASE.md](docs/DATABASE.md) · [docs/API.md](docs/API.md) · [docs/SECURITY.md](docs/SECURITY.md) · [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · [docs/POSTMAN.md](docs/POSTMAN.md)


video link : https://drive.google.com/file/d/1xtGAqW53XWlShc0gC2-pQ021I5_zviQU/view?usp=sharing
---

## Overview

Vela is an atmosphere-first luxury storefront inspired by houses like Bottega Veneta and The Row: editorial typography, generous whitespace, restrained motion. The first version was a React frontend that talked straight to Supabase. This version keeps that frontend and its design, and puts a separate **Express API with MongoDB** behind it, which owns all data, authentication, pricing, inventory and payments.

## Problem statement

A storefront that only *looks* complete fails exactly where commerce gets hard: who is allowed to do what, what the price really is, whether the last unit is still available, and whether money actually arrived. The original Vela computed totals in the browser, collected raw card numbers in a form, and showed "Transaction securely approved" without any payment. This project replaces that with a backend that is the single source of truth for identity, prices, stock, orders and payment state.

## Target users

- **Customers** browse the catalogue, filter and compare pieces, keep a wishlist and bag across devices, check out with Razorpay, and track or cancel orders.
- **Administrators** (provisioned from the command line, never via sign-up) manage products, inventory, categories, orders, refunds and customer accounts from the dashboard.

## Solution

Vela splits the product into a React storefront/admin and an Express API that owns every decision that matters:

- **Identity:** first-party accounts with hashed passwords, short-lived access tokens and rotating refresh sessions; admin rights enforced by the server.
- **Truth about money:** the server prices the bag from the database, reserves stock atomically when an order is created, and only confirms an order after Razorpay's signature *and* the provider's own payment record agree. Failed, abandoned and late payments each have a defined outcome.
- **Operations:** administrators manage catalogue, inventory, orders (valid status transitions only), refunds and customers from a dashboard backed by the same API.

Core workflows: **browse & filter → bag → checkout & pay → order tracking/cancellation**, and **admin catalogue/inventory/order management**.

---

## Features

**Storefront**
- Catalogue with search, category/size/colour/price/in-stock filters, whitelisted sorting and pagination (filters live in the URL).
- Product pages with real variants (sizes, colours), image gallery, stock status, attributes, and reviews with a server-calculated rating breakdown.
- Persistent bag and wishlist (MongoDB), live prices, and flags for pieces that sold out or were withdrawn.
- Comparison of up to 4 pieces (browser-local ids, always re-fetched from the API).
- Recently viewed tracking and rule-based recommendations (no machine learning — see [ARCHITECTURE](docs/ARCHITECTURE.md#recommendations)).
- Checkout with saved or new addresses → server-priced pending order with reserved stock → Razorpay Checkout → server verification → confirmation page.
- Order history and detail with timeline, "complete payment" for unpaid orders, and cancellation rules.
- Account page: profile, address book, password change. Forgot/reset password by email.
- Journal (newsletter) sign-up, dark mode, editorial pages, responsive layouts.

**Admin dashboard** (`/admin`, admin role enforced by the API)
- Revenue (paid orders), order counts by status, customers, low/out-of-stock alerts, orders needing attention.
- Products: create/edit/archive, inline stock edits, status (active/inactive/archived), featured flag, image URLs or Cloudinary uploads.
- Categories: create, hide/show, delete (blocked while in use).
- Orders: filter/search, inspect, valid status transitions only, refunds through Razorpay.
- Customers: search, order counts and spend, suspend/reactivate (revokes sessions).

---

## Technology stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19, Vite 8, React Router 7 | SPA with lazy-loaded routes |
| Styling | Tailwind CSS 3, Framer Motion | Existing Vela design system and motion |
| Forms | React Hook Form + Yup | Client validation mirroring the API rules |
| HTTP | Axios | Central client with token refresh and typed errors |
| API | Node.js ≥ 20.19, Express 5 | REST API under `/api/v1` (ES modules) |
| Database | MongoDB + Mongoose 8 | Persistence, indexes, transactions on replica sets |
| Validation | Zod 4 | Strict request schemas (unknown keys rejected) |
| Auth | jsonwebtoken, bcryptjs, cookie-parser | Short-lived JWT + rotating httpOnly refresh cookie |
| Security | helmet, cors, express-rate-limit | Headers, origin allow-list, throttling |
| Payments | `razorpay` (official SDK) | Orders, payment fetch/capture, refunds, webhooks |
| Logging | pino, pino-http | Structured logs with secret redaction |
| Optional | nodemailer (SMTP), cloudinary | Reset emails, image uploads |
| Tests | Vitest, Supertest, mongodb-memory-server, Testing Library | API, business logic and UI tests |

---

## Architecture

```
React page ──► hook / context ──► service (Axios client) ──► Express route
                                                               │
              validate (Zod) ◄── authenticate ◄── authorize ◄──┘
                     │
                 controller ──► service (orders, payments, inventory, auth…) ──► Mongoose model ──► MongoDB
                                         │
                                         └──► Razorpay API  (webhooks come back to /payments/webhook)
```

- **Frontend (`frontend/`)** renders and collects input. It never decides a price, a role or a payment result.
- **API (`backend/`)** follows MVC + services: routes wire middleware to controllers; controllers stay thin; services hold business rules (pricing, inventory reservation, order state machine, payment verification, token rotation); models define schemas and indexes.
- **Checkout** reserves stock atomically when the pending order is created (inside a MongoDB transaction when the deployment supports it), and confirms the order only after the Razorpay signature **and** the payment fetched from Razorpay both check out. Webhooks reconcile the same state idempotently.

Details, diagrams and design decisions: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Project structure

```
Vela/
├── backend/                 Express API
│   ├── src/
│   │   ├── config/          env validation, database, Razorpay, logger, business rules
│   │   ├── models/          User, Product, Category, Cart, Wishlist, Order, Payment, Review,
│   │   │                    RefreshToken, RecentlyViewed, WebhookEvent, NewsletterSubscriber
│   │   ├── validators/      Zod schemas per resource
│   │   ├── middlewares/     authenticate, authorize, validate, rejectOperators, verifyOrigin,
│   │   │                    rateLimiter, requestLogger, upload, errorHandler, notFound
│   │   ├── services/        auth, cart, catalog, inventory, order, orderStatus, payment,
│   │   │                    pricing, review, email, upload
│   │   ├── controllers/     one per resource + admin + meta (health/config/newsletter)
│   │   ├── routes/          /api/v1 routers
│   │   ├── utils/           ApiError, ApiResponse, tokens, cookies, pagination, serializers…
│   │   ├── scripts/         seed, createAdmin, healthCheck, devDatabase (+ data/catalog.js)
│   │   ├── app.js           Express setup
│   │   └── server.js        bootstrap, expiry sweep, graceful shutdown
│   └── tests/               unit/ and integration/ (in-memory replica set)
├── frontend/                React storefront + admin
│   └── src/
│       ├── services/        apiClient + one module per API area
│       ├── context/         Auth, Config, Cart, Wishlist, Compare, Theme
│       ├── hooks/           useAsync, useProducts, useFilter, useRazorpayCheckout…
│       ├── pages/           client/, auth/, profile/, admin/
│       ├── components/      common/, checkout/, profile/, admin/, layout/, home/ …
│       ├── validators/      Yup schemas
│       └── utils/           money/status formatting
├── docs/                    architecture, database, API, security, deployment, Postman
│   └── legacy-supabase/     the original Supabase schema/seed, kept for reference
├── postman/                 Vela.postman_collection.json
├── render.yaml              Render blueprint for the API
└── package.json             root scripts (dev, test, lint, seed, …)
```

---

## Getting started

### Prerequisites

- **Node.js 20.19+** (22 or 24 recommended) and npm 10+.
- **MongoDB**, one of:
  - **MongoDB Atlas** (free tier works; it is a replica set, so transactions are used), or
  - **Docker**: `docker run -d --name vela-mongo -p 27017:27017 mongo:7 --replSet rs0` then `docker exec vela-mongo mongosh --eval "rs.initiate()"`, or
  - **No install at all**: `npm run db:dev` starts a local single-node replica set using the `mongod` binary that `mongodb-memory-server` downloads (data persists in `backend/.mongo-data`).
- A free **Razorpay** account in **Test Mode** for payments (optional to browse; required to check out).

> macOS note: port 5000 is taken by AirPlay Receiver, so the API defaults to **4000**.

### 1. Install

```bash
git clone https://github.com/Riya17171/Vela.git
cd Vela
npm install            # root tooling (concurrently)
npm run install:all    # installs backend/ and frontend/ dependencies separately
```

The root `npm install` does **not** install the apps' dependencies; `install:all` does (or run `npm install` inside each folder).

### 2. Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | e.g. `mongodb://127.0.0.1:27017/vela?replicaSet=rs0` or your Atlas URI |
| `JWT_ACCESS_SECRET` | yes | ≥ 32 random chars: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `CLIENT_ORIGINS` | yes | `http://localhost:5173` locally (comma-separated list) |
| `APP_URL` | yes | storefront URL used in emails, `http://localhost:5173` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for checkout | test keys (`rzp_test_…`); live keys are refused by default |
| `RAZORPAY_WEBHOOK_SECRET` | for webhooks | the secret you set when creating the webhook |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | | `false`/`lax` locally; see [Deployment](#deployment) |
| `TAX_RATE`, `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD`, `ORDER_RESERVATION_MINUTES`, … | | business rules; money in **paise** |
| `SMTP_*`, `CLOUDINARY_*` | optional | email delivery and image uploads |

Every variable is documented in [`backend/.env.example`](backend/.env.example) and validated at startup; a missing or invalid value stops the server with a readable list of problems. The frontend only needs `VITE_API_URL` (default `/api/v1`, proxied by Vite to the API). **Never** put secrets in `VITE_*` variables — they are shipped to every browser.

### 3. Database, seed data and an administrator

```bash
npm run db:dev            # only if you chose the no-install option (keep it running)
npm run seed              # 6 categories + 37 products (safe to re-run)
npm run create-admin      # prompts for email, name and password
```

- The seed **upserts** by slug/SKU: re-running refreshes descriptions but keeps live stock and ratings. `npm run seed -- --reset` wipes catalogue, carts, orders and payments first (development only; refused in production). It creates **no user accounts**.
- The catalogue comes from the original Supabase seed. Prices were converted from USD at a fixed ₹85/USD (rounded to ₹500) because Razorpay test mode settles in INR. Stock levels are deterministic and include low-stock and sold-out pieces to demonstrate those states.
- `create-admin` reads `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` from the environment if set, otherwise prompts (password hidden). It can promote an existing customer after confirmation, and refuses to run in production unless `ALLOW_ADMIN_PROVISIONING=true`. There is no HTTP endpoint that creates admins.

### 4. Run

```bash
npm run dev               # API on http://localhost:4000 and storefront on http://localhost:5173
# or separately
npm run dev:backend
npm run dev:frontend
```

Open http://localhost:5173. Health check: `npm run health` or `GET http://localhost:4000/api/v1/health`.

---

## Authentication

- **Register / login** return a short-lived **access token** (JWT, 15 min, HS256) in the JSON body and set a **refresh token** as an `httpOnly` cookie scoped to `/api/v1/auth`. The frontend keeps the access token in memory only; nothing sensitive is in `localStorage`.
- **Refresh** (`POST /auth/refresh`) rotates the refresh token on every use. Only a SHA-256 hash is stored. Re-using an already-rotated token revokes the whole session family (theft detection); a 10-second grace window tolerates two tabs refreshing at once.
- **Logout** revokes the session; **password change/reset** bumps `tokenVersion` (killing every outstanding access token immediately) and revokes all refresh sessions.
- **Authorization**: `authenticate` loads the user from the database on every request (so suspensions take effect at once) and `authorize('admin')` guards every `/admin` route. Roles are never taken from the client; registration and profile updates reject `role` outright.
- **CSRF**: bearer-token endpoints are not cookie-authenticated. The two cookie endpoints (`/auth/refresh`, `/auth/logout`) check the `Origin` header against `CLIENT_ORIGINS`, on top of `SameSite`.
- **Forgot password** always answers the same way, stores only a hashed single-use token (30 min), and emails a link. Without SMTP, in **development only**, the link is printed to the API console — it is never returned over HTTP.

---

## Razorpay test mode

### Configure

1. Create a Razorpay account → switch the dashboard to **Test Mode** → *Account & Settings → API Keys* → generate a key pair.
2. Put them in `backend/.env` as `RAZORPAY_KEY_ID=rzp_test_…` and `RAZORPAY_KEY_SECRET=…`, then restart the API. The secret stays on the server; the browser only receives the key id.
3. Webhooks (optional locally, recommended when deployed): *Webhooks → Add* with URL `https://<your-api>/api/v1/payments/webhook`, a secret of your choice (→ `RAZORPAY_WEBHOOK_SECRET`) and events `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`. To receive webhooks locally, expose port 4000 with a tunnel such as ngrok or cloudflared.

### Flow

```
Checkout form ─► POST /orders                 server prices the bag, reserves stock, order = pending_payment
              ─► POST /payments/create-order  Razorpay order for exactly order.total (paise)
              ─► Razorpay Checkout (browser)  customer pays with test credentials
              ─► POST /payments/verify        HMAC signature check (constant-time)
                                              + fetch payment from Razorpay: same order, amount, currency, captured
                                              → order confirmed, purchased items removed from the bag
Webhook  ─────► POST /payments/webhook        signed, de-duplicated by event id; same confirmation path
Window closed ─► POST /payments/:id/reconcile asks Razorpay what happened — closing is not treated as failure
```

- Unpaid orders hold their stock for `ORDER_RESERVATION_MINUTES` (default 30) and then expire, releasing it. A payment that arrives after expiry revives the order if stock is still available, otherwise it is flagged for an admin refund.
- Cancelling a **paid** order never refunds automatically: it becomes `refund_pending` and an admin issues the refund from the dashboard (`POST /admin/orders/:id/refund`).

### Test a payment manually

1. Configure test keys as above, run the app, sign in as a customer, add a piece to the bag and go to checkout.
2. Click **Pay** → Razorpay Checkout opens in test mode. Pay with UPI ID `success@razorpay` (or `failure@razorpay` to see a failure), or a test card from Razorpay's docs: [test UPI details](https://razorpay.com/docs/payments/payments/test-upi-details/), [test cards](https://razorpay.com/docs/payments/payments/test-card-details/).
3. On success you land on the order page showing **Confirmed / Paid**, and the Razorpay dashboard (Test Mode → Transactions) shows the payment. Try a failure method or close the window to see the order stay *Awaiting payment* with a "Pay" button.

**What was verified (27 Oct 2026, real Razorpay test mode, MongoDB Atlas):**

| Scenario | Result |
|---|---|
| Successful Netbanking payment through Razorpay Checkout in Chrome | Signature + provider verification passed; order *Confirmed / Paid*; bag emptied; stock decremented once |
| Bank declined (test bank "Failure") | Order stays *Awaiting payment / Failed* with Razorpay's decline reason; retry offered; no success shown |
| Checkout window closed without paying | Server reconciled with Razorpay; "Payment was not completed"; order unchanged |
| Admin cancels a paid order | *Cancelled / Refund pending*; stock returned |
| Admin issues refund | Razorpay refund created; Razorpay reports the payment fully refunded; a second refund is refused (`REFUND_EXISTS`) |

Signature, webhook, duplicate-delivery and late-payment logic are additionally covered by automated tests with the provider stubbed. Webhooks were not exercised live because Razorpay cannot reach `localhost`.

---

## API & Postman

All endpoints live under `/api/v1` and return `{ success, message, data, meta? }` or `{ success: false, message, code?, errors? }`. Money is always an integer in **paise**. Groups: health/config, auth, users & addresses, products & categories, reviews, cart, wishlist, orders, payments, admin.

- Full reference: [docs/API.md](docs/API.md)
- Postman: import [`postman/Vela.postman_collection.json`](postman/Vela.postman_collection.json); request order and admin workflow in [docs/POSTMAN.md](docs/POSTMAN.md).

---

## Testing

```bash
npm test                  # backend then frontend
npm run test:backend      # Vitest + Supertest against an in-memory MongoDB replica set
npm run test:frontend     # Vitest + Testing Library (jsdom)
npm run lint
npm run build
```

- **Backend:** unit tests (pricing, order state machine, signatures, validators, authorization, file-type detection) and integration tests (auth flows incl. refresh-token reuse, profiles, addresses, catalogue filters, cart, wishlist, orders incl. concurrent last-unit purchase and idempotency, payments incl. invalid signatures, amount mismatch, duplicate verify/webhook, late payments, refunds, admin restrictions, reviews, seed idempotency). Razorpay is stubbed; no network calls.
- **Frontend:** API client refresh/single-flight and error normalisation, login validation and redirects, cart issue states, checkout states (no card form, no checkout without payment keys), money formatting.

Results at the time of writing are in the delivery report; re-run the commands above to reproduce.

---

## Deployment

Recommended: **MongoDB Atlas** (database) + **Render** (API, `render.yaml` included) + **Vercel** (frontend, root directory `frontend`). Step-by-step instructions, cookie/CORS settings for same-site vs cross-site hosting, webhook setup and post-deploy checks are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Current status: **deployed and verified (27 Oct 2026).** Frontend on Vercel (root directory `frontend`, `/api/*` rewritten to Render), API on Render (Singapore, free plan), data on MongoDB Atlas. On the live site the full browser flow (register, filters, bag, session restore, checkout, account, wishlist/compare, admin, mobile) passed, a real Razorpay test payment was verified, a bank-declined payment was recorded without a false success, and the webhook endpoint accepted a correctly signed event and rejected a forged one.

---

## Security

Highlights: bcrypt (12 rounds) password hashing; hashed refresh and reset tokens; refresh rotation with reuse detection; Zod strict schemas against mass assignment; `$`-key rejection against NoSQL operator injection; escaped regex search; server-side prices, totals and roles; ownership checks returning 404; Helmet headers; CORS allow-list with credentials; per-IP rate limits (stricter on auth); 100 kB body limits; magic-byte checked uploads; constant-time HMAC verification; raw-body webhook verification and de-duplication; redacted structured logs; sanitized error responses in production; graceful shutdown. Full write-up with development vs production settings: [docs/SECURITY.md](docs/SECURITY.md).

---

## Originality and AI use

Vela began as my own frontend-only project (React + Supabase; history preserved in this repository and the original schema in `docs/legacy-supabase/`). The Express/MongoDB backend, authentication, checkout/payment logic, admin API, tests and the frontend integration were added for the end-term submission. AI assistance (Claude Code) was used for implementation, testing and documentation, as permitted; all workflows were run and verified on the deployed application. Open-source libraries used are listed in `backend/package.json` and `frontend/package.json`.

## Known limitations

- **Webhooks need a public URL.** Locally, refunds stay *Refund pending* in Vela after Razorpay processes them, because the `refund.processed` webhook cannot reach `localhost`; once deployed with the webhook configured they move to *Refunded* automatically.
- **Razorpay test accounts have a small refundable balance.** Razorpay rejects refunds larger than the remaining balance with the generic message "invalid request sent" (observed: refunds of a few thousand rupees succeed, a ₹35,100 refund was rejected). Vela reports this as `REFUND_REJECTED`, keeps the order *Refund pending* and lets the admin retry; nothing is marked refunded.
- **Free hosting sleeps.** Render's free instance spins down after ~15 minutes of inactivity; the first request afterwards can take up to a minute.
- **Email and image uploads are optional integrations.** Without SMTP, reset links are only logged in development; without Cloudinary, admins use image URLs.
- **Guest checkout and a guest bag are not supported** — the bag requires an account, as in the original app. Comparison works for guests (browser-local).
- **Stock is tracked per product, not per size/colour.** Variants share one stock counter.
- **Single currency (INR).** Razorpay test accounts settle in INR by default; very large carts may exceed per-transaction limits configured on a Razorpay account.
- **Search** uses escaped case-insensitive matching on title, description and SKU — adequate for a catalogue of this size, not a full-text search engine.
- **Seed images** are the original Unsplash URLs. Four product photos and the Fragrances category image no longer exist on Unsplash; the storefront shows a named placeholder tile instead of a broken image. Pieces needing new photos (replace via *Admin → Products → Edit*): Sculptural Brass Drop Earrings (VL-ACCS-06), Silence No. 1 (VL-FRAG-01), Parchment (VL-FRAG-02). Several others show unrelated scenes (e.g. VL-WRTW-01 turtleneck shows a T-shirt, VL-ACCS-05 belt shows a backpack, VL-FRAG-03 shows a person) and would also benefit from new photography.
- The original Supabase schema and seed are preserved in `docs/legacy-supabase/` for reference only; the app no longer uses Supabase.
