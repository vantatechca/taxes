// ===========================================================================
// scoring.js - Product scoring algorithm
// Calculates a 0-100 score for digital products based on Google Trends,
// Etsy validation, evergreen potential, price point, and PLR availability.
// ===========================================================================

/**
 * Score a product on a 0-100 scale.
 *
 * Weights:
 *   - Google Trends volume (0-100):   0.35  (THE primary signal)
 *   - Etsy validation score:          0.25  (reviews * velocity)
 *   - Evergreen factor:               0.15  (1.0 steady, 0.5 spiky)
 *   - Price point attractiveness:     0.10  (sweet spot $10-$50)
 *   - Buy-and-resell ease:            0.15  (PLR available = bonus)
 *
 * @param {Object} product - Product object with price, reviews, favorites, etc.
 * @param {Object} trendData - Trend data with averageScore, timeline, direction, etc.
 * @returns {Object} { score, breakdown, classification }
 */
function scoreProduct(product, trendData = {}) {
  // 1. Google Trends volume (0-100)
  const trendsScore = Math.min(100, Math.max(0, trendData.averageScore || 0));

  // 2. Etsy validation: reviews * velocity
  //    velocity = reviews / months_listed (or estimate)
  const reviews = product.reviews || 0;
  const favorites = product.favorites || 0;
  // Estimate velocity: assume product is ~12 months old if we don't know
  const monthsOld = product.monthsOld || 12;
  const velocity = monthsOld > 0 ? reviews / monthsOld : reviews;
  // Normalize: 100+ reviews/month is top tier
  const etsyRaw = Math.min(100, (reviews * 0.3) + (velocity * 5) + (favorites * 0.05));

  // 3. Evergreen factor (0-100)
  const classification = classifyTrend(trendData);
  let evergreenScore = 50; // default neutral
  switch (classification.type) {
    case 'evergreen': evergreenScore = 100; break;
    case 'rising':    evergreenScore = 85; break;
    case 'seasonal':  evergreenScore = 50; break;
    case 'fading':    evergreenScore = 25; break;
    case 'flash':     evergreenScore = 10; break;
  }

  // 4. Price point attractiveness (0-100)
  //    Sweet spot is $10-$50. Below $5 = bad. Above $100 = harder to sell.
  const price = parseFloat(product.price) || 0;
  let priceScore = 0;
  if (price >= 10 && price <= 50) {
    priceScore = 100; // Sweet spot
  } else if (price >= 5 && price < 10) {
    priceScore = 60; // Acceptable
  } else if (price > 50 && price <= 100) {
    priceScore = 70; // Still okay
  } else if (price > 100) {
    priceScore = 40; // High price, harder volume
  } else if (price > 0 && price < 5) {
    priceScore = 15; // Not worth reselling
  }

  // 5. Buy-and-resell ease (0-100)
  //    PLR/MRR available = big bonus, digital format = bonus
  let resaleScore = 30; // base for any digital product
  if (product.plrAvailable) resaleScore += 50;
  if (product.mrrAvailable) resaleScore += 40;
  if (product.isDigital !== false) resaleScore += 20; // assume digital unless stated otherwise
  resaleScore = Math.min(100, resaleScore);

  // Weighted final score
  const score = Math.round(
    (trendsScore * 0.35) +
    (etsyRaw * 0.25) +
    (evergreenScore * 0.15) +
    (priceScore * 0.10) +
    (resaleScore * 0.15)
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      trendsVolume: { score: Math.round(trendsScore), weight: 0.35 },
      etsyValidation: { score: Math.round(etsyRaw), weight: 0.25, reviews, velocity: Math.round(velocity * 10) / 10 },
      evergreenFactor: { score: evergreenScore, weight: 0.15, type: classification.type },
      pricePoint: { score: priceScore, weight: 0.10, price },
      resaleEase: { score: resaleScore, weight: 0.15, plrAvailable: !!product.plrAvailable },
    },
    classification,
  };
}

/**
 * Classify a trend's longevity pattern.
 *
 * @param {Object} trendData - Must have timeline array with { value } entries.
 * @returns {{ type: string, confidence: number, reasoning: string }}
 */
function classifyTrend(trendData = {}) {
  const timeline = trendData.timeline || [];

  if (timeline.length < 4) {
    return {
      type: 'unknown',
      confidence: 0,
      reasoning: 'Insufficient data points to classify trend.',
    };
  }

  const values = timeline.map((t) => t.value || 0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  // Coefficient of variation (lower = more stable)
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length);
  const cv = avg > 0 ? stdDev / avg : 0;

  // Trend direction: compare first third vs last third
  const third = Math.floor(values.length / 3);
  const firstThirdAvg = values.slice(0, third).reduce((a, b) => a + b, 0) / third;
  const lastThirdAvg = values.slice(-third).reduce((a, b) => a + b, 0) / third;
  const directionRatio = firstThirdAvg > 0 ? lastThirdAvg / firstThirdAvg : 1;

  // Spike detection: does the peak deviate significantly from median?
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const spikeRatio = median > 0 ? max / median : 0;

  // Classification logic
  if (cv < 0.25 && avg > 20) {
    return {
      type: 'evergreen',
      confidence: Math.min(1, 1 - cv),
      reasoning: `Stable interest (CV=${cv.toFixed(2)}) with healthy average of ${avg.toFixed(0)}. Consistent demand.`,
    };
  }

  if (directionRatio > 1.5 && lastThirdAvg > 30) {
    return {
      type: 'rising',
      confidence: Math.min(1, (directionRatio - 1) / 2),
      reasoning: `Recent interest is ${directionRatio.toFixed(1)}x the early period. Growing demand.`,
    };
  }

  if (spikeRatio > 3 && cv > 0.6) {
    return {
      type: 'flash',
      confidence: Math.min(1, spikeRatio / 5),
      reasoning: `Extreme spike (${spikeRatio.toFixed(1)}x median) with high volatility (CV=${cv.toFixed(2)}). Flash-in-the-pan.`,
    };
  }

  if (directionRatio < 0.5 && firstThirdAvg > 20) {
    return {
      type: 'fading',
      confidence: Math.min(1, (1 - directionRatio)),
      reasoning: `Interest has dropped to ${(directionRatio * 100).toFixed(0)}% of earlier levels. Declining demand.`,
    };
  }

  if (cv > 0.35 && range > 40) {
    return {
      type: 'seasonal',
      confidence: Math.min(1, cv - 0.2),
      reasoning: `Significant variation (CV=${cv.toFixed(2)}, range=${range}) suggests seasonal pattern.`,
    };
  }

  // Default
  return {
    type: 'evergreen',
    confidence: 0.5,
    reasoning: `Moderate stability (CV=${cv.toFixed(2)}, avg=${avg.toFixed(0)}). Likely sustainable.`,
  };
}

/**
 * Suggest digital product types for a given niche keyword.
 * Returns an array of product ideas tailored to Shopify digital stores.
 */
function suggestProductTypes(niche) {
  const nicheLC = (niche || '').toLowerCase();

  // Base digital product types that work for any niche
  const base = [
    `${niche} eBook / PDF guide`,
    `${niche} printable planner or worksheet`,
    `${niche} Canva template bundle`,
    `${niche} checklist / cheat sheet`,
    `${niche} digital wall art / poster`,
    `${niche} social media template pack`,
    `${niche} spreadsheet / tracker template`,
    `${niche} video tutorial / course`,
    `${niche} email swipe file / sequence`,
    `${niche} notion template`,
  ];

  // Niche-specific additions
  const extras = [];

  if (['fitness', 'health', 'wellness', 'yoga', 'workout'].some((k) => nicheLC.includes(k))) {
    extras.push(
      `${niche} meal plan PDF`,
      `${niche} workout program printable`,
      `${niche} habit tracker`,
      `${niche} progress journal template`,
    );
  }

  if (['business', 'entrepreneur', 'startup', 'marketing'].some((k) => nicheLC.includes(k))) {
    extras.push(
      `${niche} business plan template`,
      `${niche} pitch deck template`,
      `${niche} invoice / contract template`,
      `${niche} marketing calendar`,
    );
  }

  if (['craft', 'art', 'design', 'creative', 'svg'].some((k) => nicheLC.includes(k))) {
    extras.push(
      `${niche} SVG cut file bundle`,
      `${niche} clipart pack`,
      `${niche} pattern / seamless design`,
      `${niche} coloring page set`,
    );
  }

  if (['wedding', 'party', 'event', 'baby', 'shower'].some((k) => nicheLC.includes(k))) {
    extras.push(
      `${niche} invitation template`,
      `${niche} signage bundle`,
      `${niche} seating chart template`,
      `${niche} photo booth props printable`,
    );
  }

  if (['finance', 'money', 'budget', 'investing'].some((k) => nicheLC.includes(k))) {
    extras.push(
      `${niche} budget spreadsheet`,
      `${niche} expense tracker`,
      `${niche} financial planner PDF`,
      `${niche} savings challenge printable`,
    );
  }

  if (['education', 'teacher', 'student', 'learning', 'school'].some((k) => nicheLC.includes(k))) {
    extras.push(
      `${niche} lesson plan template`,
      `${niche} flashcard set`,
      `${niche} study guide PDF`,
      `${niche} classroom decor printable`,
    );
  }

  return [...base, ...extras];
}

module.exports = { scoreProduct, classifyTrend, suggestProductTypes };
