// ===========================================================================
// keywords.js - Keyword research & marketing intelligence utility
// Google Autocomplete scraping, People Also Ask, Related Searches,
// DataForSEO integration, blog topic generation, and GMB categories.
// ===========================================================================

const axios = require('axios');
const cheerio = require('cheerio');
const { getNextProxy, createProxyAgent } = require('./proxy');

// ---- User-Agent rotation pool ----
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/110.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Build axios config with optional proxy support and random User-Agent.
 */
function buildRequestConfig(extraHeaders = {}) {
  const config = {
    timeout: 15000,
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      ...extraHeaders,
    },
  };

  // Attach proxy if available
  const proxyUrl = getNextProxy();
  if (proxyUrl) {
    const agent = createProxyAgent(proxyUrl);
    config.httpAgent = agent;
    config.httpsAgent = agent;
  }

  return config;
}


// ===========================================================================
// Google Autocomplete Suggestions
// ===========================================================================

/**
 * Fetch autocomplete suggestions from Google's suggestion API.
 * @param {string} query - Search query to get suggestions for
 * @param {string} country - Country code (default 'ca' for Canada)
 * @returns {Promise<string[]>} Array of suggestion strings
 */
async function getAutocompleteSuggestions(query, country = 'ca') {
  try {
    const url = `http://suggestqueries.google.com/complete/search`;
    const config = buildRequestConfig();
    config.params = {
      client: 'firefox',
      q: query,
      gl: country,
    };

    const response = await axios.get(url, config);
    // Response format: [query, [suggestions...]]
    const data = response.data;
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1];
    }
    return [];
  } catch (err) {
    console.error(`[keywords] Autocomplete error for "${query}":`, err.message);
    return [];
  }
}


// ===========================================================================
// People Also Ask scraping
// ===========================================================================

/**
 * Scrape "People Also Ask" boxes from Google search results.
 * @param {string} query - Search query
 * @returns {Promise<Array<{question: string, snippet: string}>>}
 */
async function getPeopleAlsoAsk(query) {
  try {
    const url = `https://www.google.com/search`;
    const config = buildRequestConfig();
    config.params = {
      q: query,
      gl: 'ca',
      hl: 'en',
      num: 10,
    };

    const response = await axios.get(url, config);
    const $ = cheerio.load(response.data);
    const results = [];

    // PAA boxes are typically in divs with data-sgrd, jsname, or specific class patterns
    // The questions are often in <span> or <div> elements within expandable sections
    $('[data-sgrd] [role="button"], .related-question-pair [role="heading"], div[jsname] [data-q]').each((i, el) => {
      const question = $(el).text().trim();
      if (question && question.length > 10 && question.includes('?') || question.length > 15) {
        // Try to get the snippet from adjacent content
        const parent = $(el).closest('[data-sgrd], .related-question-pair, [jsname]');
        const snippet = parent.find('.LGOjhe, .wDYxhc, [data-attrid] span').first().text().trim();
        results.push({
          question: question.replace(/\s+/g, ' '),
          snippet: snippet ? snippet.substring(0, 300) : '',
        });
      }
    });

    // Fallback: look for common PAA patterns in the HTML
    if (results.length === 0) {
      $('div[data-q]').each((i, el) => {
        const question = $(el).attr('data-q') || $(el).text().trim();
        if (question && question.length > 10) {
          results.push({ question: question.replace(/\s+/g, ' '), snippet: '' });
        }
      });
    }

    // Second fallback: regex-based extraction for question patterns
    if (results.length === 0) {
      const html = response.data;
      const questionRegex = /(?:What|How|Why|When|Where|Which|Can|Do|Does|Is|Are|Should|Will)[^"<]{10,80}\?/g;
      const matches = html.match(questionRegex) || [];
      const seen = new Set();
      for (const match of matches) {
        const clean = match.replace(/\s+/g, ' ').trim();
        if (!seen.has(clean.toLowerCase())) {
          seen.add(clean.toLowerCase());
          results.push({ question: clean, snippet: '' });
        }
        if (results.length >= 10) break;
      }
    }

    // Deduplicate
    const seen = new Set();
    return results.filter((r) => {
      const key = r.question.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 15);
  } catch (err) {
    console.error(`[keywords] PAA scrape error for "${query}":`, err.message);
    return [];
  }
}


// ===========================================================================
// Related Searches
// ===========================================================================

/**
 * Scrape "Related searches" from the bottom of Google SERP.
 * @param {string} query - Search query
 * @returns {Promise<string[]>} Array of related search strings
 */
async function getRelatedSearches(query) {
  try {
    const url = `https://www.google.com/search`;
    const config = buildRequestConfig();
    config.params = {
      q: query,
      gl: 'ca',
      hl: 'en',
      num: 10,
    };

    const response = await axios.get(url, config);
    const $ = cheerio.load(response.data);
    const results = [];

    // Related searches are typically in the bottom section
    // They use various selectors depending on Google's current layout
    $('a.k8XOCe, div.s75CSd a, .brs_col a, a.EIaa9b, [data-ved] .s75CSd').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 3 && text.length < 100) {
        results.push(text);
      }
    });

    // Fallback: look for "Searches related to" section
    if (results.length === 0) {
      $('#brs a, .card-section a, .oIk2Cb a').each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 3 && text.length < 100) {
          results.push(text);
        }
      });
    }

    // Deduplicate and return
    return [...new Set(results)].slice(0, 15);
  } catch (err) {
    console.error(`[keywords] Related searches error for "${query}":`, err.message);
    return [];
  }
}


// ===========================================================================
// DataForSEO API integration
// ===========================================================================

/**
 * Get keyword volume/CPC data from DataForSEO, or return estimates if no API key.
 * @param {string[]} keywords - Array of keywords to research
 * @param {string|null} apiKey - DataForSEO API key (base64 "login:password")
 * @param {string} location - Target location (default 'Canada')
 * @returns {Promise<Array<{keyword: string, searchVolume: number, cpc: number, competition: number, trend: number[]}>>}
 */
async function getKeywordData(keywords, apiKey, location = 'Canada') {
  // Map location names to DataForSEO location codes
  const locationCodes = {
    'Canada': 2124,
    'United States': 2840,
    'Toronto': 9000973,
    'Vancouver': 9001040,
    'Montreal': 9000936,
  };

  if (apiKey) {
    try {
      const response = await axios.post(
        'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
        [{
          keywords: keywords.slice(0, 100), // API limit
          location_code: locationCodes[location] || 2124,
          language_code: 'en',
        }],
        {
          headers: {
            'Authorization': `Basic ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const tasks = response.data?.tasks || [];
      const results = [];

      for (const task of tasks) {
        const items = task?.result || [];
        for (const item of items) {
          results.push({
            keyword: item.keyword,
            searchVolume: item.search_volume || 0,
            cpc: item.cpc || 0,
            competition: item.competition || 0,
            competitionLevel: item.competition_level || 'UNKNOWN',
            trend: (item.monthly_searches || []).map((m) => m.search_volume),
          });
        }
      }

      return results;
    } catch (err) {
      console.error(`[keywords] DataForSEO API error:`, err.message);
      // Fall through to estimates
    }
  }

  // No API key or API failed - return rough estimates based on keyword characteristics
  return keywords.map((kw) => {
    const words = kw.split(/\s+/).length;
    const hasLocal = /toronto|vancouver|montreal|calgary|ottawa/i.test(kw);
    const hasQuestion = /^(how|what|why|when|where|which|can|do|does|is|are|should)/i.test(kw);

    // Rough heuristic estimates (better than nothing, not real data)
    let estimatedVolume = 500;
    if (words === 1) estimatedVolume = 5000;
    else if (words === 2) estimatedVolume = 2000;
    else if (words === 3) estimatedVolume = 800;
    else if (words >= 4) estimatedVolume = 300;

    if (hasLocal) estimatedVolume = Math.round(estimatedVolume * 0.3);
    if (hasQuestion) estimatedVolume = Math.round(estimatedVolume * 0.6);

    const estimatedCpc = hasLocal ? 1.5 + Math.random() * 3 : 0.5 + Math.random() * 2;

    return {
      keyword: kw,
      searchVolume: estimatedVolume,
      cpc: Math.round(estimatedCpc * 100) / 100,
      competition: Math.random() * 0.7,
      competitionLevel: 'ESTIMATED',
      trend: Array(12).fill(estimatedVolume).map((v) => Math.round(v * (0.8 + Math.random() * 0.4))),
      isEstimate: true,
    };
  });
}


// ===========================================================================
// Blog Topic Generation
// ===========================================================================

/**
 * Generate blog topic suggestions by combining autocomplete, PAA, and related searches.
 * Filters for question-type and high-intent queries suited to blog posts.
 * @param {string} keyword - Base product keyword
 * @param {string} niche - Product niche
 * @returns {Promise<Array<{title: string, keyword: string, type: string, estimatedVolume: string, productMapping: string}>>}
 */
async function generateBlogTopics(keyword, niche) {
  // Gather raw keyword ideas from multiple sources in parallel
  const [autocomplete, autocompleteHow, autocompleteBest, paa, related] = await Promise.all([
    getAutocompleteSuggestions(keyword, 'ca'),
    getAutocompleteSuggestions(`how to ${keyword}`, 'ca'),
    getAutocompleteSuggestions(`best ${keyword}`, 'ca'),
    getPeopleAlsoAsk(keyword),
    getRelatedSearches(keyword),
  ]);

  const allKeywords = new Set();
  const topics = [];

  // Helper: classify a query into a blog post type
  function classifyQuery(q) {
    const lower = q.toLowerCase();
    if (/^how to|^how do|step.by.step|diy|guide to/i.test(lower)) return 'how-to';
    if (/^best |top \d|^\d+ best/i.test(lower)) return 'listicle';
    if (/\bvs\.?\b|\bversus\b|\bcompare|\bcomparison\b|\bor\b.*\bor\b/i.test(lower)) return 'comparison';
    if (/\btips\b|\badvice\b|\btricks\b|\bhacks\b/i.test(lower)) return 'listicle';
    if (/^what is|^what are|^why |^when |explained|definition/i.test(lower)) return 'guide';
    if (/^can |^do |^does |^is |^should /i.test(lower)) return 'guide';
    if (/review|worth|honest|experience/i.test(lower)) return 'review';
    if (/template|printable|download|free/i.test(lower)) return 'resource';
    return 'guide';
  }

  // Helper: estimate relative volume category
  function estimateVolume(type, wordCount) {
    if (wordCount <= 2) return 'high';
    if (wordCount === 3) return 'medium';
    if (type === 'how-to' || type === 'listicle') return 'medium';
    return 'low';
  }

  // Helper: map a topic to a digital product it could sell
  function mapToProduct(q, nicheStr) {
    const lower = q.toLowerCase();
    if (/template|printable|worksheet|planner/i.test(lower)) return `${nicheStr} template or printable`;
    if (/guide|tutorial|course|learn/i.test(lower)) return `${nicheStr} eBook or course`;
    if (/checklist|cheat sheet|list/i.test(lower)) return `${nicheStr} checklist PDF`;
    if (/spreadsheet|tracker|budget/i.test(lower)) return `${nicheStr} spreadsheet template`;
    if (/social media|instagram|tiktok/i.test(lower)) return `${nicheStr} social media template pack`;
    return `${nicheStr} digital product bundle`;
  }

  // Process autocomplete suggestions
  for (const suggestion of [...autocomplete, ...autocompleteHow, ...autocompleteBest]) {
    const key = suggestion.toLowerCase().trim();
    if (allKeywords.has(key)) continue;
    allKeywords.add(key);

    const type = classifyQuery(suggestion);
    const wordCount = suggestion.split(/\s+/).length;
    topics.push({
      title: formatBlogTitle(suggestion, type),
      keyword: suggestion,
      type,
      estimatedVolume: estimateVolume(type, wordCount),
      productMapping: mapToProduct(suggestion, niche),
      source: 'autocomplete',
    });
  }

  // Process PAA questions
  for (const paaItem of paa) {
    const key = paaItem.question.toLowerCase().trim();
    if (allKeywords.has(key)) continue;
    allKeywords.add(key);

    const type = classifyQuery(paaItem.question);
    topics.push({
      title: formatBlogTitle(paaItem.question, type),
      keyword: paaItem.question,
      type,
      estimatedVolume: 'medium',
      productMapping: mapToProduct(paaItem.question, niche),
      source: 'paa',
      snippet: paaItem.snippet || '',
    });
  }

  // Process related searches
  for (const rel of related) {
    const key = rel.toLowerCase().trim();
    if (allKeywords.has(key)) continue;
    allKeywords.add(key);

    const type = classifyQuery(rel);
    const wordCount = rel.split(/\s+/).length;
    topics.push({
      title: formatBlogTitle(rel, type),
      keyword: rel,
      type,
      estimatedVolume: estimateVolume(type, wordCount),
      productMapping: mapToProduct(rel, niche),
      source: 'related',
    });
  }

  // Sort by relevance: how-to and listicle first, then by estimated volume
  const typePriority = { 'how-to': 1, 'listicle': 2, 'comparison': 3, 'resource': 4, 'guide': 5, 'review': 6 };
  const volumePriority = { high: 1, medium: 2, low: 3 };

  topics.sort((a, b) => {
    const volDiff = (volumePriority[a.estimatedVolume] || 3) - (volumePriority[b.estimatedVolume] || 3);
    if (volDiff !== 0) return volDiff;
    return (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
  });

  return topics.slice(0, 40);
}

/**
 * Format a raw keyword into a proper blog title.
 */
function formatBlogTitle(keyword, type) {
  const clean = keyword.replace(/\?$/, '').trim();
  const capitalized = clean.replace(/\b\w/g, (c) => c.toUpperCase());

  switch (type) {
    case 'how-to':
      return clean.toLowerCase().startsWith('how') ? capitalized : `How to ${capitalized}`;
    case 'listicle':
      return clean.match(/^\d/) ? capitalized : `Best ${capitalized} in 2025`;
    case 'comparison':
      return `${capitalized}: A Complete Comparison`;
    case 'review':
      return `${capitalized}: Honest Review`;
    case 'resource':
      return `Free ${capitalized} Download`;
    case 'guide':
    default:
      if (clean.toLowerCase().startsWith('what') || clean.toLowerCase().startsWith('why')) {
        return `${capitalized}? Everything You Need to Know`;
      }
      return `The Complete Guide to ${capitalized}`;
  }
}


// ===========================================================================
// Google My Business category suggestions
// ===========================================================================

/**
 * GMB category mapping: niche keyword -> best GMB categories.
 * Category IDs are Google's official Place Type / GMB category identifiers.
 */
const GMB_CATEGORY_MAP = {
  'wedding planning': [
    { name: 'Wedding Planner', id: 'gcid:wedding_planner', relevance: 'primary' },
    { name: 'Event Planner', id: 'gcid:event_planner', relevance: 'secondary' },
    { name: 'Bridal Shop', id: 'gcid:bridal_shop', relevance: 'secondary' },
  ],
  'startup kits': [
    { name: 'Business Consultant', id: 'gcid:business_consultant', relevance: 'primary' },
    { name: 'Management Consultant', id: 'gcid:management_consultant', relevance: 'secondary' },
    { name: 'Business Broker', id: 'gcid:business_broker', relevance: 'secondary' },
  ],
  'resume': [
    { name: 'Career Counselor', id: 'gcid:career_counselor', relevance: 'primary' },
    { name: 'Employment Agency', id: 'gcid:employment_agency', relevance: 'secondary' },
    { name: 'Resume Service', id: 'gcid:resume_service', relevance: 'secondary' },
  ],
  'career': [
    { name: 'Career Counselor', id: 'gcid:career_counselor', relevance: 'primary' },
    { name: 'Employment Agency', id: 'gcid:employment_agency', relevance: 'secondary' },
    { name: 'Resume Service', id: 'gcid:resume_service', relevance: 'secondary' },
  ],
  'personal finance': [
    { name: 'Financial Planner', id: 'gcid:financial_planner', relevance: 'primary' },
    { name: 'Accountant', id: 'gcid:accountant', relevance: 'secondary' },
    { name: 'Tax Preparation Service', id: 'gcid:tax_preparation_service', relevance: 'secondary' },
  ],
  'meal planning': [
    { name: 'Nutritionist', id: 'gcid:nutritionist', relevance: 'primary' },
    { name: 'Dietitian', id: 'gcid:dietitian', relevance: 'secondary' },
    { name: 'Health Consultant', id: 'gcid:health_consultant', relevance: 'secondary' },
  ],
  'fitness': [
    { name: 'Personal Trainer', id: 'gcid:personal_trainer', relevance: 'primary' },
    { name: 'Fitness Center', id: 'gcid:fitness_center', relevance: 'secondary' },
    { name: 'Gym', id: 'gcid:gym', relevance: 'secondary' },
  ],
  'workout': [
    { name: 'Personal Trainer', id: 'gcid:personal_trainer', relevance: 'primary' },
    { name: 'Fitness Center', id: 'gcid:fitness_center', relevance: 'secondary' },
    { name: 'Gym', id: 'gcid:gym', relevance: 'secondary' },
  ],
  'home organization': [
    { name: 'Home Goods Store', id: 'gcid:home_goods_store', relevance: 'primary' },
    { name: 'Interior Designer', id: 'gcid:interior_designer', relevance: 'secondary' },
    { name: 'Organizing Service', id: 'gcid:organizing_service', relevance: 'secondary' },
  ],
  'parenting': [
    { name: 'Baby Store', id: 'gcid:baby_store', relevance: 'primary' },
    { name: 'Parenting Coach', id: 'gcid:parenting_coach', relevance: 'secondary' },
    { name: 'Childcare Service', id: 'gcid:childcare_service', relevance: 'secondary' },
  ],
  'baby': [
    { name: 'Baby Store', id: 'gcid:baby_store', relevance: 'primary' },
    { name: 'Parenting Coach', id: 'gcid:parenting_coach', relevance: 'secondary' },
    { name: 'Childcare Service', id: 'gcid:childcare_service', relevance: 'secondary' },
  ],
  'event planning': [
    { name: 'Event Planner', id: 'gcid:event_planner', relevance: 'primary' },
    { name: 'Party Supply Store', id: 'gcid:party_supply_store', relevance: 'secondary' },
    { name: 'Catering Service', id: 'gcid:catering_service', relevance: 'secondary' },
  ],
  'social media': [
    { name: 'Marketing Agency', id: 'gcid:marketing_agency', relevance: 'primary' },
    { name: 'Social Media Consultant', id: 'gcid:social_media_consultant', relevance: 'secondary' },
    { name: 'Digital Marketing Agency', id: 'gcid:digital_marketing_agency', relevance: 'secondary' },
  ],
  'pet care': [
    { name: 'Pet Store', id: 'gcid:pet_store', relevance: 'primary' },
    { name: 'Pet Groomer', id: 'gcid:pet_groomer', relevance: 'secondary' },
    { name: 'Veterinarian', id: 'gcid:veterinarian', relevance: 'secondary' },
  ],
  'real estate': [
    { name: 'Real Estate Agency', id: 'gcid:real_estate_agency', relevance: 'primary' },
    { name: 'Property Management Company', id: 'gcid:property_management_company', relevance: 'secondary' },
    { name: 'Real Estate Consultant', id: 'gcid:real_estate_consultant', relevance: 'secondary' },
  ],
  'education': [
    { name: 'Educational Consultant', id: 'gcid:educational_consultant', relevance: 'primary' },
    { name: 'Tutoring Service', id: 'gcid:tutoring_service', relevance: 'secondary' },
    { name: 'Training Centre', id: 'gcid:training_centre', relevance: 'secondary' },
  ],
  'photography': [
    { name: 'Photographer', id: 'gcid:photographer', relevance: 'primary' },
    { name: 'Photography Studio', id: 'gcid:photography_studio', relevance: 'secondary' },
    { name: 'Photography Service', id: 'gcid:photography_service', relevance: 'secondary' },
  ],
  'graphic design': [
    { name: 'Graphic Designer', id: 'gcid:graphic_designer', relevance: 'primary' },
    { name: 'Design Agency', id: 'gcid:design_agency', relevance: 'secondary' },
    { name: 'Print Shop', id: 'gcid:print_shop', relevance: 'secondary' },
  ],
  'mental health': [
    { name: 'Mental Health Service', id: 'gcid:mental_health_service', relevance: 'primary' },
    { name: 'Counselor', id: 'gcid:counselor', relevance: 'secondary' },
    { name: 'Life Coach', id: 'gcid:life_coach', relevance: 'secondary' },
  ],
  'gardening': [
    { name: 'Garden Center', id: 'gcid:garden_center', relevance: 'primary' },
    { name: 'Landscaper', id: 'gcid:landscaper', relevance: 'secondary' },
    { name: 'Plant Nursery', id: 'gcid:plant_nursery', relevance: 'secondary' },
  ],
  'cooking': [
    { name: 'Cooking School', id: 'gcid:cooking_school', relevance: 'primary' },
    { name: 'Caterer', id: 'gcid:caterer', relevance: 'secondary' },
    { name: 'Food Consultant', id: 'gcid:food_consultant', relevance: 'secondary' },
  ],
  'beauty': [
    { name: 'Beauty Salon', id: 'gcid:beauty_salon', relevance: 'primary' },
    { name: 'Cosmetics Store', id: 'gcid:cosmetics_store', relevance: 'secondary' },
    { name: 'Skin Care Clinic', id: 'gcid:skin_care_clinic', relevance: 'secondary' },
  ],
  'music': [
    { name: 'Music School', id: 'gcid:music_school', relevance: 'primary' },
    { name: 'Music Store', id: 'gcid:music_store', relevance: 'secondary' },
    { name: 'Music Producer', id: 'gcid:music_producer', relevance: 'secondary' },
  ],
  'travel': [
    { name: 'Travel Agency', id: 'gcid:travel_agency', relevance: 'primary' },
    { name: 'Tour Operator', id: 'gcid:tour_operator', relevance: 'secondary' },
    { name: 'Travel Consultant', id: 'gcid:travel_consultant', relevance: 'secondary' },
  ],
  'productivity': [
    { name: 'Business Consultant', id: 'gcid:business_consultant', relevance: 'primary' },
    { name: 'Life Coach', id: 'gcid:life_coach', relevance: 'secondary' },
    { name: 'Training Centre', id: 'gcid:training_centre', relevance: 'secondary' },
  ],
  'crafts': [
    { name: 'Arts & Crafts Store', id: 'gcid:arts_and_crafts_store', relevance: 'primary' },
    { name: 'Art School', id: 'gcid:art_school', relevance: 'secondary' },
    { name: 'Craft Supply Store', id: 'gcid:craft_supply_store', relevance: 'secondary' },
  ],
};

/**
 * Suggest GMB categories for a given niche.
 * @param {string} niche - Niche keyword
 * @returns {Array<{name: string, id: string, relevance: string}>}
 */
function suggestGMBCategories(niche) {
  if (!niche) return [];

  const lower = niche.toLowerCase().trim();

  // Direct match
  if (GMB_CATEGORY_MAP[lower]) {
    return GMB_CATEGORY_MAP[lower];
  }

  // Partial match - find the best fitting niche key
  for (const [key, categories] of Object.entries(GMB_CATEGORY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return categories;
    }
  }

  // Check individual words against niche keys
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    for (const [key, categories] of Object.entries(GMB_CATEGORY_MAP)) {
      if (key.includes(word)) {
        return categories;
      }
    }
  }

  // Fallback: generic digital product categories
  return [
    { name: 'Internet Marketing Service', id: 'gcid:internet_marketing_service', relevance: 'primary' },
    { name: 'Business Consultant', id: 'gcid:business_consultant', relevance: 'secondary' },
    { name: 'E-Commerce Service', id: 'gcid:e_commerce_service', relevance: 'secondary' },
  ];
}


module.exports = {
  getAutocompleteSuggestions,
  getPeopleAlsoAsk,
  getRelatedSearches,
  getKeywordData,
  generateBlogTopics,
  suggestGMBCategories,
  USER_AGENTS,
  getRandomUserAgent,
};
