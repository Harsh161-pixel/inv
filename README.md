# CoreInventory – Inventory Management System

A full-stack **Inventory Management System (IMS)** with authentication, dashboard KPIs, products, receipts, deliveries, internal transfers, stock adjustments, and a full audit trail (stock ledger).

## Features

- **Auth**: Sign up, login, forgot password (OTP), reset password
- **Dashboard**: KPIs (total products, low stock, out of stock, pending receipts/deliveries/transfers), filters by document type, status, warehouse, category
- **Products**: CRUD, SKU, category, unit of measure, reorder threshold, stock per warehouse
- **Operations**:
  - **Receipts** – Incoming goods → stock increases
  - **Delivery orders** – Outgoing goods → stock decreases
  - **Internal transfers** – Move between locations (no total change)
  - **Stock adjustments** – Set actual count and log reason
- **Move history** – Full stock ledger (who, when, +/-)
- **Low-stock alerts** – API at `/api/alerts/low-stock`
- **Settings** – Warehouses and product categories

## Tech stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **Prisma** + **SQLite**
- **JWT** (cookie) + **bcrypt** for auth; OTP stored in DB (wire email/SMS in production)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` or ensure `.env` has:

   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret"
   ```

3. **Database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, then go to **Dashboard → Settings** to add at least one **Warehouse** and one **Product category**. After that you can create products and use Receipts/Deliveries/Transfers/Adjustments.

## Quick flow (e.g. Steel Rods)

1. **Receive** 100 kg from vendor (Receipt → To warehouse: Main Store) → Validate → stock +100.
2. **Internal transfer** Main Store → Production Rack → total unchanged, location updated.
3. **Delivery** 20 kg to customer → Validate → stock −20.
4. **Adjustment** at Main Store: set actual count (e.g. −3 kg damaged) → Validate → stock updated and logged.

All moves appear under **Move History**.

## Scripts

- `npm run dev` – development server
- `npm run build` / `npm run start` – production
- `npm run db:push` – push Prisma schema to DB
- `npm run db:studio` – open Prisma Studio

## UI mockup

The problem statement references a UI mockup:  
https://link.excalidraw.com/l/65VNwvy7c4X/3ENvQFu9o8R  
Use it as a visual reference for screens and flow.
