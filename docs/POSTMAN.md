# Testing the Vela API with Postman

The collection `postman/Vela.postman_collection.json` (Postman v2.1) holds 105 real requests in 12 folders: Health, Authentication, User profile, Addresses, Products, Categories, Cart, Wishlist, Orders, Payments, Reviews and Admin. Every request has test scripts that check the status code and the `{ success, message, data }` envelope and save the ids and tokens later requests need, so the collection is meant to be **run top to bottom**.

It contains no real credentials. Field-by-field documentation is in [API.md](./API.md).

## 1. Prerequisites

1. Start MongoDB, seed and start the API (see the root README):

   ```bash
   cd backend
   npm run seed
   npm run dev          # http://localhost:4000
   ```

2. Optional, for the Admin folder: create an administrator. The script prompts for the password; nothing is hard-coded.

   ```bash
   cd backend
   ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" npm run create-admin
   ```

## 2. Import and configure

1. In Postman, choose **Import** and select `postman/Vela.postman_collection.json`.
2. Open the collection and go to the **Variables** tab:

| Variable | What to do |
|---|---|
| `baseUrl` | `http://localhost:4000/api/v1` locally, or your deployed API URL ending in `/api/v1`. |
| `adminEmail`, `adminPassword` | Fill these in with the admin you created, using the **Current value** column only so they are never exported. If they are empty, the Admin requests are skipped. |
| `razorpayPaymentId`, `razorpaySignature` | Fill these in only to verify a real test payment (see section 4). |
| `webhookSecret` | Optional. Set it to the same value as `RAZORPAY_WEBHOOK_SECRET` to sign the sample webhook. |
| everything else | Set automatically by scripts. `customerEmail` is regenerated on every run, so the flow can be repeated. |

You can also put these in a Postman **environment**. The scripts read variables with `pm.variables`, which resolves both environment and collection scopes.

## 3. Cookies and token refresh

- Register/Login return the **access token** in JSON. The test scripts store it in `{{accessToken}}`, and the collection-level Bearer auth sends it.
- The **refresh token** is an httpOnly cookie, `vela_rt`, scoped to `/api/v1/auth`. Postman (and Newman) keep it in the cookie jar automatically, so `POST /auth/refresh` needs no body. Each call rotates the cookie and returns a new access token.
- `/auth/refresh` and `/auth/logout` reject requests whose `Origin` header is not an allowed frontend origin (a CSRF guard). Postman sends no `Origin` header, so these requests are accepted. The collection includes one deliberate "foreign origin → 403" request.
- In the Postman app you can inspect or clear the cookie under **Cookies → localhost**.
- Access tokens expire after 15 minutes. If a later request returns 401 `TOKEN_EXPIRED`, run **Authentication → Login** (or **Refresh**) again.

## 4. Customer workflow (request order)

```
Health check
   ↓
Authentication / Register              → saves accessToken, userId; sets vela_rt cookie
   ↓
Authentication / Login                 → saves accessToken
   ↓
User profile / Get profile
   ↓
Products / Search: cashmere turtleneck → saves productId (sizes XS–XL; colours Obsidian/Ivory/Stone)
   ↓
Cart / Add item (size M, Ivory)        → saves cartItemId
   ↓
Addresses / Create address             → saves addressId
   ↓
Orders / Create order                  → saves orderId (pending_payment, stock reserved)
   ↓
Payments / Create Razorpay order       → saves paymentId, razorpayOrderId
   ↓
Pay in Razorpay test checkout          (outside Postman: see below)
   ↓
Payments / Verify payment (real test checkout)
   ↓
Orders / My orders                     → order is confirmed / paid
```

Using **Run collection** runs the whole sequence, including the negative tests:
- a profile request without a token → 401;
- registering with `"role": "admin"` → 400;
- a customer calling `GET /admin/dashboard` → 403;
- a client-supplied order `total` → 400;
- a malformed or wrong payment signature → 400.

### Paying in test mode

A payment can only be verified with a **real** `razorpay_payment_id` and `razorpay_signature` produced by Razorpay Checkout in **test mode**. The collection never fabricates a success.

1. Configure `RAZORPAY_KEY_ID` (`rzp_test_…`) and `RAZORPAY_KEY_SECRET` on the backend and restart it. Without them, `Create Razorpay order` returns **503 `PAYMENTS_DISABLED`**. The tests accept that response, and the payment-detail requests are skipped.
2. Pay with Razorpay test credentials from https://razorpay.com/docs/payments/payments/test-card-details/. The easiest way is through the Vela frontend checkout. Alternatively, open Razorpay Checkout yourself with the `checkout` object returned by `Create Razorpay order`.
3. Copy `razorpay_payment_id` and `razorpay_signature` from the checkout handler response into the `razorpayPaymentId` and `razorpaySignature` variables. Make sure `razorpayOrderId` and `orderId` still refer to the same order.
4. Send **Payments → Verify payment (real test checkout)**. Expect `outcome: "confirmed"`, `order.status: "confirmed"` and `order.paymentStatus: "paid"`. Sending it again returns `already_processed`.

If the checkout window was closed without a callback, **Payments → Reconcile with Razorpay** asks Razorpay what actually happened.

The **Webhook (signed)** request shows how Razorpay calls the API. Its pre-request script signs the raw body with `CryptoJS.HmacSHA256(body, webhookSecret)`. With no secret configured on the server, the API answers 503 `WEBHOOKS_DISABLED`; with a wrong signature, 400 `INVALID_SIGNATURE`.

## 5. Admin workflow

With `adminEmail` and `adminPassword` filled in, the Admin folder runs:

```
Customer calling admin dashboard → 403
Admin login                          → saves adminAccessToken (folder uses it as Bearer)
Dashboard
List customers / Customer detail
List orders / Order detail
Invalid transition (pending → shipped) → 409 INVALID_STATUS_TRANSITION
Cancel order (admin)                 → stock released
Refund unpaid order                  → 409 NOT_REFUNDABLE (503 without Razorpay keys)
Create / update / list category
Create product (inactive, in that category) → ratings are 0 and server-controlled
Create product with rating           → 400
Update product, inventory −2, inventory → negative (409), inventory absolute
Delete category in use               → 409 CATEGORY_IN_USE
Archive product, then delete the now-empty category
Upload product image                 (skipped unless uploadImagePath is set; 503 without Cloudinary)
Suspend customer → their token gets 403 ACCOUNT_SUSPENDED → Reactivate customer
```

To refund a real test payment, cancel a **paid** order (`PATCH /admin/orders/:orderId/status` with `{"status":"cancelled"}`), which moves it to `refund_pending`. Then call `POST /admin/orders/:orderId/refund`.

## 6. Running with Newman

```bash
npm install -g newman            # or: npx newman …
newman run postman/Vela.postman_collection.json \
  --env-var "baseUrl=http://localhost:4000/api/v1" \
  --env-var "adminEmail=you@example.com" \
  --env-var "adminPassword=<your admin password>"
```

Newman keeps cookies between requests within a run, so the refresh flow works the same as in the app.

**Rate limits:** the auth limiter (`RATE_LIMIT_AUTH_MAX`, default 20 per 15 minutes per IP) counts only **failed** requests (4xx/5xx) on the auth endpoints. A full run deliberately makes a few failing auth requests (negative tests), so many back-to-back runs from one machine can still reach the limit; requests then receive 429 `RATE_LIMITED` with a `Retry-After` header. Wait for the window to reset, restart the API (the limiter is in memory), or raise `RATE_LIMIT_AUTH_MAX` in your local `backend/.env`.
