# J&E Capital

Personal finance dashboard for Josh & Elana — net worth tracking, paycheck allocation, budget, plan to retirement.

## Features

- **Dashboard** — Net worth hero with trend chart, Cash/Investments/Retirement breakdown, budget summary, millionaire milestone tracker
- **Paycheck** — Enter a paycheck, set aside fixed expenses first, then manually allocate the rest across Roth IRAs, taxable brokerage, savings, or cash — with Roth contribution-room validation
- **Budget** — 10 categories, spent vs budgeted bars, tap-to-edit numbers, auto-resets monthly
- **Accounts** — 8 accounts grouped by Cash / Investments / Retirement with inline-editable balances
- **Plan** — Roth YTD progress, compound-growth projection chart and age table, inflation-adjusted figures
- **Settings** — Emergency fund target, Roth limit, VOO/QQQM/stocks split, return/inflation/age assumptions

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **Tailwind CSS v4**
- **Prisma 7** + PostgreSQL (Vercel Postgres in production, local Postgres in dev)
- **NextAuth v5** (credentials, JWT sessions)
- **Recharts** for charts
- **Vitest** for unit tests

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL (or use `DATABASE_URL` pointing to Vercel Postgres for local dev)

### 1. Install

```bash
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/je_capital"
AUTH_SECRET="generate-with: openssl rand -base64 32"
JOSH_PASSWORD="choose-a-strong-password"
ELANA_PASSWORD="choose-a-strong-password"
```

### 3. Set up database

```bash
# Push schema to DB (creates tables)
npm run db:push

# Seed Josh & Elana users + default accounts/budget
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in as:

- `josh@household.local` / your `JOSH_PASSWORD`
- `elana@household.local` / your `ELANA_PASSWORD`

### 5. Run unit tests

```bash
npm test
```

---

## Vercel Deployment

### 1. Create a Vercel Postgres database

In the Vercel dashboard: **Storage → Create Database → Postgres**. Copy the `DATABASE_URL` (connection pooling URL).

### 2. Set environment variables in Vercel

| Variable | Value |
|---|---|
| `DATABASE_URL` | Vercel Postgres connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `JOSH_PASSWORD` | Strong password for Josh |
| `ELANA_PASSWORD` | Strong password for Elana |

### 3. Deploy

```bash
# Install Vercel CLI if needed
npm i -g vercel

vercel deploy --prod
```

### 4. Run migrations + seed on Vercel

```bash
# Set DATABASE_URL locally to the Vercel Postgres URL, then:
npm run db:push
npm run db:seed
```

Or run from the Vercel dashboard under **Deployments → Functions → Run Command**.

---

## Database commands

```bash
npm run db:push       # Push schema changes (no migration files)
npm run db:migrate    # Create + run a named migration
npm run db:seed       # Seed default data
npm run db:studio     # Open Prisma Studio
```

---

## Adding Plaid later

The data layer is intentionally clean for this. To add Plaid:

1. Add `plaidAccountId` field to the `Account` model in `prisma/schema.prisma`
2. Create `src/app/api/plaid/` route handlers (Link token, token exchange, balance sync)
3. Replace the inline balance editing flow with Plaid Link for those accounts
4. Keep the manual editing flow for accounts not linked to Plaid

The `Account.bal` field is the source of truth — Plaid would just update it.
