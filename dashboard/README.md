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

## Features

### Overview
- Real-time KPIs — total revenue (7d), orders, average order value, refund rate with WoW trend indicators
- Live alert banner — flags Shopify-suspended stores, dead GMB profiles, slow-sales stores
- Store health pie chart — live, pending, paused, flagged breakdown
- Revenue heatmap across Canada
- Revenue trend chart (last 7 days by niche)

### Niches
- Revenue and order breakdown per niche, ranked by performance
- Health score per niche (0–100) based on refund rate, content output, SEO, GMB
- Drill-down view — 90-day revenue trend, top 10 cities, store list
- Content status tracker (blogs/week, GMB/week vs targets)

### Cities
- Geographic revenue breakdown across 50 Canadian cities
- Province grouping and city-level drill-down
- Best niche per city, store count, live count, AOV

### Stores
- Full table of all stores with search, sort, and filter (niche, city, status)
- Bulk actions — pause, resume, flag, mark dead, export CSV
- Store detail modal — editable fields, 9-item launch checklist, notes, status controls
- Toast notifications on all store actions

### Content
- Log published content per store (blog post, GMB post, product added)
- Content calendar — 7-day schedule view by niche and team
- Content gap tracker — stores with fewer than 5 blog posts
- By-type and by-niche distribution charts

### CS (Customer Support)
- Create support tickets (refund, shipping, product, other) with priority levels
- Resolve user-created tickets with one click
- Ticket type and priority breakdown charts
- SLA compliance, CSAT score, escalation tracking
- Top refund stores ranked by refund rate

### Financial
- Editable cost config — Shopify, domains, apps, salaries, processing, ads, misc
- Auto-computed gross revenue, net revenue, refunds, profit, and margin
- Monthly P&L chart (last 6 months)
- Expense breakdown pie chart
- Break-even analysis — stores above/below break-even per store
- Revenue distribution histogram

### Research (Owner only)

#### Etsy Spy
- Niche Quick Research — 12 niches × pre-loaded keyword queries, bulk research mode
- Live Etsy product search with proxy rotation
- Product result cards — price, reviews, shop, estimated demand
- Competitor shop scraper and bookmark manager
- Product type auto-tagging (spreadsheet, template, planner, printable, etc.)
- Scoreboard integration — score products from search results

#### Trends
- Niche Pulse — scan all niches for Google Trends data at once
- Deep Dive — keyword trend history, direction, volatility, longevity classification
- Related Queries and Related Topics
- Multi-keyword comparison chart
- Opportunity Matrix — map niches by trend score vs competition
- Trending Now — surface rising keywords

#### PLR Vault
- Manage PLR/MRR marketplace sources (add, edit, delete)
- Track purchased PLR products with purchase price, resale price, and auto-calculated profit
- Source categories and notes

#### Scoreboard
- Auto-score Etsy products combining demand, trend score, reviews, and price
- Ranked leaderboard — top products sorted by composite score
- One-click rescore using latest Etsy + Trends data

#### Brain (AI Research Assistant)
- Conversational AI assistant powered by Claude API
- Customizable Golden Rules — constraints the AI follows when researching
- Conversation history with clear function
- Pre-loaded with product research knowledge

#### Marketing Engine
- Keyword autocomplete suggestions (Google)
- People Also Ask questions scraper
- Related searches fetcher
- Keyword volume and CPC estimates
- Blog topic generator per keyword + niche
- GMB category suggester per niche
- Domain name generator across 50 cities
- Bulk domain availability checker (WHOIS)
- Full city × TLD domain scan
- Marketing viability score — combines domain availability, keyword volume, CPC, trends, Etsy validation, blog opportunity, and niche scalability into a 0–100 score with LAUNCH / TEST / RISKY / SKIP verdict
- Save and manage marketing reports

#### Proxies
- Add proxies in bulk (HTTP, HTTPS, SOCKS5 supported)
- Round-robin rotation with automatic failover
- Health test — individual or batch test all proxies
- Working / failed / untested status tracking with latency stats

#### Schedules
- Create automated cron jobs for Etsy searches, Trends tracking, PLR reviews
- Pause, resume, and trigger schedules manually
- Daily request cost estimator

### Brand Studio (Owner only)

#### Brands
- Create brand profiles with niche, description, and color palette
- Manage products per brand with image uploads (base64)

#### Banners
- Generate HTML/CSS/Liquid banner templates
- Like/dislike feedback system with tags and notes
- Select primary banner per brand

#### Page Layouts
- Generate homepage and product page layouts in HTML/Liquid
- Feedback system — like/dislike per layout
- Select primary layout per page type

#### Assets
- Upload and manage original + rebranded product images per brand
- Like/dislike tracking per asset

#### Brand Brain
- Aggregates feedback by niche — most liked tags, styles, and notes
- Custom prompt library per niche
- Learns preferences over time to improve generation quality

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
