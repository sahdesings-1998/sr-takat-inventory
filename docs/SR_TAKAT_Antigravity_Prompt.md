# SR TAKAT — Gem & Jewellery Management System
## Full-Stack Build Prompt (MERN) — for AI Coding Agent

This is the complete, consolidated build specification. Follow it exactly — do not introduce technologies, patterns, or folder structures outside what's defined here.

---

# 1. Tech Stack (STRICTLY MERN)

Do not introduce Next.js, TanStack Query/Table, Shadcn, or any non-MERN technology unless explicitly listed below.

## Frontend
React 19 · Vite · Tailwind CSS v4 · React Router v7 · Axios · React Hook Form · Zod · Framer Motion · Recharts · Lucide React · clsx · tailwind-merge

## Backend
Node.js · Express.js · MongoDB · Mongoose · JWT Authentication · bcrypt · Multer · Cloudinary · dotenv · cors · cookie-parser · express-validator

## Package Manager
**pnpm only.** Never npm, yarn, or bun. All commands: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`.

## State Management
React Query (server state) + Context API (auth/theme/notifications) + local state (modals, search, pagination UI). No Redux unless a real need for complex client state emerges later.

## Do NOT use
Next.js, Remix, Nuxt, Angular, Vue, Svelte, Laravel, Django, Spring Boot, NestJS, Bootstrap, Material UI, Chakra UI, Ant Design, jQuery, Redux Toolkit (unless explicitly requested).

---

# 2. Architecture Principles

- Feature-first (module-first), not file-type-first
- Reusable UI component system
- Separation of UI and business logic
- API-first design
- Lazy-loaded route modules
- Permission-aware routing and UI
- Consistent design system (spacing, typography, color tokens)
- MongoDB used as a **normalized document database with references** — never one giant nested document

---

# 3. Folder Structure

## Client (`client/`)
```
src/
├── app/
├── assets/
├── components/       # shared, reusable UI only
├── layouts/          # AuthLayout, DashboardLayout, BlankLayout
├── modules/           # feature-first — see Section 4
├── routes/            # publicRoutes.js, protectedRoutes.js, adminRoutes.js
├── services/
├── hooks/
├── contexts/
├── utils/
├── constants/
├── validation/
├── styles/
└── main.jsx
```

## Server (`server/`)
```
server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── validators/
├── uploads/
├── app.js
├── server.js
├── package.json
└── .env
```

---

# 4. Frontend Modules

```
modules/
  auth/
  dashboard/
  inventory/       (gemstones, lots, materials)
  products/
  production/       (job cards)
  costing/
  memo/
  sales/
  customers/
  suppliers/
  certificates/
  reports/
  settings/
  audit/
  notifications/
```

Each module owns: `pages/`, `components/`, `api/`, `hooks/`, `validation/`, `types/`, `utils/`, `constants/`, `routes.jsx`. Nothing outside a module knows how that module works internally.

**Example — Sales module:**
```
sales/
  pages/         CreateSale.jsx, SaleList.jsx, SaleDetails.jsx
  components/    SaleTable.jsx, InvoiceCard.jsx, DiscountModal.jsx
  api/           salesApi.js
  hooks/         useSales.js
  validation/    saleSchema.js
  utils/         calculateProfit.js
```

## Shared Components (never duplicate UI)
Button, Input, Select, Textarea, Checkbox, Radio, Modal, Drawer, Alert, Toast, Loader, Spinner, Badge, Avatar, Card, DataTable, Pagination, SearchBar, FilterPanel, Breadcrumb, ConfirmDialog, EmptyState, ErrorState, QRScanner, ImageUploader, FileUploader

## Route Protection (3 levels)
`Public → Authenticated → Role Protected` (e.g. `/login` public, `/dashboard` authenticated, `/settings` admin-only)

## Page Pattern (every page follows this)
`Page Header → Breadcrumb → Action Buttons → Filters → Data Table → Pagination`

## Permission-Based UI
- **Workshop/Staff**: hide Delete, Approve Cost, Settings
- **Manager**: show Approve, Memo, Sales
- **Admin**: everything

## Error/Loading Pattern (every page)
`Loading → Success → Empty State → Error State` — never a blank page.

---

# 5. MongoDB Database Design

**Database:** `sr_takat_db` — normalized with references, not embedded blobs.

## Collections (18 total — 15 original + 3 recommended additions)

**Auth:** `users`, `roles`, `permissions`, `refreshTokens`
**Masters:** `customers`, `suppliers`, `settings`, `currencies`
**Inventory:** `gemstones`, `gemstoneLots`, `materials`, `products`, `productComponents`, `certificates`
**Production:** `jobCards`
**Business:** `memos`, `sales`, `saleItems`
**Tracking:** `inventoryMovements`, `auditLogs`
**System:** `notifications`

## Key Schemas

```javascript
// users
{ _id, fullName, email, password, roleId, phone, status, lastLogin, createdAt, updatedAt }
// indexes: email(unique), roleId, status

// roles
{ _id, name, permissions: ["inventory.view","inventory.create","sales.create","memo.release", ...] }

// gemstones
{ _id, stoneId, stockNo, gemstone, variety, origin, shape, carat, pieces, color, clarity,
  treatment, purchasePrice, costPerCarat, supplierId, certificateId, location, status,
  notes, images: [], createdBy }
// indexes: stoneId(unique), stockNo, status, supplierId, location, gemstone, origin

// gemstoneLots
{ _id, lotId, gemstone, totalCarat, remainingCarat, estimatedPieces, purchaseCost,
  supplierId, location, status }
// remainingCarat is stored, never recalculated on the fly

// materials
{ _id, materialCode, category, materialName, unit, quantity, cost, location, status }

// products  (NO gemstones embedded)
{ _id, productCode, stockNo, category, name, description, sellingPrice, costPrice,
  grossProfit, charityAmount, netProfit, qrCode, barcode, status,
  certificateIds: [], imageUrls: [] }
// indexes: productCode, stockNo, status, category

// productComponents  (traceability layer)
{ _id, productId, sourceType, sourceId, quantity, weight, remarks }

// jobCards
{ _id, jobNo, productId, assignedTo, status, startDate, expectedDate, completedDate,
  productionStages: [], materialsIssued: [], materialsReturned: [] }

// certificates
{ _id, certificateNo, lab, issueDate, reportType, fileUrl, entityType, entityId }

// inventoryMovements  (never overwrite location — always insert)
{ _id, inventoryType, inventoryId, action, fromLocation, toLocation, quantity, weight,
  referenceType, referenceId, userId, remarks, movementDate }

// memos
{ _id, memoNo, customerId, issueDate, expectedReturn, actualReturn, status, items: [], remarks }

// sales
{ _id, invoiceNo, customerId, subtotal, discount, tax, total, paymentStatus,
  charityPercentage, charityAmount, grossProfit, netProfit }

// saleItems
{ _id, saleId, inventoryType, inventoryId, quantity, sellingPrice, discount }

// auditLogs  (never delete)
{ _id, userId, entity, entityId, action, oldValue, newValue, ipAddress, timestamp }

// settings
{ charityPercentage, currency, prefixes, certificateLabs, exchangeRate, companyInfo }
```

## Indexes
- **Unique:** email, stoneId, lotId, productCode, invoiceNo, memoNo, jobNo
- **Search:** status, supplierId, customerId, productId, category, location, createdAt
- **Compound:** products(status+category), gemstones(status+location), inventoryMovements(inventoryId+movementDate), sales(customerId+createdAt), memos(status+expectedReturn)

---

# 6. REST API Endpoints

RESTful, controller → service → Mongoose model. Controllers only handle request/response; business logic lives in services. All routes below are prefixed `/api/v1`.

## Auth
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh-token
GET    /auth/me
POST   /auth/forgot-password
POST   /auth/reset-password
```

## Users & Roles (Admin only)
```
GET    /users            POST   /users
GET    /users/:id        PUT    /users/:id       DELETE /users/:id
GET    /roles            POST   /roles
PUT    /roles/:id        DELETE /roles/:id
```

## Suppliers / Customers
```
GET    /suppliers        POST   /suppliers
GET    /suppliers/:id    PUT    /suppliers/:id   DELETE /suppliers/:id
GET    /customers        POST   /customers
GET    /customers/:id    PUT    /customers/:id   DELETE /customers/:id
GET    /customers/:id/history      # purchase + memo history, outstanding, total business
```

## Gemstones
```
GET    /gemstones                  ?status=&location=&supplierId=&gemstone=
POST   /gemstones
GET    /gemstones/:id
PUT    /gemstones/:id
DELETE /gemstones/:id
PATCH  /gemstones/:id/status       # In Stock / Reserved / In Production / On Memo / Sold / Damaged / Missing
```

## Gemstone Lots
```
GET    /lots
POST   /lots
GET    /lots/:id
PUT    /lots/:id
PATCH  /lots/:id/issue             # body: { carat }  → reduces remainingCarat only
```

## Materials
```
GET    /materials         POST   /materials
GET    /materials/:id     PUT    /materials/:id
PATCH  /materials/:id/adjust       # +/- quantity, with movement log entry
```

## Products & Components
```
GET    /products                   ?category=&status=
POST   /products
GET    /products/:id               # includes populated productComponents
PUT    /products/:id
DELETE /products/:id
POST   /products/:id/components
DELETE /products/:id/components/:componentId
```

## Production / Job Cards
```
GET    /job-cards                  ?status=&assignedTo=
POST   /job-cards
GET    /job-cards/:id
PUT    /job-cards/:id
PATCH  /job-cards/:id/status       # stage transition
POST   /job-cards/:id/materials-issued
POST   /job-cards/:id/materials-returned   # body includes wastageType
```

## Costing
```
GET    /costing/:productId
POST   /costing/:productId         # creates/updates costing snapshot; snapshots charityPercentage
POST   /costing/:productId/approve # Manager/Admin only
```

## Memo
```
GET    /memos                      ?status=&customerId=&overdue=true
POST   /memos
GET    /memos/:id
PATCH  /memos/:id/return
PATCH  /memos/:id/extend
PATCH  /memos/:id/convert-to-sale
```

## Sales
```
GET    /sales                      ?customerId=&paymentStatus=
POST   /sales
GET    /sales/:id
PATCH  /sales/:id/payment-status
GET    /sales/:id/invoice          # generate/download invoice
```

## Certificates
```
GET    /certificates               ?entityType=&entityId=
POST   /certificates                # multipart upload → Cloudinary
GET    /certificates/:id
DELETE /certificates/:id
```

## Inventory Movements (read-only, system-generated)
```
GET    /movements                  ?inventoryType=&inventoryId=&from=&to=
```

## Reports
```
GET    /reports/inventory-valuation
GET    /reports/gemstone-stock
GET    /reports/jewellery-stock
GET    /reports/memo
GET    /reports/sales
GET    /reports/profit
GET    /reports/charity
GET    /reports/product-cost
GET    /reports/stock-movement
GET    /reports/supplier-purchase
```

## Settings (Admin only)
```
GET    /settings
PUT    /settings
```

## Audit Log (read-only)
```
GET    /audit-logs                 ?userId=&entity=&from=&to=
```

## Notifications
```
GET    /notifications
PATCH  /notifications/:id/read
```

---

# 7. Cross-Cutting Business Rules (must be enforced server-side)

- **Lot reduction:** deduct by `carat` only; `estimatedPieces` is informational, never used in stock math.
- **Costing calculation order (fixed, no circular refs):** Material Cost → Production Cost → Other Cost → Total Cost → Selling Price → Gross Profit → Charity → Net Profit. Any "% of Selling Price" line applies as a post-selling-price adjustment only.
- **Charity %:** read from `settings` at transaction time and snapshotted onto the `sales`/`costing` record — changing settings later never rewrites history.
- **Memo overdue:** computed server-side (cron or on-read) when `now > expectedReturn` and `status = "With Client"`.
- **Inventory location:** never overwritten — every change inserts a new `inventoryMovements` document.
- **Material wastage:** every `materialsReturned` entry requires a `wastageType`: `returnedToStock | scrapRecovery | writeOff`.
- **Audit log:** every create/update/delete on inventory, costing, memo, and sales writes an `auditLogs` entry. Logs are never deleted.
- **Certificates/images:** stored in Cloudinary; MongoDB stores only the URL/reference.
- **Multi-currency:** every financial transaction stores `baseCurrency`, `originalCurrency`, and `exchangeRateAtTime`.
- **Permissions:** enforced both in Express middleware (`middleware/permissions.js`) and hidden in the UI — never rely on frontend hiding alone.

---

# 8. Design System

**Brand colors:** `#0A4958` (primary/dark teal), `#CB9B42` (accent/gold)

- Typography: Heading 1/2/3, Body, Caption
- Spacing scale: 4, 8, 12, 16, 24, 32, 48
- Color tokens: Primary, Secondary, Danger, Warning, Success, Info
- One `Button` component with variants: primary, secondary, outline, ghost, danger
- Consistent hover states, focus rings, border radii, icon sizes, transitions across the app

---

# 9. UI Reference — Dashboard Layout

A reference dashboard (SaaS analytics style — light background, rounded cards, sidebar nav, KPI cards with trend badges, donut + bar charts) was supplied as visual inspiration only. **Do not copy its brand colors or literal content** — recreate the *layout patterns* using SR TAKAT's own brand colors (`#0A4958` primary teal, `#CB9B42` gold accent) and business data.

## Layout pattern to replicate

```
┌───────────┬──────────────────────────────────────────────┐
│  Sidebar  │  Topbar: page title + date | search, notif,  │
│           │          user avatar/profile                  │
│  Logo     ├──────────────────────────────────────────────┤
│           │  KPI Card Row (2x2 or 4-across)                │
│  MENU     │   ┌────────────┐ ┌────────────┐               │
│  Dashboard│   │ Icon  +2.0%│ │ Icon +12.4%│  ...           │
│  Reports  │   │ Big Number │ │ Big Number │               │
│  Products │   │ Label      │ │ Label      │               │
│  Customers│   └────────────┘ └────────────┘               │
│           ├──────────────────────────────────────────────┤
│  FINANCIAL│  Chart Row                                     │
│  Trans.   │   ┌──────────────────────┐ ┌─────────────────┐ │
│  Invoices │   │ Bar/Line chart        │ │ Donut/radial    │ │
│           │   │ (trend over time)     │ │ chart (mix)     │ │
│  TOOLS    │   └──────────────────────┘ └─────────────────┘ │
│  Settings │  Secondary Row                                 │
│  Help     │   ┌──────────────────────┐ ┌─────────────────┐ │
│           │   │ List w/ mini stats    │ │ List w/ flags/  │ │
│  [Upgrade │   │ (e.g. top categories) │ │ avatars + bars  │ │
│   promo   │   └──────────────────────┘ └─────────────────┘ │
│   card]   │                                                │
└───────────┴──────────────────────────────────────────────┘
```

## Mapped to SR TAKAT's Dashboard module (Section 3.1 of the PRD)

- **KPI card row** → Total Gemstones, Jewellery Stock, Watch Stock, Inventory Cost, Selling Value, On Memo (split On Time/Overdue), Gross Profit, Charity Allocation, Net Profit — each card: icon, small trend/status badge (e.g. green "In Stock" vs red "Overdue"), big number, label.
- **Bar/line chart** → Sales trend over time (monthly), or Inventory Valuation trend.
- **Donut/radial chart** → Stock mix by category (Gemstones / Jewellery / Watches) or Sales mix by product category, styled like the reference's multi-ring "Product Statistic" chart.
- **List with mini stats** → "Recent Stock", "Products On Memo", "Pending Production" — row-based list, label + numeric value + colored delta badge, same visual weight as the reference's Electronic/Games/Furniture rows.
- **List with flags/avatars** → Not directly applicable to SR TAKAT (no per-country customer growth need), but the same component (avatar/icon + concentric bubble or bar + label) can be reused for "Top Suppliers by Purchase Value" or "Top Clients by Business" if useful.
- **Sidebar sections** → mirror this reference's grouped-menu pattern: group `Dashboard` alone, then `Inventory / Production / Costing / Memo / Sales` under one group, `Certificates / Reports` under another, `Settings / Audit Log / Help` under a Tools group.
- **Topbar** → page title + current date/time, search, notifications bell (memo overdue / certificate missing alerts), user avatar with role label (e.g. "Admin" / "Manager").

## Component takeaways for the shared `Card`, `DataTable`, and chart components

- KPI cards: rounded-2xl, soft shadow, colored icon chip top-left, trend badge (pill, colored bg) top-right, large bold number, small muted label — implement as a `StatCard` variant of the shared `Card` component.
- Use Recharts for both the bar/line trend chart and the multi-ring radial/donut chart (`RadialBarChart` for the concentric-ring style shown).
- Keep the reference's generous whitespace and card-based grouping — avoid dense/legacy-ERP-style tables on the Dashboard itself; save dense `DataTable` usage for the Inventory/Sales/Memo list pages (per Section 4's page pattern).

---

# 10. Non-Goals (Out of Scope for V1)

Full accounting/GL, HR/payroll, CRM marketing automation, AI chatbot, RFID (QR/barcode only), Redux (unless proven need).

---

# 11. Build Order (suggested milestone sequence)

```
Auth → Dashboard (shell) → Inventory (gemstones, lots, materials)
   → Products & Components → Production (job cards)
   → Costing → Memo → Sales → Reports → Settings/Audit
```
This mirrors both the module dependency graph and the business flow: Purchase → Inventory → Product Creation → Costing → Approval → Sales/Memo → Profit & Charity → Reports.
