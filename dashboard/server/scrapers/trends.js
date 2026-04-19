// ===========================================================================
// trends.js - Google Trends wrapper
// Uses the google-trends-api npm package to fetch trend data, related
// queries/topics, comparisons, and longevity classification.
// ===========================================================================

const googleTrends = require('google-trends-api');

/**
 * Get interest over time for a keyword.
 *
 * @param {string} keyword - Search keyword
 * @param {Object} options - { geo, timeframe, category }
 * @returns {Object} { keyword, timeline, averageScore, direction, peakMonth, raw }
 */
async function getTrend(keyword, options = {}) {
  const geo = options.geo || ''; // empty = worldwide, 'US', 'CA'
  const startTime = options.startTime || _monthsAgo(12);
  const endTime = options.endTime || new Date();
  const category = options.category || 0;

  try {
    const result = await googleTrends.interestOverTime({
      keyword,
      startTime,
      endTime,
      geo,
      category,
    });

    const parsed = JSON.parse(result);
    const timelineData = parsed.default?.timelineData || [];

    // Build clean timeline
    const timeline = timelineData.map((point) => ({
      date: point.formattedAxisTime || point.formattedTime || '',
      time: point.time ? new Date(parseInt(point.time) * 1000).toISOString() : '',
      value: point.value?.[0] || 0,
      formattedValue: point.formattedValue?.[0] || '0',
    }));

    // Calculate stats
    const values = timeline.map((t) => t.value);
    const averageScore = values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;

    // Determine direction (last 3 months vs previous 3 months)
    let direction = 'stable';
    if (values.length >= 6) {
      const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const previous = values.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
      if (recent > previous * 1.2) direction = 'up';
      else if (recent < previous * 0.8) direction = 'down';
    }

    // Find peak month
    let peakMonth = '';
    if (timeline.length > 0) {
      const peakIdx = values.indexOf(Math.max(...values));
      peakMonth = timeline[peakIdx]?.date || '';
    }

    return {
      keyword,
      geo: geo || 'Worldwide',
      timeframe: `${startTime.toISOString().split('T')[0]} to ${endTime.toISOString().split('T')[0]}`,
      timeline,
      averageScore,
      direction,
      peakMonth,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[trends] Error fetching trend for "${keyword}":`, err.message);
    return {
      keyword,
      geo: geo || 'Worldwide',
      timeline: [],
      averageScore: 0,
      direction: 'unknown',
      peakMonth: '',
      error: err.message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get related queries for a keyword (top + rising).
 *
 * @param {string} keyword
 * @returns {Object} { top: [], rising: [] }
 */
async function getRelatedQueries(keyword) {
  try {
    const result = await googleTrends.relatedQueries({ keyword });
    const parsed = JSON.parse(result);
    const data = parsed.default || {};

    const top = (data.rankedList?.[0]?.rankedKeyword || []).map((item) => ({
      query: item.query,
      value: item.value,
    }));

    const rising = (data.rankedList?.[1]?.rankedKeyword || []).map((item) => ({
      query: item.query,
      value: item.value,
      formattedValue: item.formattedValue || '',
    }));

    return { keyword, top, rising, fetchedAt: new Date().toISOString() };
  } catch (err) {
    console.error(`[trends] Error fetching related queries for "${keyword}":`, err.message);
    return { keyword, top: [], rising: [], error: err.message, fetchedAt: new Date().toISOString() };
  }
}

/**
 * Get related topics for a keyword (top + rising).
 *
 * @param {string} keyword
 * @returns {Object} { top: [], rising: [] }
 */
async function getRelatedTopics(keyword) {
  try {
    const result = await googleTrends.relatedTopics({ keyword });
    const parsed = JSON.parse(result);
    const data = parsed.default || {};

    const top = (data.rankedList?.[0]?.rankedKeyword || []).map((item) => ({
      topic: item.topic?.title || item.query || '',
      type: item.topic?.type || '',
      value: item.value,
    }));

    const rising = (data.rankedList?.[1]?.rankedKeyword || []).map((item) => ({
      topic: item.topic?.title || item.query || '',
      type: item.topic?.type || '',
      value: item.value,
      formattedValue: item.formattedValue || '',
    }));

    return { keyword, top, rising, fetchedAt: new Date().toISOString() };
  } catch (err) {
    console.error(`[trends] Error fetching related topics for "${keyword}":`, err.message);
    return { keyword, top: [], rising: [], error: err.message, fetchedAt: new Date().toISOString() };
  }
}

/**
 * Compare up to 5 keywords side by side.
 *
 * @param {string[]} keywords - Array of 2-5 keywords
 * @returns {Object} { keywords, timeline, averages }
 */
async function compareKeywords(keywords) {
  if (!Array.isArray(keywords) || keywords.length < 2) {
    throw new Error('Must provide at least 2 keywords to compare');
  }
  if (keywords.length > 5) {
    keywords = keywords.slice(0, 5);
  }

  try {
    const result = await googleTrends.interestOverTime({
      keyword: keywords,
      startTime: _monthsAgo(12),
      endTime: new Date(),
    });

    const parsed = JSON.parse(result);
    const timelineData = parsed.default?.timelineData || [];

    // Build comparison timeline
    const timeline = timelineData.map((point) => {
      const entry = {
        date: point.formattedAxisTime || '',
        time: point.time ? new Date(parseInt(point.time) * 1000).toISOString() : '',
      };
      keywords.forEach((kw, idx) => {
        entry[kw] = point.value?.[idx] || 0;
      });
      return entry;
    });

    // Calculate averages
    const averages = {};
    keywords.forEach((kw, idx) => {
      const vals = timelineData.map((p) => p.value?.[idx] || 0);
      averages[kw] = vals.length > 0
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0;
    });

    return {
      keywords,
      timeline,
      averages,
      winner: Object.entries(averages).sort((a, b) => b[1] - a[1])[0]?.[0] || keywords[0],
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[trends] Error comparing keywords:`, err.message);
    return {
      keywords,
      timeline: [],
      averages: {},
      winner: null,
      error: err.message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get interest by region for a keyword (US states + Canadian provinces).
 *
 * @param {string} keyword
 * @returns {Object} { us: [], ca: [] }
 */
async function getTrendWithRegions(keyword) {
  const regions = {};

  // US states
  try {
    const usResult = await googleTrends.interestByRegion({
      keyword,
      startTime: _monthsAgo(12),
      endTime: new Date(),
      geo: 'US',
      resolution: 'REGION',
    });
    const usParsed = JSON.parse(usResult);
    regions.us = (usParsed.default?.geoMapData || []).map((item) => ({
      name: item.geoName,
      code: item.geoCode,
      value: item.value?.[0] || 0,
    }));
  } catch (err) {
    console.warn(`[trends] US region data failed for "${keyword}":`, err.message);
    regions.us = [];
  }

  // Canadian provinces
  try {
    const caResult = await googleTrends.interestByRegion({
      keyword,
      startTime: _monthsAgo(12),
      endTime: new Date(),
      geo: 'CA',
      resolution: 'REGION',
    });
    const caParsed = JSON.parse(caResult);
    regions.ca = (caParsed.default?.geoMapData || []).map((item) => ({
      name: item.geoName,
      code: item.geoCode,
      value: item.value?.[0] || 0,
    }));
  } catch (err) {
    console.warn(`[trends] CA region data failed for "${keyword}":`, err.message);
    regions.ca = [];
  }

  return {
    keyword,
    ...regions,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Classify the longevity of a keyword using 5-year trend data.
 *
 * @param {string} keyword
 * @returns {Object} { type, confidence, reasoning }
 */
async function classifyLongevity(keyword) {
  try {
    const result = await googleTrends.interestOverTime({
      keyword,
      startTime: _monthsAgo(60), // 5 years
      endTime: new Date(),
    });

    const parsed = JSON.parse(result);
    const timelineData = parsed.default?.timelineData || [];

    const timeline = timelineData.map((point) => ({
      date: point.formattedAxisTime || '',
      value: point.value?.[0] || 0,
    }));

    if (timeline.length < 12) {
      return {
        keyword,
        type: 'unknown',
        confidence: 0,
        reasoning: 'Not enough 5-year data to classify longevity.',
        timeline,
      };
    }

    const values = timeline.map((t) => t.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Standard deviation
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length);
    const cv = avg > 0 ? stdDev / avg : 0;

    // Direction: first year vs last year
    const yearLen = Math.floor(values.length / 5);
    const firstYear = values.slice(0, yearLen);
    const lastYear = values.slice(-yearLen);
    const firstAvg = firstYear.reduce((a, b) => a + b, 0) / firstYear.length;
    const lastAvg = lastYear.reduce((a, b) => a + b, 0) / lastYear.length;
    const growth = firstAvg > 0 ? lastAvg / firstAvg : 1;

    // Spike detection
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const spikeRatio = median > 0 ? max / median : 0;

    // Seasonality: check if same months repeat high values year-over-year
    let seasonalScore = 0;
    if (values.length >= 24) {
      // Check 12-month periodicity
      for (let i = 12; i < values.length; i++) {
        const corr = Math.abs(values[i] - values[i - 12]) / (avg || 1);
        if (corr < 0.3) seasonalScore++;
      }
      seasonalScore = seasonalScore / (values.length - 12);
    }

    // Classification
    if (cv < 0.25 && avg > 15 && Math.abs(growth - 1) < 0.3) {
      return {
        keyword,
        type: 'evergreen',
        confidence: Math.min(1, 1 - cv),
        reasoning: `Stable 5-year interest (CV=${cv.toFixed(2)}, avg=${avg.toFixed(0)}). Consistent demand with ${(growth * 100).toFixed(0)}% growth ratio. Safe bet.`,
        timeline,
      };
    }

    if (growth > 2 && lastAvg > 25) {
      return {
        keyword,
        type: 'rising',
        confidence: Math.min(1, (growth - 1) / 3),
        reasoning: `Interest grew ${growth.toFixed(1)}x over 5 years. Last year avg: ${lastAvg.toFixed(0)}. Strong upward trajectory.`,
        timeline,
      };
    }

    if (spikeRatio > 4 && cv > 0.7) {
      return {
        keyword,
        type: 'flash',
        confidence: Math.min(1, spikeRatio / 6),
        reasoning: `Extreme spike detected (${spikeRatio.toFixed(1)}x median) with high volatility. Likely viral/flash trend.`,
        timeline,
      };
    }

    if (growth < 0.4 && firstAvg > 20) {
      return {
        keyword,
        type: 'fading',
        confidence: Math.min(1, 1 - growth),
        reasoning: `Interest dropped to ${(growth * 100).toFixed(0)}% of 5-year-ago levels. Declining demand.`,
        timeline,
      };
    }

    if (seasonalScore > 0.5 || cv > 0.35) {
      return {
        keyword,
        type: 'seasonal',
        confidence: Math.min(1, Math.max(seasonalScore, cv - 0.2)),
        reasoning: `Repeating patterns detected (seasonality=${(seasonalScore * 100).toFixed(0)}%, CV=${cv.toFixed(2)}). Plan launches around peak months.`,
        timeline,
      };
    }

    return {
      keyword,
      type: 'evergreen',
      confidence: 0.5,
      reasoning: `Moderate stability over 5 years (CV=${cv.toFixed(2)}, avg=${avg.toFixed(0)}). Likely sustainable but monitor periodically.`,
      timeline,
    };
  } catch (err) {
    console.error(`[trends] Error classifying longevity for "${keyword}":`, err.message);
    return {
      keyword,
      type: 'unknown',
      confidence: 0,
      reasoning: `Failed to fetch 5-year data: ${err.message}`,
      timeline: [],
      error: err.message,
    };
  }
}

// ---- Helpers ----

/**
 * Return a Date object N months ago.
 */
function _monthsAgo(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

module.exports = {
  getTrend,
  getRelatedQueries,
  getRelatedTopics,
  compareKeywords,
  getTrendWithRegions,
  classifyLongevity,
};
