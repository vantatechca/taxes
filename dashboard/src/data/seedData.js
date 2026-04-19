export const NICHES = [
  { id: 1, slug: "wedding-planning", name: "Wedding Planning", brand: "WedReady", emoji: "💍", colors: { primary: "#D4A574", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 2, slug: "small-business-startup", name: "Startup Kits", brand: "LaunchKit", emoji: "🚀", colors: { primary: "#3498DB", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 3, slug: "resume-career", name: "Resume & Career", brand: "CareerEdge", emoji: "📄", colors: { primary: "#27AE60", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 4, slug: "personal-finance", name: "Personal Finance", brand: "BudgetWise", emoji: "💰", colors: { primary: "#F39C12", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 5, slug: "meal-planning", name: "Meal Planning", brand: "MealFlow", emoji: "🥗", colors: { primary: "#E74C3C", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 6, slug: "fitness-workout", name: "Fitness & Workout", brand: "FitPlan", emoji: "💪", colors: { primary: "#9B59B6", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 7, slug: "home-organization", name: "Home Organization", brand: "HomeSort", emoji: "🏡", colors: { primary: "#1ABC9C", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 8, slug: "parenting-baby", name: "Parenting & Baby", brand: "BabyReady", emoji: "👶", colors: { primary: "#E67E22", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 9, slug: "event-planning", name: "Event Planning", brand: "EventPro", emoji: "🎉", colors: { primary: "#E91E63", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 10, slug: "social-media-marketing", name: "Social Media", brand: "PostPilot", emoji: "📱", colors: { primary: "#00BCD4", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 11, slug: "pet-care", name: "Pet Care", brand: "PawGuide", emoji: "🐾", colors: { primary: "#8BC34A", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
  { id: 12, slug: "real-estate", name: "Real Estate", brand: "HomeBase", emoji: "🏠", colors: { primary: "#607D8B", secondary: "#2C3E50" }, blogTarget: 100, gmbTarget: 50 },
];

export const CITIES = [
  { name: "Toronto", province: "ON" }, { name: "Montreal", province: "QC" },
  { name: "Vancouver", province: "BC" }, { name: "Calgary", province: "AB" },
  { name: "Edmonton", province: "AB" }, { name: "Ottawa", province: "ON" },
  { name: "Winnipeg", province: "MB" }, { name: "Mississauga", province: "ON" },
  { name: "Brampton", province: "ON" }, { name: "Hamilton", province: "ON" },
  { name: "Surrey", province: "BC" }, { name: "Laval", province: "QC" },
  { name: "Halifax", province: "NS" }, { name: "London", province: "ON" },
  { name: "Markham", province: "ON" }, { name: "Vaughan", province: "ON" },
  { name: "Gatineau", province: "QC" }, { name: "Saskatoon", province: "SK" },
  { name: "Kitchener", province: "ON" }, { name: "Burnaby", province: "BC" },
  { name: "Windsor", province: "ON" }, { name: "Regina", province: "SK" },
  { name: "Richmond", province: "BC" }, { name: "Richmond Hill", province: "ON" },
  { name: "Oakville", province: "ON" }, { name: "Burlington", province: "ON" },
  { name: "Oshawa", province: "ON" }, { name: "Barrie", province: "ON" },
  { name: "St. Catharines", province: "ON" }, { name: "Cambridge", province: "ON" },
  { name: "Kingston", province: "ON" }, { name: "Guelph", province: "ON" },
  { name: "Thunder Bay", province: "ON" }, { name: "Waterloo", province: "ON" },
  { name: "Brantford", province: "ON" }, { name: "Pickering", province: "ON" },
  { name: "Niagara Falls", province: "ON" }, { name: "Peterborough", province: "ON" },
  { name: "Sault Ste. Marie", province: "ON" }, { name: "Sarnia", province: "ON" },
  { name: "Kelowna", province: "BC" }, { name: "Nanaimo", province: "BC" },
  { name: "Kamloops", province: "BC" }, { name: "Chilliwack", province: "BC" },
  { name: "Victoria", province: "BC" }, { name: "Fredericton", province: "NB" },
  { name: "Moncton", province: "NB" }, { name: "Saint John", province: "NB" },
  { name: "Lethbridge", province: "AB" }, { name: "Red Deer", province: "AB" },
];

// Seeded random to keep data consistent
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateStores() {
  const stores = [];
  const statuses = ["live", "live", "live", "live", "live", "live", "live", "live", "pending", "paused"];
  const gmbStatuses = ["active", "active", "active", "active", "active", "active", "pending", "suspended", "none"];
  const topCities = ["Toronto", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Montreal"];

  let storeId = 0;
  for (const niche of NICHES) {
    for (const city of CITIES) {
      const rng = seededRandom(storeId * 997 + niche.id * 31 + city.name.charCodeAt(0));
      const r = rng;

      const isTopCity = topCities.includes(city.name);
      const isTopNiche = [1, 2, 3, 4].includes(niche.id);
      const baseRevMult = (isTopCity ? 1.6 : 1.0) * (isTopNiche ? 1.3 : 1.0);

      // Power law revenue distribution
      const powerRoll = r();
      const rev7d = powerRoll > 0.85
        ? Math.round((200 + r() * 600) * baseRevMult)
        : powerRoll > 0.5
          ? Math.round((50 + r() * 150) * baseRevMult)
          : Math.round(r() * 50 * baseRevMult);

      const aov = 15 + r() * 35;
      const orders7d = rev7d > 0 ? Math.max(1, Math.round(rev7d / aov)) : 0;
      const refundRate = 0.01 + r() * 0.09;
      const statusRoll = r();
      const status = statusRoll > 0.92 ? statuses[8] : statusRoll > 0.88 ? statuses[9] : "live";
      const gmbRoll = r();
      const gmbStatus = gmbRoll > 0.90 ? "suspended" : gmbRoll > 0.80 ? "pending" : gmbRoll > 0.70 ? "none" : "active";
      const blogPosts = Math.floor(3 + r() * 25);
      const products = 7 + Math.floor(r() * 5);
      const daysLive = Math.floor(30 + r() * 365);
      const lastOrderDaysAgo = rev7d === 0 ? Math.floor(45 + r() * 60) : Math.floor(r() * 7);

      const domainSlug = niche.slug.split("-")[0] + city.name.toLowerCase().replace(/[^a-z]/g, "");

      stores.push({
        store_id: `${niche.slug}-${city.name.toLowerCase().replace(/\s+/g, "-")}-${String(storeId).padStart(3, "0")}`,
        niche_id: niche.id,
        niche: niche.slug,
        niche_name: niche.name,
        city: city.name,
        province: city.province,
        domain: `${domainSlug}.ca`,
        brand_name: niche.brand,
        status,
        gmb_status: gmbStatus,
        days_live: daysLive,
        products_count: products,
        blog_posts_count: blogPosts,
        rev_7d: rev7d,
        orders_7d: orders7d,
        aov: parseFloat(aov.toFixed(2)),
        refund_rate: parseFloat(refundRate.toFixed(4)),
        organic_sessions_30d: Math.floor(r() * 400),
        last_order_days_ago: lastOrderDaysAgo,
        shopify_flagged: r() > 0.98,
      });
      storeId++;
    }
  }
  return stores;
}

export const STORES = generateStores();

// Aggregate niche metrics
export function getNicheMetrics() {
  return NICHES.map((niche) => {
    const nicheStores = STORES.filter((s) => s.niche_id === niche.id);
    const liveStores = nicheStores.filter((s) => s.status === "live");
    const rev7d = nicheStores.reduce((a, s) => a + s.rev_7d, 0);
    const orders7d = nicheStores.reduce((a, s) => a + s.orders_7d, 0);
    const aov = orders7d > 0 ? rev7d / orders7d : 0;
    const totalRefunds = nicheStores.reduce((a, s) => a + s.orders_7d * s.refund_rate, 0);
    const refundRate = orders7d > 0 ? totalRefunds / orders7d : 0;
    const rng = seededRandom(niche.id * 777);
    const blogThisWeek = Math.floor(60 + rng() * 40);
    const gmbThisWeek = Math.floor(30 + rng() * 25);
    const activeGmb = nicheStores.filter((s) => s.gmb_status === "active").length;
    const blogPosts = nicheStores.reduce((a, s) => a + s.blog_posts_count, 0);
    const products = nicheStores.reduce((a, s) => a + s.products_count, 0);
    const organicSessions = nicheStores.reduce((a, s) => a + s.organic_sessions_30d, 0);

    // Niche health score (0–100)
    const revTrend = rng() > 0.4 ? 30 : rng() > 0.2 ? 15 : 0;
    const refundScore = refundRate < 0.05 ? 20 : refundRate < 0.10 ? 10 : 0;
    const contentScore = blogThisWeek / niche.blogTarget >= 1 ? 20 : blogThisWeek / niche.blogTarget >= 0.8 ? 10 : 0;
    const seoScore = rng() > 0.5 ? 15 : rng() > 0.25 ? 7 : 0;
    const gmbScore = activeGmb / nicheStores.length > 0.9 ? 15 : activeGmb / nicheStores.length > 0.7 ? 7 : 0;
    const healthScore = revTrend + refundScore + contentScore + seoScore + gmbScore;

    return {
      ...niche,
      stores: nicheStores.length,
      live: liveStores.length,
      // legacy aliases
      store_count: nicheStores.length,
      live_count: liveStores.length,
      rev_7d: rev7d,
      orders_7d: orders7d,
      aov: parseFloat(aov.toFixed(2)),
      refund_rate: parseFloat(refundRate.toFixed(4)),
      blog_this_week: blogThisWeek,
      gmb_this_week: gmbThisWeek,
      active_gmb: activeGmb,
      blog_posts: blogPosts,
      products,
      organic_sessions: organicSessions,
      healthScore,
      health_score: healthScore,
      rev_trend: rng() > 0.5 ? (0.05 + rng() * 0.3) : -(0.05 + rng() * 0.25),
    };
  }).sort((a, b) => b.rev_7d - a.rev_7d);
}

// Aggregate city metrics
export function getCityMetrics() {
  return CITIES.map((city) => {
    const cityStores = STORES.filter((s) => s.city === city.name);
    const liveStores = cityStores.filter((s) => s.status === "live");
    const rev7d = cityStores.reduce((a, s) => a + s.rev_7d, 0);
    const orders7d = cityStores.reduce((a, s) => a + s.orders_7d, 0);
    const aov = orders7d > 0 ? rev7d / orders7d : 0;
    const rng = seededRandom(city.name.charCodeAt(0) * 31337);
    const healthScore = Math.min(100, Math.round(40 + rng() * 60));
    const bestNiche = NICHES.reduce((best, niche) => {
      const nicheRev = cityStores.filter((s) => s.niche_id === niche.id).reduce((a, s) => a + s.rev_7d, 0);
      return nicheRev > best.rev ? { name: niche.name, rev: nicheRev } : best;
    }, { name: "", rev: 0 });
    return {
      city: city.name,
      province: city.province,
      stores: cityStores.length,
      live: liveStores.length,
      store_count: cityStores.length,
      rev_7d: rev7d,
      orders_7d: orders7d,
      aov: parseFloat(aov.toFixed(2)),
      healthScore,
      best_niche: bestNiche.name,
      best_niche_rev: bestNiche.rev,
    };
  }).sort((a, b) => b.rev_7d - a.rev_7d);
}

// Generate 30-day revenue history
export function getRevenueTrend(days = 30) {
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
    const rng = seededRandom(i * 1234 + 5678);
    const baseRev = 2200 + rng() * 600;
    const entry = { date: label };
    let total = 0;
    NICHES.forEach((n) => {
      const r2 = seededRandom(i * n.id * 99);
      const val = Math.round((baseRev / NICHES.length) * (0.5 + r2() * 1.5));
      entry[n.slug] = val;
      total += val;
    });
    entry.total = total;
    result.push(entry);
  }
  return result;
}

// Generate CS data
export function getCSMetrics() {
  const rng = seededRandom(42424242);
  const ticketTypes = { refund: 28, shipping: 19, product: 14, other: 8 };
  const priorityBreakdown = { high: 12, medium: 31, low: 26 };

  // Top refund stores sorted by refund rate
  const topRefundStores = [...STORES]
    .filter((s) => s.orders_7d > 0)
    .sort((a, b) => b.refund_rate - a.refund_rate)
    .slice(0, 15)
    .map((s) => ({
      store_id: s.store_id,
      brand_name: s.brand_name,
      domain: s.domain,
      city: s.city,
      refund_rate: s.refund_rate,
      refund_value: Math.round(s.rev_7d * s.refund_rate),
      orders_7d: s.orders_7d,
      rev_7d: s.rev_7d,
    }));

  // Generate ticket list
  const ticketTypeKeys = ["refund", "shipping", "product", "other"];
  const priorities = ["high", "medium", "low"];
  const tickets = [];
  for (let i = 0; i < 20; i++) {
    const storeIdx = Math.floor(rng() * STORES.length);
    const s = STORES[storeIdx];
    tickets.push({
      store_name: s.brand_name,
      city: s.city,
      type: ticketTypeKeys[Math.floor(rng() * ticketTypeKeys.length)],
      priority: priorities[Math.floor(rng() * priorities.length)],
      days_open: Math.floor(rng() * 14),
      order_value: Math.round(15 + rng() * 80),
    });
  }

  const totalRefundValue = STORES.reduce((a, s) => a + Math.round(s.rev_7d * s.refund_rate), 0);

  return {
    open_tickets: 69,
    new_today: 7,
    resolved_today: 12,
    refund_value: totalRefundValue,
    avg_response_hours: 4.2,
    resolution_rate: 0.87,
    sla_compliance: 0.91,
    csat_score: 4.3,
    escalations: 4,
    chargebacks: 2,
    ticket_types: ticketTypes,
    priority_breakdown: priorityBreakdown,
    top_refund_stores: topRefundStores,
    tickets,
  };
}

// Financial data
export function getFinancials() {
  const rng = seededRandom(99887766);
  const totalGrossRev = STORES.reduce((a, s) => a + s.rev_7d * 4.3, 0);
  const refundAmt = STORES.reduce((a, s) => a + s.rev_7d * 4.3 * s.refund_rate, 0);
  const netRev = totalGrossRev - refundAmt;

  const expenses = {
    shopify: 600 * 39,
    domains: Math.round(600 * 1.5),
    apps: 1200,
    salaries: 85000,
    processing: Math.round(netRev * 0.029),
    marketing: 3200,
  };
  const totalExpenses = Object.values(expenses).reduce((a, v) => a + v, 0);
  const profit = netRev - totalExpenses;
  const profitMargin = netRev > 0 ? profit / netRev : 0;
  const mrr = Math.round(netRev);
  const arr = mrr * 12;
  const cashOnHand = Math.round(45000 + rng() * 30000);
  const runwayMonths = totalExpenses > 0 ? Math.round(cashOnHand / (totalExpenses - netRev > 0 ? totalExpenses - netRev : 1)) : 99;

  // Monthly P&L (last 6 months)
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const monthly_pl = months.map((month, i) => {
    const growth = 0.85 + i * 0.03;
    const r = seededRandom(i * 5555);
    const rev = Math.round(netRev * growth * (0.9 + r() * 0.2));
    const exp = Math.round(totalExpenses * (0.95 + r() * 0.1));
    return { month, revenue: rev, expenses: exp, profit: rev - exp };
  });

  // Weekly revenue (last 12 weeks)
  const weekly_rev = Array.from({ length: 12 }, (_, i) => {
    const r = seededRandom(i * 7777);
    return {
      week: `W${i + 1}`,
      revenue: Math.round((netRev / 4.3) * (0.85 + r() * 0.3)),
    };
  });

  // Platform fees
  const platform_fees = [
    { name: "Shopify Basic", monthly: 600 * 39, note: "600 stores × $39/mo" },
    { name: "Domains (.ca)", monthly: Math.round(600 * 15 / 12), note: "600 domains ~$15/yr" },
    { name: "Shopify Apps", monthly: 1200, note: "SEO, reviews, analytics" },
    { name: "Payment Processing", monthly: Math.round(netRev * 0.029), note: "2.9% of net revenue" },
  ];

  return {
    monthly: { revenue: Math.round(netRev) },
    expenses,
    profit_margin: parseFloat(profitMargin.toFixed(4)),
    runway_months: Math.min(runwayMonths, 36),
    mrr,
    arr,
    cash_on_hand: cashOnHand,
    cogs_pct: 0.12,
    monthly_pl,
    weekly_rev,
    cac: 8.5,
    ltv: 42,
    payback_months: 2,
    platform_fees,
    // legacy
    gross_rev: Math.round(totalGrossRev),
    refund_amt: Math.round(refundAmt),
    net_rev: Math.round(netRev),
    profit: Math.round(profit),
    total_costs: Math.round(totalExpenses),
  };
}

// Content metrics — returns per-store content data
export function getContentMetrics() {
  return STORES.map((s) => ({
    store_id: s.store_id,
    brand_name: s.brand_name,
    domain: s.domain,
    city: s.city,
    niche_id: s.niche_id,
    blog_posts: s.blog_posts_count,
    products: s.products_count,
    organic_sessions: s.organic_sessions_30d,
    rev_7d: s.rev_7d,
  }));
}

// Alerts engine
export function generateAlerts() {
  const alerts = [];
  const nicheMetrics = getNicheMetrics();
  const stores = STORES;

  // Store-level alerts
  const deadStores = stores.filter((s) => s.last_order_days_ago > 90 && s.status === "live");
  const slowStores = stores.filter((s) => s.last_order_days_ago > 45 && s.last_order_days_ago <= 90 && s.status === "live");
  const flaggedStores = stores.filter((s) => s.shopify_flagged);
  const suspendedGmb = stores.filter((s) => s.gmb_status === "suspended");
  const pendingGmb = stores.filter((s) => s.gmb_status === "pending" && s.days_live > 14);

  if (deadStores.length > 0) {
    alerts.push({ level: "critical", message: `${deadStores.length} stores are kill candidates — 90+ days no sales`, count: deadStores.length });
  }
  if (slowStores.length > 0) {
    alerts.push({ level: "warning", message: `${slowStores.length} stores have no sales in 45+ days`, count: slowStores.length });
  }
  flaggedStores.forEach((s) => {
    alerts.push({ level: "critical", message: `${s.domain} flagged by Shopify — immediate action needed` });
  });
  if (suspendedGmb.length > 0) {
    alerts.push({ level: "critical", message: `${suspendedGmb.length} GMB profiles suspended — recovery needed` });
  }
  if (pendingGmb.length > 0) {
    alerts.push({ level: "warning", message: `${pendingGmb.length} GMB profiles pending verification >14 days` });
  }

  // Niche-level alerts
  nicheMetrics.forEach((n) => {
    if (n.refund_rate > 0.15) {
      alerts.push({ level: "critical", message: `${n.name} refund rate ${(n.refund_rate * 100).toFixed(1)}% — investigate immediately` });
    } else if (n.refund_rate > 0.10) {
      alerts.push({ level: "warning", message: `${n.name} refund rate ${(n.refund_rate * 100).toFixed(1)}% — monitor closely` });
    }
    if (n.rev_trend < -0.20) {
      alerts.push({ level: "warning", message: `${n.name} revenue down ${Math.abs(Math.round(n.rev_trend * 100))}% WoW` });
    }
    if (n.blog_this_week / n.blogTarget < 0.80) {
      alerts.push({ level: "warning", message: `${n.name} blog output ${Math.round(n.blog_this_week / n.blogTarget * 100)}% of target` });
    }
    if (n.rev_trend > 0.30) {
      alerts.push({ level: "info", message: `${n.name} revenue up ${Math.round(n.rev_trend * 100)}% WoW` });
    }
  });

  return alerts.slice(0, 12);
}
