# Architecture

## System overview

```
┌──────────────────────────── Browser ─────────────────────────────┐
│ React 19 SPA (frontend/)                                          │
│  pages ─► contexts/hooks ─► services/*.js ─► services/apiClient   │
│  access token: memory only   refresh token: httpOnly cookie       │
│  Razorpay Checkout (checkout.razorpay.com) collects payment data  │
└───────────────┬───────────────────────────────────┬──────────────┘
                │ /api/v1 (JSON, Bearer)             │ card/UPI data (never to Vela)
┌───────────────▼──────────────┐            ┌────────▼─────────┐
│ Express 5 API (backend/)     │◄── webhook ─│ Razorpay (test)  │
│ helmet · cors · rate limit   │──── SDK ───►│ orders/payments  │
│ routes → validate → controller│            └──────────────────┘
│ services (business rules)     │
│ Mongoose models               │
└───────────────┬──────────────┘
                │
        ┌───────▼────────┐      optional: SMTP (reset emails), Cloudinary (images)
        │ MongoDB         │
        │ (replica set →  │
        │  transactions)  │
        └─────────────────┘
```

In development, Vite (port 5173) proxies `/api` to the API (port 4000), so the browser sees a single origin and the refresh cookie is first-party.

## Backend layers

| Layer | Folder | Responsibility | Never does |
|---|---|---|---|
| Configuration | `src/config` | Parse/validate env (`env.js`), connect MongoDB and detect transaction support (`database.js`), Razorpay client, logger, business rules | Business logic |
| Routes | `src/routes` | Map HTTP verbs/paths to middleware + controller | Database access |
| Middleware | `src/middlewares` | `authenticate`, `authorize`, `validate` (Zod), `rejectOperators`, `verifyOrigin` (CSRF), rate limits, request logging, uploads, error handling | Business rules |
| Controllers | `src/controllers` | Read `req.validated` + `req.user`, call a service, send the envelope | Pricing, state transitions |
| Services | `src/services` | Pricing, inventory reservation, order state machine, payment verification, token rotation, reviews, recommendations | HTTP concerns |
| Models | `src/models` | Schemas, constraints, indexes | — |
| Utils | `src/utils` | `ApiError`, response helpers, token/cookie helpers, pagination, serializers, transaction helper | — |

`server.js` loads configuration (printing a readable error if it is invalid), connects to MongoDB, starts HTTP, runs the reservation-expiry sweep every minute, and shuts down gracefully on `SIGTERM`/`SIGINT`. `app.js` only builds the Express app, which keeps it importable by tests.

Express 5 forwards rejected promises from async handlers to the error middleware, so no `asyncHandler` wrapper is needed.

## Request lifecycle

1. `requestLogger` assigns `x-request-id` and logs method/URL/status (headers with secrets are redacted).
2. `helmet`, `cors` (allow-list from `CLIENT_ORIGINS`, credentials enabled).
3. `POST /api/v1/payments/webhook` is matched **before** `express.json()` with `express.raw()` so the signature is checked over the exact bytes Razorpay sent.
4. `express.json` (100 kB), `cookie-parser`, `rejectOperators` (400 for any `$…` or dotted key), global API rate limit.
5. Route-level: `authenticate` → `authorize` → `validate` → controller → service.
6. Errors become `{ success:false, message, code?, errors? }`; Mongoose validation/cast/duplicate-key, JSON parse, body size and Multer errors are mapped to 400/409/413; unexpected errors are 500 with a generic message in production.

## Checkout and payment sequence

```
Customer          Frontend                 API                               MongoDB              Razorpay
   │ Pay ───────────►│ POST /orders  ─────────►│ load cart, live prices            │                     │
   │                 │ (idempotencyKey)        │ validate stock & variants         │                     │
   │                 │                         │ BEGIN TXN                         │                     │
   │                 │                         │  $inc stock -q where stock>=q ───►│                     │
   │                 │                         │  insert Order(pending_payment) ──►│                     │
   │                 │                         │ COMMIT                            │                     │
   │                 │ POST /payments/create-order ► orders.create(amount=total) ──────────────────────────►│
   │                 │                         │ Payment(created), order.razorpayOrderId ►│                │
   │                 │ open Checkout(order_id, key_id) ─────────────────────────────────────────────────────►│
   │ pays (test) ────────────────────────────────────────────────────────────────────────────────────────►│
   │                 │◄─ handler(payment_id, order_id, signature)                                           │
   │                 │ POST /payments/verify ─►│ HMAC(order|payment, secret) == signature?               │
   │                 │                         │ payments.fetch(payment_id) ──────────────────────────────►│
   │                 │                         │ order_id, amount, currency match? captured?             │
   │                 │                         │ (authorized → capture)                                   │
   │                 │                         │ Order: pending_payment→confirmed (conditional update) ►│   │
   │                 │                         │ remove purchased lines from bag ─►│                     │
   │                 │◄── 200 confirmed ────────│                                   │                     │
   │                 │                         │◄──────── webhook payment.captured (signed) ──────────────│
   │                 │                         │ event id stored once → same confirm path → already_processed
```

Idempotency and races:

- **Duplicate checkout submissions** share an idempotency key; a unique `(user, idempotencyKey)` index guarantees one order.
- **Last unit**: the conditional `$inc` only succeeds while `stock >= quantity`; the loser gets `409 INSUFFICIENT_STOCK`.
- **Verify vs webhook**: confirmation is a conditional update on `status: pending_payment`, so whichever arrives first wins and the other returns `already_processed`; stock is never decremented again because it was reserved at order creation.
- **Duplicate webhooks**: a unique `(provider, eventId)` record is written before processing and removed if processing throws, so Razorpay's retry can succeed.
- **Concurrent `create-order`**: the Razorpay order id is attached with a conditional update; a losing request discards its provider order and returns the winner's.

Without a replica set (`MONGODB_TRANSACTIONS=off` or a standalone `mongod`), the same code runs without a session: each decrement is still atomic, and partial reservations are compensated before the error is returned.

## Order and payment state

```
status:         pending_payment ─► confirmed ─► processing ─► shipped ─► delivered
                      │   │             │            │
                      │   └─► expired   └──────► cancelled ◄┘
                      └─────────────────────────► cancelled

paymentStatus:  pending ─► paid ─► refund_pending ─► refunded
                   │  ▲
                   ▼  │ (retry succeeds)
                 failed            void (cancelled/expired before payment)
```

| Transition | Who |
|---|---|
| pending_payment → confirmed | verified payment only (verify, webhook or reconcile) |
| pending_payment → cancelled | customer, admin |
| pending_payment → expired | system sweep after `ORDER_RESERVATION_MINUTES` |
| confirmed → processing / shipped | admin |
| confirmed → cancelled | customer, admin (payment → `refund_pending`) |
| processing → shipped / cancelled | admin |
| shipped → delivered | admin |

Inventory: reserved at order creation, committed on payment, released on cancellation/expiry while not shipped (`inventoryState` prevents double release). A payment that arrives after expiry re-reserves stock if possible; otherwise the order is flagged `needsAttention` with `refund_pending`.

## Frontend structure

- `services/apiClient.js` — one Axios instance: base URL from `VITE_API_URL`, `withCredentials` for the refresh cookie, bearer header from an in-memory token, **single-flight refresh** on `401 TOKEN_EXPIRED` (concurrent requests share one refresh so they do not trip reuse detection), and a typed `ApiRequestError` for every failure.
- `context/` — `AuthContext` (session restore, sign in/up/out), `ConfigContext` (public `/config`: currency, payments enabled), `CartContext` and `WishlistContext` (mirror server responses only), `CompareContext` (ids in localStorage), `ThemeContext`.
- `hooks/useRazorpayCheckout.js` — loads Checkout, opens it for an order, sends the callback to `/payments/verify`, and on dismissal calls `/payments/:id/reconcile` instead of assuming failure.
- Route guards (`ProtectedRoute`, `RequireAdmin`) are UX only; the API enforces access.

## Recommendations

`GET /products/recommendations` is a transparent rule set, not machine learning:

1. Collect categories from the shopper's 10 most recently viewed pieces and their wishlist.
2. Suggest other active, in-stock pieces from those categories, highest rated first, excluding pieces already viewed or saved.
3. Fill remaining slots with featured, then highest-rated, pieces. Anonymous visitors get step 3 only.

## Key decisions

- **MongoDB with references + snapshots.** Products, users and orders have independent lifecycles (references); order lines embed a purchase-time snapshot (title, SKU, variant, unit price) so history never changes when a product is edited.
- **Money in paise.** Integers avoid floating-point drift and match Razorpay's smallest-unit amounts.
- **Stock reserved at order creation**, not at payment, so the customer never pays for something that is gone; reservations expire to avoid locking stock forever.
- **Access token in memory, refresh token in an httpOnly cookie.** XSS cannot read a long-lived credential, and API calls are bearer-authenticated (not CSRF-prone).
- **Archive instead of delete** for products, preserving order and review references.
