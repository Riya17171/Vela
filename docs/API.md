# Vela API reference (v1)

Base URL: `http://localhost:4000/api/v1` in development (or `/api/v1` through the Vite proxy / a Vercel rewrite). Every route below is relative to it.

The Postman collection in `postman/Vela.postman_collection.json` contains a working request for every endpoint listed here; see [POSTMAN.md](./POSTMAN.md).

## Conventions

### Response envelope

Success:

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": { "products": [] },
  "meta": { "page": 1, "limit": 12, "total": 0, "totalPages": 0, "hasNextPage": false }
}
```

`meta` is present only on paginated lists.

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "OPTIONAL_MACHINE_READABLE_CODE",
  "errors": [{ "field": "email", "message": "Enter a valid email address" }],
  "details": {}
}
```

`code`, `errors` and `details` appear only when relevant. Stack traces are never returned in production; in development an unexpected 500 also carries a `debug` object.

### Money

All amounts (`price`, `subtotal`, `tax`, `shipping`, `total`, `minPrice`, `maxPrice`, `lineTotal`, …) are **integers in the smallest currency unit** — paise for INR. `₹1,06,500` is `10650000`. The store currency comes from `CURRENCY` (default `INR`).

### Pagination

List endpoints accept `page` (≥ 1, default 1) and `limit` (≥ 1; default `PAGINATION_DEFAULT_LIMIT` = 12; values above `PAGINATION_MAX_LIMIT` = 48 are capped). Invalid values (`page=0`, `limit=abc`) return 400.

### Authentication

| Label | Meaning |
|---|---|
| **public** | No credentials. |
| **customer** | `Authorization: Bearer <accessToken>` for any active account. |
| **admin** | Bearer token of an account whose role (read from the database) is `admin`. Customers get 403. |
| **cookie** | Uses the `vela_rt` httpOnly refresh cookie (path `/api/v1/auth`). If the request has an `Origin` header it must be one of `CLIENT_ORIGINS`, otherwise 403 `ORIGIN_NOT_ALLOWED` (CSRF guard). Non-browser clients send no Origin and are allowed. |

Access tokens are HS256 JWTs valid for `JWT_ACCESS_EXPIRES_IN` (15 min). Every authenticated request reloads the user, so suspensions and password changes take effect immediately.

Authentication failures:

| Status | code | When |
|---|---|---|
| 401 | `NO_TOKEN` | No bearer token |
| 401 | `TOKEN_EXPIRED` | Access token expired → call `POST /auth/refresh` and retry once |
| 401 | `INVALID_TOKEN` | Malformed or wrongly signed token |
| 401 | `TOKEN_REVOKED` | Password changed/reset (token version bumped) or user deleted |
| 403 | `ACCOUNT_SUSPENDED` | Account suspended by an admin |
| 403 | — | `Administrator access required` on admin routes |

**401 → refresh behaviour (frontend):** on 401 with `TOKEN_EXPIRED`, `INVALID_TOKEN`, `TOKEN_REVOKED` or `NO_TOKEN`, the client makes one shared `POST /auth/refresh` call; if it succeeds the original request is retried once with the new token, otherwise the session is cleared. Refresh tokens rotate on every use; presenting an already-rotated token more than 10 seconds after rotation revokes the whole session family.

### Rate limits

Per client IP, fixed window of `RATE_LIMIT_WINDOW_MINUTES` (15):

| Limiter | Default | Applies to |
|---|---|---|
| auth | `RATE_LIMIT_AUTH_MAX` = 20 **failed** requests (successful ones are not counted) | `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `PATCH /auth/change-password`, `PATCH /users/me/password`, `POST /newsletter/subscribe` (shared counter) |
| api | `RATE_LIMIT_API_MAX` = 600 | everything under `/api/v1` except the webhook |

Exceeding a limit returns 429 `{ "success": false, "message": "...", "code": "RATE_LIMITED" }` with `RateLimit`, `RateLimit-Policy` and `Retry-After` headers. Limits are disabled when `NODE_ENV=test`.

### Common errors

| Status | code | Meaning |
|---|---|---|
| 400 | — | `Validation failed` with `errors[]`. Request bodies use strict schemas: **unknown fields are rejected**, which blocks mass assignment (`role`, `price`, `total`, `paymentStatus`, `ratingAverage`, …). |
| 400 | `ILLEGAL_KEY` | A key starting with `$` or containing `.` anywhere in body/query/params (NoSQL operator injection). Note: unknown query keys such as `price[$gt]` are normally rejected earlier by validation. |
| 400 | — | `Malformed JSON body`, `Invalid value for <path>` (bad id cast) |
| 404 | — | Resource not found, or `Route <METHOD> <path> not found` |
| 409 | — | Duplicate unique value: `A record with this <field> already exists` |
| 413 | — / `FILE_TOO_LARGE` | Body over 100 kB / image over `MAX_UPLOAD_MB` |
| 500 | — | `Something went wrong. Please try again.` |

---

## Health

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | public | 200 `{ status: "ok", database: "connected", uptimeSeconds }`, message `Vela API is running`. 503 with `status: "degraded"` when MongoDB is disconnected. |
| GET | `/config` | public | Non-secret settings: `currency`, `taxRate`, `shippingFee`, `freeShippingThreshold`, `maxCartItemQuantity`, `maxCompareItems`, `reservationMinutes`, `payments { enabled, provider, keyId, testMode }`, `uploadsEnabled`. Never contains a secret. |
| POST | `/newsletter/subscribe` | public, auth limiter | Body `{ email }`. Always the same 200 message for new and existing addresses. |

## Authentication

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/auth/register` | public | `{ fullName (2–100), email, password }` | 201 `{ user, accessToken }` + `Set-Cookie: vela_rt` |
| POST | `/auth/login` | public | `{ email, password (1–128) }` | 200 `{ user, accessToken }` + cookie |
| POST | `/auth/refresh` | cookie | none | 200 `{ user, accessToken }` + rotated cookie |
| POST | `/auth/logout` | cookie | none | 200; refresh session revoked, cookie cleared |
| GET | `/auth/me` | customer | — | 200 `{ user }` |
| POST | `/auth/forgot-password` | public | `{ email }` | 200, generic message always |
| POST | `/auth/reset-password` | public | `{ token (20–200 chars), password }` | 200; all sessions revoked |
| PATCH | `/auth/change-password` | customer | `{ currentPassword, newPassword }` | 200 `{ user, accessToken }` + new cookie; all other sessions revoked |

Rules: email is trimmed and lower-cased; passwords must be 8–128 characters with a lowercase letter, an uppercase letter and a number. Registration always creates `role: "user"`; there is no public way to create an admin.

`user` object (the only user shape the API returns):

```json
{
  "id": "…", "fullName": "Asha Rao", "email": "asha@example.com", "phone": null,
  "avatarUrl": null, "role": "user", "status": "active",
  "addresses": [ { "id": "…", "label": "Home", "fullName": "…", "phone": "…", "line1": "…", "line2": null,
                   "city": "…", "state": "…", "postalCode": "…", "country": "IN", "isDefault": true } ],
  "createdAt": "…", "updatedAt": "…"
}
```

Errors: 409 `EMAIL_TAKEN`; 401 `INVALID_CREDENTIALS` (same message for unknown email and wrong password); 403 `ACCOUNT_SUSPENDED` (only after a correct password); 401 `NO_REFRESH_TOKEN`, `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_REVOKED`, `REFRESH_TOKEN_EXPIRED`, `ACCOUNT_UNAVAILABLE` on refresh; 403 `ORIGIN_NOT_ALLOWED`; 400 `INVALID_RESET_TOKEN` (unknown, expired or already used); 400 `INVALID_CURRENT_PASSWORD`; 400 when the new password equals the current one.

Password reset tokens are 32 random bytes, stored only as a SHA-256 hash, valid for `PASSWORD_RESET_TTL_MINUTES` (30) and single-use. They are emailed via SMTP; without SMTP and only in development the reset link is written to the server log.

## User profile

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| GET | `/users/me` | customer | — | `{ user }` |
| PATCH | `/users/me` | customer | at least one of `fullName`, `phone` (`/^\+?[0-9\s-]{7,20}$/` or `""` to clear), `avatarUrl` (https URL or `""`) | `{ user }` |
| PATCH | `/users/me/password` | customer, auth limiter | same as `/auth/change-password` | same as `/auth/change-password` |
| GET | `/users/me/recently-viewed` | customer | — | `{ items: [{ viewedAt, product }] }`, newest first, active products only |
| POST | `/users/me/recently-viewed` | customer | `{ productId }` | 200; one entry per product, history capped at 20 |

`role`, `email`, `status` and any other field are rejected with 400.

## Addresses

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| GET | `/users/me/addresses` | customer | — | `{ addresses }` |
| POST | `/users/me/addresses` | customer | address (below) | 201 `{ address, addresses }` |
| PATCH | `/users/me/addresses/:addressId` | customer | any subset of the address fields | `{ addresses }` |
| DELETE | `/users/me/addresses/:addressId` | customer | — | `{ addresses }` |

Address: `fullName` (2–100), `phone`, `line1` (3–200), `line2?` (≤200), `city` (2–100), `state` (2–100), `postalCode` (`/^[A-Za-z0-9\s-]{3,12}$/`), `country` (2-letter, default `IN`), `label?` (≤40), `isDefault?`.

The first address becomes the default; setting `isDefault: true` moves the default; deleting the default promotes the next one. Maximum 5 addresses (422 beyond). Another user's address id returns 404.

## Products

| Method | Path | Auth | Success |
|---|---|---|---|
| GET | `/products` | public | `{ products }` + `meta` |
| GET | `/products/featured` | public | same query as `/products`, forced `featured=true` |
| GET | `/products/recommendations?limit=1..24` | public (personalised with a bearer token) | `{ reason: "based_on_activity" \| "top_rated", products }` |
| GET | `/products/:idOrSlug` | public | `{ product }`; 404 for unknown, inactive or archived products |
| GET | `/products/:productId/reviews` | public | see Reviews |
| POST | `/products/:productId/reviews` | customer | see Reviews |

Query parameters for `GET /products` (unknown keys → 400):

| Param | Rule |
|---|---|
| `page`, `limit` | see Pagination |
| `search` | ≤100 chars; case-insensitive literal match on title, description or SKU (regex characters are escaped) |
| `category` | category slug; unknown slug → empty result |
| `minPrice`, `maxPrice` | integers in paise; `minPrice` ≤ `maxPrice` |
| `sort` | `newest` (default), `price_asc`, `price_desc`, `rating`, `title_asc` |
| `size` | exact size, e.g. `M`, `40` |
| `colour` | colour name, case-insensitive exact match |
| `featured`, `inStock` | `true` / `false` |
| `ids` | comma-separated product ids, max 12 (used by Compare) |

Product shape:

```json
{
  "id": "…", "title": "Oversized Cashmere Turtleneck", "slug": "oversized-cashmere-turtleneck",
  "description": "…", "price": 10650000, "currency": "INR",
  "category": { "id": "…", "name": "Womenswear", "slug": "womens-rtw", "colorLabel": "Colour", "sizeLabel": "Size", … },
  "images": [{ "url": "https://…", "alt": "…" }], "image": "https://…", "sku": "VL-WRTW-01",
  "sizes": ["XS", "S", "M", "L", "XL"], "colors": [{ "name": "Ivory", "hex": "#EFECE5" }],
  "attributes": [{ "name": "Origin", "value": "Italy" }, { "name": "Care", "value": "…" }],
  "isFeatured": true, "ratingAverage": 0, "ratingCount": 0,
  "stockStatus": "in_stock | low_stock | out_of_stock", "availableQuantity": 10, "isAvailable": true,
  "createdAt": "…"
}
```

Public responses never include the exact `stock`; `availableQuantity` is `min(stock, MAX_CART_ITEM_QUANTITY)`. Admin responses add `stock`, `status` and `updatedAt`.

Recommendations are rule-based (no machine learning): categories of the shopper's recently viewed and wishlisted pieces → other active in-stock pieces from those categories, best rated first, excluding what was already seen → topped up with featured/top-rated pieces.

## Categories

| Method | Path | Auth | Success |
|---|---|---|---|
| GET | `/categories` | public | `{ categories }` — active only, each with `productCount` (active products) |
| GET | `/categories/:slug` | public | `{ category }`; 404 if unknown or inactive |

## Cart

All routes require **customer**. Every mutation returns the full cart view `{ cart }`:

```json
{
  "items": [{ "id": "…", "productId": "…", "product": { … }, "size": "M", "color": "Ivory",
              "quantity": 1, "unitPrice": 10650000, "lineTotal": 10650000,
              "available": true, "issue": null }],
  "itemCount": 1,
  "hasIssues": false,
  "summary": { "subtotal": 10650000, "discount": 0, "taxRate": 0.08, "tax": 852000, "shipping": 0, "total": 11502000, "currency": "INR" }
}
```

| Method | Path | Body |
|---|---|---|
| GET | `/cart` | — |
| POST | `/cart/items` | `{ productId, quantity (1..MAX_CART_ITEM_QUANTITY, default 1), size?, color? }` |
| PATCH | `/cart/items/:itemId` | `{ quantity }` |
| DELETE | `/cart/items/:itemId` | — |
| DELETE | `/cart` | — (clears the bag) |

Rules: prices always come from the product (a `price` field is rejected). If the product has sizes/colours, a valid `size`/`color` is required (400 otherwise). The same product+size+colour merges into one line. Total quantity of a product across variants may not exceed its stock (409 `INSUFFICIENT_STOCK`) or `MAX_CART_ITEM_QUANTITY` (422 `QUANTITY_LIMIT`). Inactive/archived products → 404. Lines whose product later becomes unavailable are flagged with `issue: "unavailable" | "out_of_stock" | "insufficient_stock"` and excluded from `summary`.

## Wishlist

All routes require **customer**; each returns `{ wishlist: { items: [{ productId, addedAt, product }], count } }`.

| Method | Path | Body |
|---|---|---|
| GET | `/wishlist` | — |
| POST | `/wishlist/items` | `{ productId }` — adding twice is a no-op; unknown/inactive product → 404 |
| DELETE | `/wishlist/items/:productId` | — |

## Orders

All routes require **customer**.

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/orders` | `{ addressId }` **or** `{ shippingAddress }` (exactly one), `contactEmail?`, `saveAddress?`, `idempotencyKey?` (`/^[A-Za-z0-9_-]{8,100}$/`; or header `Idempotency-Key`) | 201 `{ order }` for a new order, 200 with the existing order for a repeated key |
| GET | `/orders/my-orders?page&limit` | — | `{ orders }` + `meta`, newest first |
| GET | `/orders/:orderId` | — | `{ order }`; other users' orders → 404 |
| POST | `/orders/:orderId/cancel` | `{ reason? (≤300) }` | `{ order }` |

`POST /orders` reads the server-side bag, re-prices every line from the database, validates stock, computes totals (tax `TAX_RATE`, shipping `SHIPPING_FEE` / `FREE_SHIPPING_THRESHOLD`) and **reserves stock** atomically (inside a MongoDB transaction when the deployment supports it). The order starts as `status: pending_payment`, `paymentStatus: pending` with `reservationExpiresAt` = now + `ORDER_RESERVATION_MINUTES` (30). The bag is **not** cleared until payment is verified. Totals, prices, statuses and items are never accepted from the client.

Order shape (customer view):

```json
{
  "id": "…", "orderNumber": "VL-261027-06D083BB",
  "items": [{ "id": "…", "productId": "…", "title": "…", "slug": "…", "sku": "…", "image": "…", "category": "Womenswear",
              "size": "M", "color": "Ivory", "unitPrice": 10650000, "quantity": 1, "lineTotal": 10650000 }],
  "subtotal": 10650000, "discount": 0, "taxRate": 0.08, "tax": 852000, "shipping": 0, "total": 11502000, "currency": "INR",
  "contactEmail": "…", "shippingAddress": { … },
  "status": "pending_payment", "paymentStatus": "pending", "reservationExpiresAt": "…",
  "paymentId": null, "paidAt": null, "cancelledAt": null, "cancelReason": null,
  "statusHistory": [{ "status": "pending_payment", "paymentStatus": "pending", "at": "…", "by": "customer", "note": "…" }],
  "createdAt": "…", "updatedAt": "…"
}
```

Items are purchase-time snapshots; later product edits do not change them.

**Lifecycle.** `status`: `pending_payment → confirmed → processing → shipped → delivered`, plus `cancelled` and `expired`. `paymentStatus`: `pending`, `paid`, `failed` (last attempt failed; still payable), `refund_pending`, `refunded`, `void` (cancelled/expired without payment).

| From | To | Who |
|---|---|---|
| pending_payment | confirmed | verified payment only |
| pending_payment | cancelled | customer, admin, system |
| pending_payment | expired | system (reservation elapsed; stock released) |
| confirmed | processing, shipped | admin |
| confirmed | cancelled | customer, admin |
| processing | shipped, cancelled | admin |
| shipped | delivered | admin |

Cancelling releases reserved stock (if it never shipped). Cancelling a **paid** order sets `paymentStatus: refund_pending`; refunds are never automatic — an admin issues them. Cancelling an already-cancelled order returns 200 with `Order was already cancelled`.

Errors: 400 `EMPTY_CART`; 409 `CART_ITEMS_UNAVAILABLE` (with per-item `errors`); 409 `INSUFFICIENT_STOCK` (concurrent purchase of the last unit; `details: { productId, requested, available }`); 404 saved address not found; 409 `INVALID_STATUS_TRANSITION` (e.g. cancelling a processing/shipped order); 409 `ORDER_CHANGED` (concurrent update — retry).

## Payments (Razorpay test mode)

All routes except the webhook require **customer** (admins may also read any payment). When `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are not set, `create-order`, `verify` and `reconcile` return **503 `PAYMENTS_DISABLED`**.

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/payments/create-order` | `{ orderId }` | 201 (new) / 200 (existing) `{ checkout }` |
| POST | `/payments/verify` | `{ orderId, razorpayOrderId (order_…), razorpayPaymentId (pay_…), razorpaySignature (64 hex) }` | 200 `{ outcome, order, payment }`; 202 with `success: false`, `outcome: "pending"` if not captured yet |
| GET | `/payments/:paymentId/status` | — | `{ payment, order: { id, status, paymentStatus } }` |
| POST | `/payments/:paymentId/reconcile` | — | `{ outcome, payment, order }` |
| POST | `/payments/:paymentId/failure` | `{ code?, description?, razorpayPaymentId? }` | records a client-reported failed attempt, then reconciles |
| POST | `/payments/webhook` | raw Razorpay event | 200 `{ outcome }` |

`:paymentId` is Vela's internal payment id (`checkout.paymentId`), not the Razorpay `pay_…` id.

`checkout` (everything Razorpay Checkout needs; never the secret):

```json
{ "keyId": "rzp_test_…", "razorpayOrderId": "order_…", "paymentId": "…", "orderId": "…", "orderNumber": "VL-…",
  "amount": 11502000, "currency": "INR", "name": "Vela", "description": "Order VL-…",
  "prefill": { "name": "…", "email": "…", "contact": "…" }, "testMode": true }
```

**create-order** works only for the caller's `pending_payment` order with `paymentStatus` `pending`/`failed`; the amount is the order total. Calling it again returns the same Razorpay order.

**verify** checks, in order: the order belongs to the caller and its `razorpayOrderId` matches (400 `ORDER_MISMATCH`); `HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, RAZORPAY_KEY_SECRET)` equals the signature, compared in constant time (400 `INVALID_SIGNATURE`); the payment fetched from Razorpay belongs to that order with the same amount and currency (400 `AMOUNT_MISMATCH`). Authorised payments are captured. Then the order becomes `confirmed`/`paid` exactly once, purchased lines are removed from the bag and stock (already reserved) is not touched again. Repeating verify returns `outcome: "already_processed"`. A failed provider payment returns 402 `PAYMENT_FAILED` and leaves the order payable.

`outcome` values: `confirmed`, `confirmed_late` (payment arrived after expiry and stock could be re-reserved), `already_processed`, `refund_required` (payment arrived after cancel/expiry and could not be fulfilled — flagged for an admin refund), `pending`; reconcile can also return `no_attempts` and `failed`.

**reconcile** asks Razorpay for the payments on the order. The frontend calls it when the checkout window is closed: closing the window is not treated as failure.

**webhook** (no auth; registered before the JSON parser so the raw body is preserved): requires `X-Razorpay-Signature = HMAC_SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)` (hex) and uses `X-Razorpay-Event-Id` for deduplication. Handled events: `payment.captured`, `order.paid` (confirm the order), `payment.failed` (record the attempt), `refund.processed` (mark refunded), `refund.failed` (flag for attention). Other events are acknowledged and ignored. Duplicate deliveries return 200 `Duplicate event ignored`; if processing throws, the event record is removed and 500 is returned so Razorpay retries. Errors: 400 `INVALID_SIGNATURE`, 503 `WEBHOOKS_DISABLED` when no webhook secret is configured.

Other payment errors: 409 `ORDER_EXPIRED` (reservation lapsed; stock released), 409 `ORDER_NOT_PAYABLE`, 502 `PAYMENT_PROVIDER_ERROR` (Razorpay call failed; nothing is marked paid), 502 `AMOUNT_MISMATCH` (Razorpay returned an unexpected order amount).

`payment` shape: `{ id, orderId, provider, providerOrderId, providerPaymentId, amount, currency, status (created|authorized|captured|failed|refund_pending|refunded), method, verifiedAt, failureReason, refundedAmount, refundedAt, createdAt, updatedAt }`. Card numbers and CVVs never reach the API.

## Reviews

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| GET | `/products/:productId/reviews?page&limit&sort` | public | `sort`: `newest` (default), `highest`, `lowest` | `{ summary: { average, count, breakdown: { "1"…"5" } }, reviews }` + `meta` |
| POST | `/products/:productId/reviews` | customer | `{ rating (integer 1–5), title? (≤120), comment (3–2000) }` | 201 `{ review }` |
| PATCH | `/reviews/:reviewId` | customer (author only) | any subset of the create fields | `{ review }` |
| DELETE | `/reviews/:reviewId` | author or admin | — | 200 |

`review`: `{ id, productId, rating, title, comment, verifiedPurchase, author: { id, fullName }, isOwn, createdAt, updatedAt }`. `verifiedPurchase` is true when the author has a paid, non-cancelled order containing the product. Product `ratingAverage`/`ratingCount` are recomputed from the reviews after every change. Errors: 409 `DUPLICATE_REVIEW`, 403 editing/deleting someone else's review, 404 unknown or inactive product.

## Admin

Every route requires **admin** (`authenticate` + `authorize('admin')` on the router). Administrators are created only with `npm run create-admin`.

### Dashboard

`GET /admin/dashboard` → `{ stats, recentOrders, lowStockProducts }` where `stats` = `{ currency, totalRevenue (sum of paid orders), paidOrders, totalOrders, ordersByStatus, totalCustomers, lowStockCount, outOfStockCount, lowStockThreshold, ordersNeedingAttention }`.

### Customers

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/users?page&limit&search&role` | `search` matches name/email; each user adds `addressCount`, `orderCount`, `totalSpent`, `lastOrderAt`, `lastLoginAt` |
| GET | `/admin/users/:userId` | `{ user, orders }` (latest 20) |
| PATCH | `/admin/users/:userId/status` | `{ status: "active" \| "suspended" }`; suspending revokes all sessions. 400 for your own account, 403 for admin accounts |

### Orders

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/orders?page&limit&status&paymentStatus&needsAttention&search` | `search` matches order number |
| GET | `/admin/orders/:orderId` | admin order view adds `customer`, `razorpayOrderId`, `inventoryState`, `needsAttention`, `attentionReason` |
| PATCH | `/admin/orders/:orderId/status` | `{ status: "processing" \| "shipped" \| "delivered" \| "cancelled", note? }`; invalid moves → 409 `INVALID_STATUS_TRANSITION`, same status → 409 `NO_OP_TRANSITION`, any other status → 400 |
| POST | `/admin/orders/:orderId/refund` | `{ reason? }` → `{ refund: { id, status, amount }, order }`. Only for `refund_pending` orders or paid orders that are cancelled (409 `NOT_REFUNDABLE`); one refund per payment (409 `REFUND_EXISTS`); 503 `PAYMENTS_DISABLED` without Razorpay keys |

### Products

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/products` | `/products` query plus `status` (`active` \| `inactive` \| `archived`) and `lowStock=true`; all statuses by default |
| POST | `/admin/products` | 201 `{ product }` |
| GET | `/admin/products/:productId` | any status |
| PATCH | `/admin/products/:productId` | any subset of the create fields; omitted fields are untouched |
| DELETE | `/admin/products/:productId` | **archives** (status `archived`, unfeatured) so order history and reviews keep their references |
| PATCH | `/admin/products/:productId/inventory` | exactly one of `{ stock }` (absolute, ≥ 0) or `{ adjustment }` (non-zero integer); 409 `NEGATIVE_STOCK` if it would go below zero |
| POST | `/admin/uploads/images` | multipart field `image` (JPEG/PNG/WebP, ≤ `MAX_UPLOAD_MB`), type verified from the file bytes → 201 `{ image: { url, storageId, width, height, format } }`. Errors: 400 `INVALID_FILE_TYPE`, 413 `FILE_TOO_LARGE`, 503 `UPLOADS_DISABLED` (no Cloudinary credentials), 502 `UPLOAD_FAILED` |

Product body: `title` (2–160), `slug?` (generated from the title; made unique), `description` (10–4000), `price` (integer paise), `category` (existing category id, else 400), `images` (1–8 `{ url (https), alt?, storageId? }`), `sku` (`/^[A-Z0-9-]{3,40}$/`, upper-cased, unique → 409), `stock` (integer ≥ 0), `sizes?` (≤20), `colors?` (`{ name, hex: "#RRGGBB" }`, ≤12), `attributes?` (`{ name, value }`, ≤20), `isFeatured?`, `status?` (default `active`). `ratingAverage`, `ratingCount` and `currency` are server-controlled and rejected.

### Categories

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/categories` | all categories (including inactive) with `productCount` of non-archived products |
| POST | `/admin/categories` | `{ name (2–80), slug?, description?, imageUrl? (https or ""), colorLabel?, sizeLabel?, sortOrder?, isActive? }` → 201; duplicate name/slug → 409 |
| PATCH | `/admin/categories/:categoryId` | any subset; `isActive: false` hides it from the storefront |
| DELETE | `/admin/categories/:categoryId` | 409 `CATEGORY_IN_USE` while non-archived products reference it |
