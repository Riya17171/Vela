# Vela — Dressed in Silence

> A full-stack luxury fashion e-commerce platform built with React, Supabase, and Tailwind CSS.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.99-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Design System](#design-system)
- [Features](#features)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Key Technical Decisions](#key-technical-decisions)
- [Known Limitations](#known-limitations)

---

## Overview

Vela is an atmosphere-first luxury clothing storefront inspired by houses like Bottega Veneta and The Row. The project explores how editorial design principles — restraint, proportion, silence — can be applied to e-commerce UI without sacrificing functionality.

The platform ships two distinct experiences from a single codebase:

- **The Storefront** — a client-facing browsing and purchase experience with editorial content, personalised recommendations, and a wishlist/compare system.
- **The Dashboard** — a data-dense admin interface for product management, order fulfilment, customer oversight, and category taxonomy.

---

## Live Demo

🚀 **Storefront:** https://vela-6r9c3riw9-riya17171s-projects.vercel.app
🔐 Admin access available via demo account (configured in database)
## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | React 19 | Concurrent features, `React.lazy` for code splitting |
| Build tool | Vite 8 | Sub-second HMR, native ESM, Rolldown bundler |
| Styling | Tailwind CSS v3 + PostCSS | Utility-first with a custom luxury design token system |
| Animation | Framer Motion 12 | Physics-based springs, AnimatePresence for route transitions |
| Backend | Supabase (PostgreSQL) | Real-time DB, Auth, Storage, and Row Level Security in one service |
| Forms | React Hook Form + Yup | Uncontrolled inputs, schema validation, minimal re-renders |
| Routing | React Router DOM v7 | File-based route splitting with `React.lazy` + `Suspense` |
| Notifications | React Toastify | Silent, non-blocking feedback consistent with the luxury tone |

---

## Architecture

### Frontend

The app uses a decoupled layered architecture:

```
src/
 ├── routes/        # Route definitions, ProtectedRoute, RequireAdmin guards
 ├── pages/         # Route-level components (lazy loaded)
 │    ├── client/   # Storefront pages
 │    └── admin/    # Dashboard pages
 ├── components/    # Shared UI components
 ├── context/       # Global state (Auth, Cart, Wishlist, Compare, Theme)
 ├── hooks/         # Data-fetching hooks that wrap services
 ├── services/      # Supabase query functions — the only layer that touches the DB
 ├── utils/         # Pure helpers (categoryConfig, etc.)
 └── data/          # Static content (editorial articles)
```

**Data flow:**
```
Page Component
  → Custom Hook (useCart, useProducts…)
    → Service Function (fetchCartItems, fetchProducts…)
      → Supabase Client
        → PostgreSQL (with RLS enforced at DB level)
```

This separation means the database query logic lives in one place (`/services`), hooks handle loading state and side effects, and pages stay declarative.

### Backend (Supabase)

- **Authentication** — Supabase Auth with JWT. A `handle_new_user` trigger automatically creates a `profiles` row on signup.
- **Row Level Security** — every table has RLS enabled. Users can only read/write their own rows. Admin writes are gated behind an `is_admin()` function that checks `profiles.role = 'admin'`.
- **Storage** — product images upload to a `product-images` bucket. Public read, admin-only write enforced via storage RLS policies.

---

## Design System

All design tokens are defined in two places and kept in sync: `tailwind.config.js` and `src/index.css`.

### Palette

The palette deliberately avoids pure black (`#000`) and pure white (`#fff`). Every tone is slightly warm.

| Token | Light mode | Dark mode | Usage |
|---|---|---|---|
| `ivory` | `#F7F5F0` | `#0F0E0C` | Page background |
| `parchment` | `#EFECE5` | `#1A1916` | Card backgrounds |
| `silk` | `#E5E1D8` | `#2A2823` | Borders |
| `charcoal` | `#1A1916` | `#F0EDE6` | Primary text |
| `warmgray` | `#8A877F` | `#7A776F` | Secondary text, labels |
| `obsidian` | `#0D0C0A` | `#FDFCF9` | Primary CTAs |
| `cream` | `#FDFCF9` | `#0D0C0A` | Text on dark surfaces |

### Dark Mode

Dark mode is toggled via a `data-theme="dark"` attribute on `<html>`. All CSS variables re-map automatically — no component needs a `dark:` class. The toggle is persisted to `localStorage` via `ThemeContext`.

### Typography

- **Display / Headings** — Cormorant Garamond (300, 400, 600) — serif with high contrast strokes
- **Body / UI** — DM Sans (300, 400, 500) — geometric grotesque with optical sizing
- **Labels** — tracked out uppercase via `tracking-luxury: 0.18em` — a custom Tailwind token

### Geometry

All borders and radii are `rounded-none`. The design language is strictly rectilinear — no pill buttons, no card rounding.

---

## Features

### Storefront (Client)

| Feature | Implementation notes |
|---|---|
| Full-screen editorial hero | Framer Motion `AnimatePresence` image crossfade, per-letter entrance animation on headline |
| Category strip | Live product counts fetched from Supabase, CSS `overflow-x` scroll with hidden scrollbar |
| Product grid | Filtered by category, price, search, sort — all via Supabase query composition |
| Infinite pagination | Offset-based `loadMore` with deduplication via `Set` of existing IDs |
| Product detail | Accordion specs, size/colour/volume selectors driven by `categoryConfig.js` per product type |
| Optimistic cart updates | UI reflects changes immediately; Supabase write happens async; reload reconciles |
| Wishlist | Same optimistic pattern as cart; heart icon toggles instantly |
| Compare table | Up to 4 products side-by-side; persisted to `localStorage` via `CompareContext` |
| Recently viewed | Logged on product detail mount via Supabase `upsert`; capped at 20 per user with auto-pruning |
| Personalised recommendations | Fetches products from the same categories as recently viewed items, excluding already-seen |
| Review system | Star rating breakdown, per-user review submission, profiles joined for display name |
| Order history | Full order list with status badges; expandable detail view with line items |
| Checkout | React Hook Form + Yup schema, simulated payment flow, order + order_items inserted transactionally |
| Editorial journal | Static articles in `data/editorial.js`, slug-based routing, related articles section |
| Dark mode | System-agnostic toggle, `localStorage` persistence, zero flicker on load |
| Responsive nav | Full-screen mobile overlay with `translate-y` transition; desktop transparent-on-scroll |

### Admin Dashboard

| Feature | Implementation notes |
|---|---|
| Stats overview | 4 parallel Supabase queries aggregated in `fetchDashboardStats` |
| Product CRUD | Create/edit form with Supabase Storage image upload; delete with confirmation guard |
| Image upload | File → Supabase Storage bucket → public URL stored in product row |
| Order management | Status filter tabs, inline status select with optimistic table update |
| Customer list | Profiles with role=user, order count joined |
| Category management | Auto-slug generation from name input, create/delete with table reflection |
| Breadcrumb nav | Derived from `useLocation().pathname` — no manual config |
| Role-based access | `RequireAdmin` wrapper checks `isAdmin` from `AuthContext`; DB-level RLS is the actual enforcement |

---

## Database Schema

```sql
profiles          -- extends auth.users (id, full_name, avatar_url, role)
products          -- (id, title, description, price, category, image_url, rating, rating_count, is_featured)
categories        -- (id, name, slug, image_url)
cart_items        -- (id, user_id, product_id, quantity) UNIQUE(user_id, product_id)
wishlist_items    -- (id, user_id, product_id) UNIQUE(user_id, product_id)
orders            -- (id, user_id, status, subtotal, tax, total)
order_items       -- (id, order_id, product_id, quantity, price_at_purchase)
reviews           -- (id, product_id, user_id, rating 1-5, comment)
recently_viewed   -- (id, user_id, product_id, viewed_at) UNIQUE(user_id, product_id)
```

All tables have RLS enabled. The `is_admin()` function gates all admin write operations at the database level — frontend guards are a UX convenience, not a security mechanism.

---

## Project Structure

```
vela/
 ├── db/
 │    └── seeds/
 │         ├── seed.js                        # Script to fetch DummyJSON products
 │         ├── seed_products.sql              # Generated seed output
 │         ├── supabase_seed_luxury.sql       # First luxury catalog (8 products)
 │         └── supabase_seed_luxury_expanded.sql  # Full catalog (40+ products)
 ├── public/
 │    ├── favicon.svg
 │    └── icons.svg
 ├── src/
 │    ├── assets/
 │    ├── components/
 │    │    ├── admin/        # ProductForm, Primitives (StatCard, DataTable, etc.)
 │    │    ├── Filters/      # Sidebar category/sort/size/colour filters
 │    │    ├── Footer/
 │    │    ├── home/         # Hero, CategoryStrip, EditorialTeaser, etc.
 │    │    ├── layout/       # AppLayout, AdminLayout, ErrorBoundary
 │    │    ├── Navbar/
 │    │    ├── ProductCard/
 │    │    ├── ProductGrid/
 │    │    └── ReviewSection/
 │    ├── context/
 │    │    ├── AuthContext.jsx
 │    │    ├── CartContext.jsx
 │    │    ├── CompareContext.jsx
 │    │    ├── ThemeContext.jsx
 │    │    └── WishlistContext.jsx
 │    ├── data/
 │    │    └── editorial.js   # Static article content
 │    ├── hooks/
 │    │    ├── useAdminOrders.js
 │    │    ├── useAdminProducts.js
 │    │    ├── useAdminStats.js
 │    │    ├── useCart.js
 │    │    ├── useDebounce.js
 │    │    ├── useFilter.js
 │    │    ├── useOrders.js
 │    │    ├── useProducts.js
 │    │    ├── useRecentlyViewed.js
 │    │    ├── useReviews.js
 │    │    └── useWishlist.js
 │    ├── lib/
 │    │    └── supabaseClient.js   # Singleton client, null-safe export
 │    ├── pages/
 │    │    ├── admin/   # Dashboard, ProductsAdmin, OrdersAdmin, CustomersAdmin, CategoriesAdmin
 │    │    └── client/  # Home, Products, ProductDetail, Cart, Checkout, Wishlist,
 │    │                 # Compare, Orders, OrderDetail, Login, Register, About,
 │    │                 # Editorial, EditorialArticle
 │    ├── routes/
 │    │    ├── ProtectedRoute.jsx
 │    │    ├── RequireAdmin.jsx
 │    │    └── routes.jsx
 │    ├── services/
 │    │    ├── admin.js
 │    │    ├── cart.js
 │    │    ├── orders.js
 │    │    ├── products.js
 │    │    ├── recentlyViewed.js
 │    │    ├── reviews.js
 │    │    └── wishlist.js
 │    ├── utils/
 │    │    └── categoryConfig.js   # Per-category size/colour/volume config
 │    ├── App.jsx
 │    ├── index.css
 │    └── main.jsx
 ├── supabase/
 │    ├── rls.sql        # is_admin() function + all RLS policies
 │    └── storage.sql    # product-images bucket policies
 ├── supabase_schema.sql  # Full schema + triggers + basic policies
 ├── tailwind.config.js
 ├── vite.config.js
 ├── postcss.config.js
 └── eslint.config.js
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- A [Supabase](https://supabase.com) project (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/riya17171/Vela.git
cd VELA

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Fill in your Supabase credentials (see Environment Variables below)

# Start the development server
npm run dev
```

Navigate to `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are found in your Supabase project under **Settings → API**.

> The app is designed to degrade gracefully when Supabase is not configured — `supabaseClient.js` exports `null` and all service functions check for it before executing. The storefront UI renders but data operations silently no-op.

---

## Database Setup

Run the following SQL files in your Supabase SQL Editor **in this exact order**:

```
1. supabase_schema.sql              -- Creates all tables, triggers, and basic RLS policies
2. supabase/rls.sql                 -- Adds is_admin() function and fine-grained admin policies
3. supabase/storage.sql             -- Configures the product-images storage bucket
4. db/seeds/supabase_seed_luxury_expanded.sql  -- Populates the full product catalog
```

### Creating an Admin Account

1. Register a new account through the storefront (`/register`)
2. In your Supabase dashboard, go to **Table Editor → profiles**
3. Find the row for your new user and set `role` to `'admin'`
4. Log out and back in — you'll be redirected to `/admin` on login

---

## Key Technical Decisions

### Why Supabase over a custom Express/Node backend?

Supabase gives PostgreSQL with Row Level Security enforced at the database layer, not the application layer. This means even if someone bypasses the frontend guards entirely and hits the Supabase REST API directly with a stolen anon key, they cannot read or write data they're not authorised for. A custom backend would require building and maintaining that access control separately.

### Why Context API over Redux or Zustand?

The app has three pieces of genuinely global state: authentication status, cart, and wishlist. Redux would add significant boilerplate for data that rarely changes shape. Context API with `useMemo` on the value object is sufficient and keeps the dependency tree lighter. The trade-off is tree-wide re-renders on cart mutations — acceptable at this scale.

### Why React Router v7 over Next.js?

This is a single-page application with no SEO requirement (it's a college project, not a production store). Next.js server components and file-based routing would add complexity without benefit. React Router v7 with `React.lazy` and `Suspense` gives route-level code splitting that achieves the same bundle characteristics without the Next.js mental model overhead.

### Why Framer Motion over CSS animations?

The hero letter-stagger, image crossfade, and scroll-triggered reveals require precise timing coordination between multiple elements. Framer Motion's `variants` and `staggerChildren` make this declarative. The alternative — coordinating multiple `@keyframes` with `animation-delay` — would be brittle and harder to read.

### Why no TypeScript?

This was a deliberate scoping decision for the project timeline. TypeScript would catch the class of bug where a component uses an undeclared import or passes the wrong shape to a service function. It's the first thing that should be added in a production version.

---

## Known Limitations

- **No real payment processing** — the checkout form simulates a transaction. Card details are held only in React state and never transmitted anywhere. Replace with Stripe Elements before any real deployment.
- **Offset pagination** — the `loadMore` implementation uses offset-based pagination. In a live catalogue with frequent inserts, this can produce duplicate or missing results. Cursor-based pagination is the correct fix.
- **No image optimisation** — product images are loaded at full resolution from Unsplash. A production version should use `srcSet`, `loading="lazy"`, and serve WebP via an image CDN.
- **Static editorial content** — articles live in `src/data/editorial.js`. A real implementation would store them in a CMS or a Supabase `articles` table with a rich text field.
- **No test coverage** — there are no unit, integration, or end-to-end tests. Vitest + React Testing Library for unit tests, and Playwright for e2e flows are the recommended additions.
