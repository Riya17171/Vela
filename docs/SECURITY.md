# Security

## Threat model in brief

Untrusted: the browser, every request body/query/param/header, and webhook payloads until their signature is verified. Trusted: the API process, MongoDB, and Razorpay's API responses fetched by the server.

## Controls

| Area | Control | Where |
|---|---|---|
| Passwords | bcrypt, 12 rounds (configurable); strength rules (8+ chars, upper, lower, digit); never returned | `models/User.js`, `validators/common.js` |
| Login | Generic `Invalid email or password`; dummy bcrypt compare for unknown emails (similar timing); suspended accounts refused only after a correct password | `services/auth.service.js` |
| Access tokens | HS256 JWT, 15 min, issuer/audience pinned, algorithm pinned; carries `tokenVersion`; user re-loaded on every request | `utils/generateToken.js`, `middlewares/authenticate.js` |
| Refresh tokens | 48-byte random, httpOnly cookie scoped to `/api/v1/auth`, only SHA-256 hash stored, rotated on use, family revoked on reuse, TTL-expired | `services/auth.service.js`, `models/RefreshToken.js` |
| Session revocation | Logout revokes the session; password change/reset bumps `tokenVersion` and revokes all sessions; admin suspension revokes all sessions | auth service, admin controller |
| CSRF | API uses bearer tokens; cookie endpoints (`/auth/refresh`, `/auth/logout`) reject foreign `Origin`; `SameSite` cookie | `middlewares/verifyOrigin.js` |
| Password reset | 32-byte single-use token, hashed at rest, 30-minute expiry, identical response for unknown emails, never returned over HTTP | auth service, `email.service.js` |
| Authorization | `authorize('admin')` on every admin route; ownership checks on orders, addresses, cart lines, payments (404 to avoid id probing); roles never accepted from clients | routes, services |
| Mass assignment | All bodies use strict Zod schemas — unknown keys like `role`, `price`, `total`, `paymentStatus`, `ratingAverage` are a 400, not silently ignored | `validators/` |
| NoSQL injection | Typed Zod parsing; global rejection of `$`-prefixed or dotted keys; `strictQuery`; user search is regex-escaped | `middlewares/rejectOperators.js`, `utils/strings.js` |
| Price integrity | Totals computed server-side from database prices; client totals rejected; Razorpay amount must equal the order total | pricing/order/payment services |
| Payments | Signature `HMAC_SHA256(order_id|payment_id, key_secret)` compared in constant time, **plus** fetching the payment from Razorpay to confirm order id, amount, currency and capture; secrets never sent to the browser; live keys refused unless explicitly allowed | `services/payment.service.js`, `config/env.js` |
| Webhooks | Raw-body HMAC with the webhook secret; event-id de-duplication; unknown/unsigned events rejected | `app.js`, payment service |
| Duplicate operations | Idempotency keys on order creation; conditional state transitions for verify/webhook/cancel/refund | order & payment services |
| Uploads | Admin only; memory storage; 5 MB limit; MIME allow-list **and** magic-byte detection (JPEG/PNG/WebP only, so no SVG); random names; stored in Cloudinary, never on local disk | `middlewares/upload.js`, `services/upload.service.js` |
| Transport & headers | Helmet (CSP, HSTS, nosniff, frame options); CORS allow-list with credentials; `x-powered-by` disabled | `app.js` |
| Abuse | Per-IP rate limits: auth endpoints 20 / 15 min, API 600 / 15 min (configurable); 100 kB JSON limit | `middlewares/rateLimiter.js` |
| Errors | Central handler; stack traces only outside production; 500s return a generic message | `middlewares/errorHandler.js` |
| Logging | Pino with redaction of authorization/cookie headers, passwords, tokens and signatures; request ids | `config/logger.js`, `middlewares/requestLogger.js` |
| Configuration | Env validated at boot; production requires Razorpay keys, webhook secret and `COOKIE_SECURE=true`; `.env` files git-ignored | `config/env.js` |
| Admin provisioning | CLI only (`npm run create-admin`), refuses production without an explicit flag; no public route can create admins | `scripts/createAdmin.js` |

## Development vs production settings

| Setting | Development | Production |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `COOKIE_SECURE` | `false` (http://localhost) | `true` (required) |
| `COOKIE_SAMESITE` | `lax` | `lax` when the frontend proxies `/api` (same site); `none` if API and frontend are on different sites |
| `CLIENT_ORIGINS` | `http://localhost:5173` | exact storefront origin(s), https only |
| `TRUST_PROXY` | `0` | `1` behind Render/Railway/Heroku load balancers (correct client IPs for rate limiting) |
| Razorpay | test keys optional | test keys + webhook secret required; live keys need `RAZORPAY_ALLOW_LIVE_KEYS=true` |
| Password-reset link without SMTP | printed to API console | not delivered (configure SMTP) |
| Error detail | stack traces in 500 bodies | generic message |

## Known limitations

- Rate limiting is in-memory per instance; multiple API instances need a shared store (e.g. Redis) for global limits.
- No account lockout beyond IP rate limiting, no email verification, no 2FA.
- Access tokens remain valid for up to 15 minutes after logout on another device unless the password is changed (tokenVersion) or the account suspended (checked per request).
- The CSP from Helmet applies to API responses; the static frontend's headers are set by its host (configure on Vercel if required).
