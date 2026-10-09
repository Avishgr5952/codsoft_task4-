# MarketHub – Multi-Vendor E-Commerce Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-14%20App%20Router-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

**MarketHub** is a production-ready, full-stack, scalable multi-vendor e-commerce marketplace built for modern web performance and enterprise reliability. It connects customers, independent merchant stores, courier delivery partners, and platform administrators within an integrated, real-time ecosystem.

---

## 🌟 Key Highlights & Engineering Features

- **Real Full-Stack Architecture**: Zero mock-only fallbacks. Every product card, filter, shopping cart, checkout calculation, inventory update, vendor commission, and delivery state transitions through a NestJS REST API connected to PostgreSQL via Prisma ORM.
- **Multi-Vendor Order Partitioning**: A customer's single order containing items from multiple distinct merchants is atomically partitioned into individual `VendorOrder` records with automated commission splitting (e.g. 10% platform commission, 90% merchant net payout).
- **Atomic Stock Management**: Checkout transactions atomically decrement available inventory using Prisma ACID transactions and prevent overselling past available units.
- **Role-Based Access Control (RBAC)**: Strict JWT authentication with bcrypt hashing and NestJS guard decorators protecting `CUSTOMER`, `VENDOR`, `DELIVERY_PARTNER`, and `ADMIN` endpoints.
- **Responsive Modern UI**: Built with Next.js 14 App Router, React 18, Tailwind CSS, Lucide icons, interactive charts, and instant demo role switchers.
- **Resilient Caching**: Redis integration with automated in-memory cache fallbacks for instant local development without mandatory external Redis instances.

---

## 👥 Demo Accounts & Pre-Seeded Roles

For instant presentation and evaluation, use the one-click **"Demo Role Switcher"** inside the top navigation bar or log in with these pre-seeded credentials:

| Role | Email | Password | Primary Dashboard |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@markethub.com` | `Password@123` | `/admin/dashboard` |
| **Tech Store Vendor** | `vendor@markethub.com` | `Password@123` | `/vendor/dashboard` |
| **Fashion Store Vendor** | `fashion@markethub.com` | `Password@123` | `/vendor/dashboard` |
| **Home Decor Vendor** | `homedecor@markethub.com` | `Password@123` | `/vendor/dashboard` |
| **Courier / Delivery** | `delivery@markethub.com` | `Password@123` | `/delivery/dashboard` |
| **Customer Shopper** | `customer@markethub.com` | `Password@123` | `/` (Storefront) |

---

## 🏗️ Architecture & Technology Stack

### Frontend (`/frontend`)
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS, CSS variables, `clsx`, `tailwind-merge`
- **State & Contexts**:
  - `AuthContext`: JWT persistence, role detection, 1-click role switcher
  - `CartContext`: Local & API cart synchronization, vendor grouping
  - `WishlistContext`: Customer saved items
  - `CompareContext`: Cross-vendor specification comparison matrix
- **HTTP Client**: Axios with interceptors for Bearer token injection and global error handling
- **Component Libraries**: Lucide Icons, headless UI components

### Backend (`/backend`)
- **Framework**: NestJS (Modular architecture)
- **Language**: TypeScript with strict typings
- **ORM**: Prisma ORM with PostgreSQL client
- **Authentication**: Passport-JWT, Bcrypt password encryption, custom decorators (`@CurrentUser()`, `@Roles()`, `@Public()`)
- **Validation**: Class-Validator and Class-Transformer DTO validation pipes
- **File Storage**: Local uploads controller + AWS S3 compatibility layer
- **Caching**: Redis client with graceful fallback

### Database (`PostgreSQL`)
- PostgreSQL database engine configured on port **5433** (to prevent port 5432 collision).
- Pre-packaged with embedded binary runner for instant zero-dependency execution.

---

## 📂 Project Directory Structure

```text
e commerce  market place/
├── docker-compose.yml              # Container definitions (Postgres & Redis)
├── .env.example                    # Global environment template
├── README.md                       # Comprehensive system documentation
│
├── backend/                        # NestJS API Application
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma Database Schema (17 models)
│   │   └── seed.ts                 # Database seeder (Roles, Stores, Products, Orders)
│   ├── scripts/
│   │   └── run-embedded-pg.js      # Zero-dependency embedded PostgreSQL runner (Port 5433)
│   ├── src/
│   │   ├── admin/                  # Admin KPIs, settings, oversight
│   │   ├── auth/                   # JWT auth, register, login, me
│   │   ├── categories/             # Department taxonomies CRUD
│   │   ├── coupons/                # Discounts & percentage vouchers
│   │   ├── delivery/               # Delivery partner assignments & state machine
│   │   ├── inventory/              # Real-time SKU stock levels
│   │   ├── orders/                 # Multi-vendor grouped order processing
│   │   ├── payments/               # Payment gateway & mock payment records
│   │   ├── products/               # Marketplace catalog, search, filters
│   │   ├── reviews/                # Verified purchase ratings & reviews
│   │   ├── users/                  # User identity & RBAC role switcher
│   │   ├── vendors/                # Vendor store onboarding & revenue
│   │   └── main.ts                 # Application bootstrap (Port 4000)
│   └── package.json
│
└── frontend/                       # Next.js 14 App Router Application
    ├── app/
    │   ├── page.tsx                # Marketplace Homepage
    │   ├── shop/page.tsx           # Product catalog with multi-filters & search
    │   ├── products/[id]/page.tsx  # Product detail, image gallery, specs, buy box
    │   ├── categories/[category]/  # Category department catalog
    │   ├── compare/page.tsx        # Spec & price comparison matrix
    │   ├── cart/page.tsx           # Multi-vendor grouped cart with stock checks
    │   ├── checkout/page.tsx       # Address, voucher, vendor package review & mock pay
    │   ├── orders/page.tsx         # Customer order history
    │   ├── orders/[id]/page.tsx    # Live order status & package tracking stepper
    │   ├── profile/page.tsx        # User profile & account shortcuts
    │   ├── wishlist/page.tsx       # Saved items & quick move to cart
    │   ├── auth/                   # Login, register (Customer/Vendor), forgot password
    │   ├── vendor/                 # Vendor Portal
    │   │   ├── dashboard/          # Revenue analytics, KPI cards, top products
    │   │   ├── products/           # Catalog CRUD (add/edit modal, publish toggle)
    │   │   ├── inventory/          # Stock tracking, low-stock alerts, restock
    │   │   ├── orders/             # Order fulfillment, courier status updater
    │   │   ├── promotions/         # Coupon code manager
    │   │   └── settings/           # Store branding, contact info, logo
    │   ├── admin/                  # Platform Admin Portal
    │   │   ├── dashboard/          # Platform GMV, commission metrics, 7-day trend
    │   │   ├── vendors/            # Vendor approvals, rejections, suspensions
    │   │   ├── categories/         # Department taxonomies manager
    │   │   ├── products/           # Platform catalog oversight & feature toggles
    │   │   ├── orders/             # Multi-vendor orders oversight & status override
    │   │   └── users/              # User identity & RBAC role switcher
    │   └── delivery/               # Courier Dispatch Portal
    │       └── dashboard/          # Assigned parcels, address routing, delivery stepper
    ├── components/                 # Navbar, Footer, ProductCard, UI components
    ├── context/                    # Auth, Cart, Wishlist, Compare contexts
    ├── lib/                        # Axios API client & utility helpers
    └── package.json
```

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **npm** or **yarn**

### 2. Database Setup (PostgreSQL on Port 5433)
The project comes equipped with an embedded PostgreSQL runner for Windows:
```bash
cd backend
node scripts/run-embedded-pg.js
```
*(Alternatively, use Docker: `docker compose up -d`)*

### 3. Database Migration and Seeding
Run Prisma migrations and populate demo products, categories, and test accounts:
```bash
cd backend
npx prisma db push
npx ts-node prisma/seed.ts
```

### 4. Running the Backend API
```bash
cd backend
npm run build
npm run start
# Server listens at http://localhost:4000/api
```

### 5. Running the Frontend
```bash
cd frontend
npm run build
npm run start
# Application runs at http://localhost:3000
```

---

## 🖥️ Feature Walkthrough

### 🛒 Customer Marketplace
- **Homepage (`/`)**: Hero promotion banner, top departments, featured items, flash deals, top rated vendors, recently added goods.
- **Catalog & Shop (`/shop`)**: Instant faceted search, category filtering, price range filter, vendor selection, rating filter, sort by newest/price/popularity, pagination.
- **Product Details (`/products/[id]`)**: Full image gallery, technical specification table, stock status badge, vendor profile badge, customer reviews & rating form.
- **Comparison Tool (`/compare`)**: Side-by-side specification matrix comparing price, stock, ratings, and features across multiple products.
- **Multi-Vendor Cart (`/cart`)**: Real shopping cart grouping items by merchant store. Enforces inventory limits.
- **Checkout & Payment (`/checkout`)**: Multi-step checkout with delivery address selection, coupon voucher validation, mock payment gateway, automated order creation, and cart clearance.
- **Order Tracking (`/orders/[id]`)**: Visual tracking stepper displaying order progress from `PENDING` → `PROCESSING` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`.

### 🏪 Vendor Management Portal (`/vendor/*`)
- **Dashboard (`/vendor/dashboard`)**: Net revenue, gross sales, platform commissions, 7-day sales trend chart, low-stock warnings, and top 5 best-selling products.
- **Catalog Management (`/vendor/products`)**: Add and edit products with SKU, prices, discount rates, category assignments, and draft/published visibility.
- **Inventory Control (`/vendor/inventory`)**: Real-time stock monitor with alert thresholds and 1-click inline restocking.
- **Order Fulfillment (`/vendor/orders`)**: Merchant-specific packages with tracking number assignment and fulfillment status toggles.
- **Coupons & Deals (`/vendor/promotions`)**: Create percentage or fixed discount coupon codes with minimum order amount requirements and expiration dates.
- **Store Settings (`/vendor/settings`)**: Customize store name, biography, contact email, logo, and cover banner.

### 🛡️ Platform Administration Portal (`/admin/*`)
- **Overview Dashboard (`/admin/dashboard`)**: Platform lifetime GMV, collected commission revenue, vendor payouts, total order counts, and 7-day revenue trend comparison.
- **Vendor Approvals (`/admin/vendors`)**: Review pending merchant applications, verify business credentials, approve, reject, or suspend accounts.
- **Department Taxonomies (`/admin/categories`)**: Create, edit, and organize marketplace department categories with live product counters.
- **Catalog Oversight (`/admin/products`)**: Audit products across all sellers, promote items to the featured storefront section, or remove infringing items.
- **Orders Supervision (`/admin/orders`)**: Global order records showing multi-vendor attributions, payment confirmations, and administrative status overrides.
- **Identity & RBAC (`/admin/users`)**: Search registered users, promote accounts between `CUSTOMER`, `VENDOR`, `DELIVERY_PARTNER`, and `ADMIN`, or freeze access.

### 🚚 Courier Dispatch Portal (`/delivery/*`)
- **Route Dashboard (`/delivery/dashboard`)**: Assigned consignments, package items list, customer delivery address, and recipient contact number.
- **Live Status Stepper**: Interactive progression through delivery milestones:
  - `ASSIGNED` ➔ `ACCEPTED` ➔ `PICKED_UP` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`
- **Delivery Proof Notes**: Submit delivery handover confirmation notes and timestamped proof.

---

## 📡 Core API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register customer or vendor account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session profile |
| `GET` | `/api/categories` | Public | Get active marketplace categories |
| `POST` | `/api/categories` | Admin | Create new category department |
| `GET` | `/api/products` | Public | Filtered & paginated marketplace catalog |
| `POST` | `/api/products` | Vendor / Admin | Create new product listing |
| `GET` | `/api/products/compare` | Public | Compare specifications for product IDs |
| `GET` | `/api/cart` | Authenticated | Get current user's multi-vendor shopping cart |
| `POST` | `/api/cart/items` | Authenticated | Add item to cart with stock validation |
| `POST` | `/api/coupons/validate`| Authenticated | Validate coupon discount code |
| `POST` | `/api/orders` | Customer | Create order, split vendor packages, reduce stock |
| `GET` | `/api/orders/vendor` | Vendor | Get vendor-specific assigned order packages |
| `PATCH`| `/api/orders/vendor/:id/status` | Vendor | Update vendor order fulfillment status |
| `GET` | `/api/admin/dashboard` | Admin | Aggregate platform metrics & 7-day GMV trends |
| `GET` | `/api/vendors` | Admin | List all registered vendors with status filter |
| `PATCH`| `/api/vendors/:id/status` | Admin | Approve, reject, or suspend vendor account |
| `GET` | `/api/delivery/dashboard` | Delivery / Admin| Get assigned delivery consignments |
| `PATCH`| `/api/delivery/deliveries/:id/status`| Delivery | Advance delivery route status |

---

## 🧪 Testing and Verification

- **Backend Unit Tests**:
  ```bash
  cd backend
  npm test
  # PASS src/coupons/coupons.service.spec.ts
  # PASS src/auth/auth.service.spec.ts
  # PASS src/products/products.service.spec.ts
  # Tests: 14 passed, 14 total
  ```
- **Frontend Production Build**:
  ```bash
  cd frontend
  npm run build
  # 27 App Router routes successfully compiled and statically generated
  ```

---

## 📄 License & Credits

Developed as a modern Multi-Vendor E-Commerce Marketplace prototype for demonstration and internship project presentation. Built with standard best practices in clean code, TypeScript typing, modular architecture, and role-based security.
