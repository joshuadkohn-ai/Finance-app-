# MoneyMap 💰

A full-featured personal finance web app inspired by Monarch Money, YNAB, Copilot Money, and Quicken Simplifi.

## Features

- **Dashboard** — Net worth, cash flow charts, spending breakdown, upcoming bills, goal progress
- **Accounts** — Track checking, savings, credit cards, investments, retirement, real estate, crypto, and more
- **Transactions** — Full CRUD with search, filtering, bulk edit, categorization, and CSV export
- **Budget** — Flexible or zero-based monthly budget with category planning and actuals
- **Goals** — Savings, debt payoff, emergency fund, vacation, down payment, and more
- **Recurring Bills** — Detect and manage subscriptions with calendar view
- **Cash Flow** — 6-month income vs expense charts with projections
- **Investments** — Portfolio tracking with allocation charts and gain/loss
- **Debt** — Avalanche and snowball payoff calculators
- **Reports** — Spending by category, cash flow history, monthly comparison, CSV export
- **AI Assistant** — Natural language financial Q&A using your actual data
- **Household** — Invite a partner or advisor with role-based access (Owner/Editor/Viewer)
- **Settings** — Profile, notifications, CSV import, and security

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Prisma 7 ORM** with PostgreSQL
- **NextAuth v5** (credentials-based auth)
- **Recharts** for charts
- **Radix UI** primitives
- **Zod** validation + **React Hook Form**

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 2. Clone and install

```bash
git clone <your-repo>
cd Finance-app-
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/moneymap"
NEXTAUTH_SECRET="your-random-secret-min-32-chars"
AUTH_SECRET="your-random-secret-min-32-chars"

# Optional: AI Assistant (uses Claude Haiku)
ANTHROPIC_API_KEY=""

# Optional: Plaid (placeholder for future bank connection)
PLAID_CLIENT_ID=""
PLAID_SECRET=""
PLAID_ENV="sandbox"
```

### 4. Set up database

```bash
# Run migrations
npx prisma db push

# Seed with realistic demo data
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo account:** `demo@moneymap.app` / `password123`

---

## Database Commands

```bash
npm run db:push       # Push schema to database
npm run db:migrate    # Create a migration
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, signup pages
│   ├── (dashboard)/      # All protected app pages
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── budget/
│   │   ├── goals/
│   │   ├── recurring/
│   │   ├── cashflow/
│   │   ├── investments/
│   │   ├── debt/
│   │   ├── reports/
│   │   ├── ai/
│   │   ├── household/
│   │   └── settings/
│   └── api/              # REST API routes
├── components/
│   ├── ui/               # Reusable primitives (Button, Card, Dialog…)
│   └── shared/           # Sidebar, Header, StatCard, EmptyState…
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client singleton
│   ├── utils.ts          # Shared utilities + formatters
│   └── constants.ts      # Category data, nav items, labels
├── hooks/
│   └── use-toast.ts      # Toast notification hook
└── types/
    └── index.ts          # Shared TypeScript types
```

## Plaid Integration (Future)

The codebase is designed for Plaid integration. Look for `// placeholder for Plaid` comments in:
- `src/app/api/accounts/route.ts` — `plaidAccountId` field
- `src/app/api/transactions/route.ts` — `plaidTransactionId` field
- `prisma/schema.prisma` — `FinancialAccount.plaidAccountId`

To add Plaid:
1. Install `plaid` SDK
2. Create `src/app/api/plaid/` routes (link token, exchange, sync)
3. Replace manual account creation flow with Plaid Link widget

## AI Assistant

The AI assistant at `/ai` uses:
- **With `ANTHROPIC_API_KEY`**: Claude Haiku for real AI responses
- **Without key**: Mock responses showing financial data snippets

The assistant receives a minimal context window (accounts, recent transactions, goals, budget) to keep API costs low.

## Security Notes

- Passwords hashed with bcrypt (cost factor 12)
- Sessions managed by NextAuth JWT strategy
- Bank credentials are never stored — use Plaid for real integrations
- Role-based access: Owner > Editor > Viewer
- Audit log table available for tracking important changes
