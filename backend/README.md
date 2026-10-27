# Vela API (backend)

Express 5 + MongoDB (Mongoose 8) REST API for Vela. See the [root README](../README.md) for the full picture and [docs/API.md](../docs/API.md) for every endpoint.

```bash
cp .env.example .env      # fill MONGODB_URI, JWT_ACCESS_SECRET, Razorpay test keys
npm install
npm run db:dev            # optional: local replica set without installing MongoDB
npm run seed              # catalogue (idempotent)
npm run create-admin      # provision an administrator
npm run dev               # http://localhost:4000/api/v1
```

| Script | Purpose |
|---|---|
| `dev` / `start` | run with file watching / plain |
| `test` | Vitest + Supertest against an in-memory replica set (no external services) |
| `lint` | ESLint |
| `seed` (`-- --reset`) | upsert catalogue (reset dev data first) |
| `create-admin` | create or promote an admin (env vars or prompt) |
| `health` | call `/api/v1/health` (`HEALTH_URL` to target another host) |
| `db:dev` | single-node MongoDB replica set in `.mongo-data/` |

Layout: `src/config` (env, db, Razorpay, logger, business rules) · `src/models` · `src/validators` (Zod) · `src/middlewares` · `src/services` (business logic) · `src/controllers` · `src/routes` · `src/utils` · `src/scripts` · `tests/`.
