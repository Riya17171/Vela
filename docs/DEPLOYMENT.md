# Deployment

> Status: API deployed on Render at https://vela-api-5pkm.onrender.com (free plan, Singapore) with MongoDB Atlas. Frontend: see the README for the current state.

Recommended topology:

```
Vercel (frontend/, static)  ──/api/* rewrite──►  Render web service (backend/)  ──►  MongoDB Atlas
                                                         ▲
                                     Razorpay webhooks ──┘
```

Routing `/api/*` through the Vercel domain keeps the refresh cookie **same-site**, so `COOKIE_SAMESITE=lax` works and no third-party-cookie restrictions apply. The alternative (browser calls the API domain directly) is described at the end.

## 1. MongoDB Atlas

1. Create a cluster (M0 free tier is fine). Atlas clusters are replica sets, so transactions are used automatically.
2. *Database Access*: create a user with readWrite on the `vela` database.
3. *Network Access*: allow the API host. Render's outbound IPs vary on free plans; `0.0.0.0/0` with a strong password is the pragmatic choice for a demo.
4. Copy the connection string, e.g. `mongodb+srv://vela:<password>@cluster0.xxxx.mongodb.net/vela?retryWrites=true&w=majority`.

## 2. API on Render

1. New → **Blueprint** → select this repository (uses `render.yaml`), or New → Web Service with root directory `backend`, build `npm ci`, start `npm start`, health check path `/api/v1/health`.
2. Environment variables (secrets entered in the dashboard only):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas URI |
| `JWT_ACCESS_SECRET` | long random string (Blueprint generates one) |
| `CLIENT_ORIGINS` | `https://<your-app>.vercel.app` |
| `APP_URL` | `https://<your-app>.vercel.app` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` (same-site via rewrite) |
| `TRUST_PROXY` | `2` (Vercel rewrite + Render load balancer; use `1` if the browser calls Render directly) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | **test** keys |
| `RAZORPAY_WEBHOOK_SECRET` | secret chosen in step 4 |
| `SMTP_*`, `CLOUDINARY_*` | optional |

Production refuses to start without Razorpay keys, a webhook secret, or with `COOKIE_SECURE=false`; check the deploy log for the list of problems if it does.

3. Seed and create an admin once, from your machine against the production database:

```bash
cd backend
MONGODB_URI="<atlas uri>" NODE_ENV=production … npm run seed -- --allow-production
MONGODB_URI="<atlas uri>" NODE_ENV=production ALLOW_ADMIN_PROVISIONING=true npm run create-admin
```

(The other required variables must be present too; the simplest way is a temporary `backend/.env.production.local` that you delete afterwards, or Render's shell.)

4. Razorpay dashboard (Test Mode) → Webhooks → Add: URL `https://<api>.onrender.com/api/v1/payments/webhook`, secret = `RAZORPAY_WEBHOOK_SECRET`, events `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`.

## 3. Frontend on Vercel

1. Import the repository; **Root Directory: `frontend`**; framework preset Vite (build `npm run build`, output `dist`).
2. Add the API rewrite **before** the SPA fallback in `frontend/vercel.json` (replace the host with your Render URL):

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://<api>.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

3. Environment: `VITE_API_URL=/api/v1` (the default). No secrets belong in Vercel's frontend env.

The committed `frontend/vercel.json` points at this project's API (`https://vela-api-5pkm.onrender.com`); change the host if you deploy your own copy.

## 4. Post-deploy checks

```bash
HEALTH_URL=https://<api>.onrender.com npm run health --prefix backend   # expects {"status":"ok"}
curl -s https://<your-app>.vercel.app/api/v1/config                       # payments.enabled: true, testMode: true
```

Then in the browser: register, add a piece to the bag, pay with `success@razorpay`, confirm the order shows *Confirmed / Paid*, and check the Razorpay test dashboard for the payment and a delivered webhook. Sign in as the admin and mark the order *Processing*.

## Alternative: frontend calls the API domain directly

Set `VITE_API_URL=https://<api>.onrender.com/api/v1`, `CLIENT_ORIGINS=https://<your-app>.vercel.app`, `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none`. This works, but browsers that block third-party cookies (Safari, and Chrome when its third-party-cookie restrictions are enabled) will drop the refresh cookie, so sessions will not survive a reload there. Prefer the rewrite.

## Operations notes

- `SIGTERM` triggers graceful shutdown (stop accepting requests, close MongoDB). Platform restarts are safe.
- If MongoDB is unreachable at boot the process exits non-zero so the platform restarts it; `/api/v1/health` returns 503 while the connection is down.
- Logs are JSON (pino) in production; secrets and tokens are redacted.
- The unpaid-order expiry sweep runs inside the API process every minute. Running several instances is safe (each expiry is a conditional update), just redundant.
