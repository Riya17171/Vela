# Vela storefront & admin (frontend)

React 19 + Vite 8 + Tailwind CSS. All data comes from the Vela API through `src/services/apiClient.js`; see the [root README](../README.md).

```bash
cp .env.example .env      # VITE_API_URL=/api/v1 (Vite proxies /api to http://localhost:4000)
npm install
npm run dev               # http://localhost:5173 (start the API first)
npm test                  # Vitest + Testing Library
npm run lint
npm run build             # production bundle in dist/
```

Only `VITE_*` variables reach the browser — never put secrets in them. The Razorpay key **id** is fetched from the API at runtime; the key secret never leaves the backend.

Structure: `services/` (API calls) · `context/` (auth, config, cart, wishlist, compare, theme) · `hooks/` (`useAsync`, `useProducts`, `useFilter`, `useRazorpayCheckout`) · `pages/{client,auth,profile,admin}` · `components/{common,checkout,profile,admin,layout,home,…}` · `validators/` (Yup) · `utils/`.
