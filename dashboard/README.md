# Digital Empire Dashboard

A full-stack command center for managing a multi-store Shopify digital products empire across 12 niches and 50 Canadian cities. Includes market research, brand studio, financial tracking, CS management, and automated scheduling.

---

## App Flow

```
Login (select role)
      │
      ▼
Overview ──────────────────────────────────────────────────────────┐
  KPIs: revenue, orders, AOV, refunds                             │
  Alerts: flagged stores, suspended GMB, slow sales               │
  Store health chart                                              │
      │                                                           │
      ▼                                                           │
Niches / Cities                                                   │
  Revenue breakdown by niche or city                              │
  Drill into individual niche/city performance                    │
      │                                                           │
      ▼                                                           │
Stores                                                            │
  Table view of all 600 stores                                    │
  Filter by niche, city, status                                   │
  Bulk actions: pause, resume, flag, export                       │
  Store detail: checklist, notes, GMB/domain/Shopify status       │
      │                                                           │
      ├── Content → log blogs, GMB posts, products per store      │
      ├── CS      → create/resolve tickets (refund/shipping/etc.) │
      └── Financial → P&L, expenses, profit margins (Owner only)  │
                                                                  │
Research (Owner only)                                             │
  ├── Etsy Spy      → search products, scrape shops, bookmark     │
  ├── Trends        → keyword trends, longevity, compare          │
  ├── PLR Vault     → manage sources and purchased products       │
  ├── Scoreboard    → rank products by trend + demand score       │
  ├── Brain         → AI research assistant (Claude)              │
  ├── Marketing     → keyword volume, domain availability, GMB    │
  ├── Proxies       → proxy pool management and health testing    │
  └── Schedules     → automate recurring Etsy/Trends searches     │
                                                                  │
Brand Studio (Owner only)                                         │
  ├── Brands  → create brand profiles (niche, colors, products)   │
  ├── Banners → generate HTML/Liquid banners, like/dislike        │
  ├── Pages   → homepage and product page layouts                 │
  ├── Assets  → manage product images and rebranded versions      │
  └── Brain   → learns from feedback to improve generation        │
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3, Vite 6, Tailwind CSS 3.4 |
| Charts | Recharts 2.15 |
| Icons | Lucide React |
| Backend | Express.js 5.2, Node.js |
| Database | PostgreSQL via Neon (serverless) |
| Scraping | Cheerio, Google Trends API |
| Proxies | https-proxy-agent, socks-proxy-agent |
| Scheduling | node-cron |

---

## Getting Started (Local)

### 1. Install dependencies
```bash
npm install
```

### 2. Create your `.env` file
```bash
cp .env.example .env
```
Fill in your values:
```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
SEED_DATA=true
NODE_ENV=development
CLIENT_URL=http://localhost:5173
PORT=3001
```

### 3. Run the app
```bash
npm run dev
```

This starts both the frontend (port 5173) and backend (port 3001) together.

| URL | Purpose |
|---|---|
| `http://localhost:5173` | React frontend |
| `http://localhost:3001/api/health` | Backend health check |
| `http://localhost:3001/api/plr/sources` | Example API endpoint |

> On first run, `SEED_DATA=true` auto-creates the database table and seeds PLR sources and Golden Rules into Neon. Set it to `false` after the first run.

---

## Deploying to Render + Neon

### Step 1 — Neon Database
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string

### Step 2 — Push to GitHub
```bash
git add .
git commit -m "initial commit"
git push -u origin main
```

### Step 3 — Render Web Service
1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Set the following:

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Start Command | `node server/index.js` |

4. Add environment variables:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | your Neon connection string |
| `SEED_DATA` | `true` (set to `false` after first deploy) |
| `CLIENT_URL` | your Render app URL |
| `PORT` | `3001` |

The app will be live at your Render URL. The frontend is served by the Express backend in production.

---

## Project Structure

```
dashboard/
├── server/
│   ├── index.js          # Express server entry point
│   ├── db.js             # Neon/PostgreSQL connection
│   ├── routes/           # API route handlers
│   │   ├── etsy.js
│   │   ├── trends.js
│   │   ├── plr.js
│   │   ├── proxy.js
│   │   ├── scoreboard.js
│   │   ├── assistant.js
│   │   ├── brand.js
│   │   ├── marketing.js
│   │   └── schedule.js
│   ├── scrapers/         # Web scraping logic (Etsy, Trends)
│   └── utils/            # Helpers (proxy, scoring, keywords, domains)
├── src/
│   ├── App.jsx           # Root component + tab routing
│   ├── context/          # DataContext, ThemeContext, NotificationContext
│   ├── components/       # UI components per tab
│   │   ├── Overview.jsx
│   │   ├── Niches.jsx
│   │   ├── Cities.jsx
│   │   ├── Stores.jsx
│   │   ├── Content.jsx
│   │   ├── CS.jsx
│   │   ├── Financial.jsx
│   │   ├── Research/     # 8 research sub-tabs
│   │   └── BrandStudio/  # 5 brand studio sub-tabs
│   ├── data/
│   │   └── seedData.js   # Generated demo data (600 stores)
│   └── hooks/            # useStorage, useNotifications
├── .env                  # Local env vars (git-ignored)
├── .env.example          # Env template
├── render.yaml           # Render deployment config
└── package.json
```

---

## Roles

| Role | Access |
|---|---|
| **Owner** | All tabs including Financial, Research, Brand Studio |
| **Lead** | Overview, Niches, Cities, Stores, Content, CS |
| **Member** | Overview, Stores, Content, CS |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string | required |
| `SEED_DATA` | Seed DB with defaults on startup | `true` |
| `NODE_ENV` | `development` or `production` | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `PORT` | Backend server port | `3001` |
