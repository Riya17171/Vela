# Database design (MongoDB + Mongoose)

All monetary amounts are **integers in paise** (`₹1,06,500` is stored as `10650000`). Every model has `createdAt`/`updatedAt` unless noted.

## Relationships

```
User 1─┬─* Order ──1 Payment
       ├─1 Cart (embedded items ─► Product)
       ├─1 Wishlist (embedded items ─► Product)
       ├─* Review ─► Product
       ├─* RecentlyViewed ─► Product
       └─* RefreshToken
Category 1─* Product
WebhookEvent, NewsletterSubscriber: standalone
```

**Referenced** where entities live independently (users, products, categories, orders, payments, reviews). **Embedded** where data only exists inside its parent: user addresses, cart/wishlist lines, order line snapshots, order status history, payment attempts.

## Models

### User — `backend/src/models/User.js`
Identity, credentials and address book.

| Field | Notes |
|---|---|
| `fullName`, `email` | email lowercased/trimmed, **unique index** |
| `passwordHash` | bcrypt, `select: false` |
| `phone`, `avatarUrl` | optional |
| `role` | `user` \| `admin` (indexed). Never writable through public endpoints |
| `status` | `active` \| `suspended` |
| `tokenVersion` | bumped on password change/reset; embedded in JWTs to revoke them |
| `passwordResetTokenHash`, `passwordResetExpiresAt` | SHA-256 of the emailed token, `select: false`, single use |
| `addresses[]` | embedded (max 5): fullName, phone, line1/2, city, state, postalCode, country, isDefault |
| `lastLoginAt`, `passwordChangedAt` | audit |

Only `toSafeJSON()` output leaves the API.

### Category
`name` (unique, case-insensitive collation), `slug` (unique, kebab-case), `description`, `imageUrl`, `colorLabel`/`sizeLabel` (UI labels like "Leather", "EU Size"), `sortOrder`, `isActive`. Index `{ isActive, sortOrder }`. A category with non-archived products cannot be deleted (deactivate instead).

### Product
| Field | Notes |
|---|---|
| `title`, `slug` (unique), `description` | |
| `price` | integer paise ≥ 0 |
| `currency` | from `CURRENCY` (INR) |
| `category` | ref Category |
| `images[]` | `{ url, alt, storageId }`, at least one |
| `sku` | unique, uppercase |
| `sizes[]`, `colors[] {name, hex}` | the variant options a cart line must choose from |
| `stock` | integer ≥ 0, shared by all variants |
| `status` | `active` (sellable) \| `inactive` (hidden) \| `archived` (retired) |
| `isFeatured`, `attributes[] {name, value}` | |
| `ratingAverage`, `ratingCount` | maintained by the server from reviews |

Indexes: `{status, category, price}`, `{status, isFeatured, createdAt}`, `{status, createdAt}`, `{status, ratingAverage}`, `{status, stock}`, text index on title/description, unique `slug`, unique `sku`.

### Cart / Wishlist
One document per user (`user` unique). Cart lines: `product`, `size`, `color`, `quantity` — **no price**; prices are read from Product every time. Lines are unique per product+size+colour (enforced in the service); `optimisticConcurrency` retries concurrent edits. Wishlist lines: `product`, `addedAt`, de-duplicated with a conditional `$push`.

### Order
| Field | Notes |
|---|---|
| `orderNumber` | `VL-YYMMDD-XXXXXXXX`, unique |
| `user` | ref User |
| `items[]` | snapshot: product ref, title, slug, sku, image, category, size, color, unitPrice, quantity, lineTotal |
| `subtotal`, `discount`, `taxRate`, `tax`, `shipping`, `total`, `currency` | computed by `pricing.service` |
| `shippingAddress`, `contactEmail` | copied at purchase time |
| `status` | fulfilment: pending_payment, confirmed, processing, shipped, delivered, cancelled, expired |
| `paymentStatus` | pending, paid, failed, refund_pending, refunded, void |
| `inventoryState` | reserved → committed \| released (prevents double release) |
| `reservationExpiresAt` | when unpaid stock is released |
| `razorpayOrderId` | unique (partial index), maps internal ↔ provider order |
| `payment` | ref Payment |
| `idempotencyKey` | unique per user (partial index) |
| `statusHistory[]` | `{status, paymentStatus, at, by (customer/admin/system/payment), note}` |
| `needsAttention`, `attentionReason` | e.g. payment after expiry |

Indexes: `{user, createdAt}`, `{status, createdAt}`, `{paymentStatus, createdAt}`, `{status, reservationExpiresAt}` (expiry sweep).

### Payment
One per Razorpay order: `order`, `user`, `provider`, `providerOrderId` (unique), `providerPaymentId`, `amount`, `currency`, `status` (created, authorized, captured, failed, refund_pending, refunded), `method`, `verifiedAt`, `verifiedVia` (verify/webhook/reconcile), failure code/reason, `refundId`, `refundedAmount`, `attempts[]`. **No card numbers, CVVs or other payment credentials are ever stored** — Razorpay Checkout collects them.

### Review
`product`, `user`, `rating` (integer 1–5), `title`, `comment`, `verifiedPurchase` (server-computed from paid orders). Unique `{product, user}`; index `{product, createdAt}`. Aggregates are recomputed after every create/update/delete.

### RefreshToken
`user`, `tokenHash` (SHA-256, unique), `family` (one per login), `expiresAt` (**TTL index** deletes expired sessions), `revokedAt`, `revokedReason` (rotated, logout, reuse_detected, password_change, admin), `replacedByHash`, `userAgent`, `ip`.

### RecentlyViewed
`user`, `product`, `viewedAt`. Unique `{user, product}`, index `{user, viewedAt}`; trimmed to 20 per user.

### WebhookEvent
`provider`, `eventId` (unique together), `event`, `status`, `outcome`. TTL of 90 days.

### NewsletterSubscriber
`email` (unique), `source`.

## Transactions

`database.js` asks the server (`hello`) whether it is a replica set or sharded cluster. With `MONGODB_TRANSACTIONS=auto` (default), stock reservation + order insertion, cancellation + stock release, and expiry run inside a transaction when available. Atlas, `npm run db:dev`, and Docker with `--replSet` all support this. On a standalone server the same code runs with atomic conditional updates and explicit compensation. Set `MONGODB_TRANSACTIONS=on` to refuse to start without transaction support.

## Seeding and reset

- `npm run seed` upserts 6 categories (by slug) and 37 products (by SKU) from `backend/src/scripts/data/catalog.js`. Re-running updates descriptive fields only (`$set`); stock, status and ratings are set on insert only (`$setOnInsert`), so live data is not overwritten.
- `npm run seed -- --reset` (development only) clears catalogue, carts, wishlists, orders, payments, reviews and webhook events, then seeds. User accounts are kept.
- Production seeding requires `--allow-production`; `--reset` is always refused in production.

## Migration from Supabase

The original PostgreSQL schema is in `docs/legacy-supabase/`. Mapping: `profiles` → `User` (with role/status/addresses), `products.category` text → `Product.category` ref, `cart_items`/`wishlist_items` rows → embedded lines in one `Cart`/`Wishlist` per user, `orders` + `order_items` → `Order` with embedded snapshots, `reviews` → `Review` (+ unique per user), `recently_viewed` → `RecentlyViewed`. New: `Payment`, `RefreshToken`, `WebhookEvent`, `NewsletterSubscriber`, product stock/SKU/variants. Supabase's `rating`/`rating_count` seed values were not migrated because no reviews backed them; ratings start at zero and come from real reviews.
