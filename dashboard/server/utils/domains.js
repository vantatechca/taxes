// ===========================================================================
// domains.js - Domain availability checking utility
// Generates domain suggestions for keyword+city combinations and checks
// availability via DNS lookups. Supports the 50 Canadian cities strategy.
// ===========================================================================

const dns = require('dns').promises;

// ---- 50 Canadian target cities (lowercase, no spaces, for domain names) ----
const CITIES = [
  'toronto', 'montreal', 'vancouver', 'calgary', 'edmonton',
  'ottawa', 'winnipeg', 'mississauga', 'brampton', 'hamilton',
  'surrey', 'laval', 'halifax', 'london', 'markham',
  'vaughan', 'gatineau', 'saskatoon', 'kitchener', 'burnaby',
  'windsor', 'regina', 'richmond', 'richmondhill', 'oakville',
  'burlington', 'oshawa', 'barrie', 'stcatharines', 'cambridge',
  'kingston', 'guelph', 'thunderbay', 'waterloo', 'kelowna',
  'brantford', 'nanaimo', 'lethbridge', 'reddeer', 'kamloops',
  'fredericton', 'chilliwack', 'peterborough', 'saultstemarie', 'sarnia',
  'niagarafalls', 'moncton', 'pickering', 'saintjohn', 'victoria',
];

// ---- City display names for UI ----
const CITY_NAMES = {
  toronto: 'Toronto',
  montreal: 'Montreal',
  vancouver: 'Vancouver',
  calgary: 'Calgary',
  edmonton: 'Edmonton',
  ottawa: 'Ottawa',
  winnipeg: 'Winnipeg',
  mississauga: 'Mississauga',
  brampton: 'Brampton',
  hamilton: 'Hamilton',
  surrey: 'Surrey',
  laval: 'Laval',
  halifax: 'Halifax',
  london: 'London',
  markham: 'Markham',
  vaughan: 'Vaughan',
  gatineau: 'Gatineau',
  saskatoon: 'Saskatoon',
  kitchener: 'Kitchener',
  burnaby: 'Burnaby',
  windsor: 'Windsor',
  regina: 'Regina',
  richmond: 'Richmond',
  richmondhill: 'Richmond Hill',
  oakville: 'Oakville',
  burlington: 'Burlington',
  oshawa: 'Oshawa',
  barrie: 'Barrie',
  stcatharines: 'St. Catharines',
  cambridge: 'Cambridge',
  kingston: 'Kingston',
  guelph: 'Guelph',
  thunderbay: 'Thunder Bay',
  waterloo: 'Waterloo',
  kelowna: 'Kelowna',
  brantford: 'Brantford',
  nanaimo: 'Nanaimo',
  lethbridge: 'Lethbridge',
  reddeer: 'Red Deer',
  kamloops: 'Kamloops',
  fredericton: 'Fredericton',
  chilliwack: 'Chilliwack',
  peterborough: 'Peterborough',
  saultstemarie: 'Sault Ste. Marie',
  sarnia: 'Sarnia',
  niagarafalls: 'Niagara Falls',
  moncton: 'Moncton',
  pickering: 'Pickering',
  saintjohn: 'Saint John',
  victoria: 'Victoria',
};


// ===========================================================================
// Domain Suggestion Generation
// ===========================================================================

/**
 * Clean a string for use in a domain name.
 * Removes spaces, special chars, lowercases everything.
 */
function cleanForDomain(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate domain suggestions for a keyword across all target cities.
 * Follows the priority system: keyword+city > city+keyword > keyword-city
 *
 * @param {string} keyword - Product keyword (e.g., "wedding planner")
 * @param {string[]} cities - Array of city slugs (defaults to all 50)
 * @returns {Array<{domain: string, city: string, cityName: string, format: string, priority: number, tld: string}>}
 */
function generateDomainSuggestions(keyword, cities = CITIES) {
  const cleanKeyword = cleanForDomain(keyword);
  if (!cleanKeyword) return [];

  const suggestions = [];

  for (const city of cities) {
    const cleanCity = cleanForDomain(city);
    const cityName = CITY_NAMES[city] || city;

    // Priority 1: keyword+city.com and keyword+city.ca
    suggestions.push({
      domain: `${cleanKeyword}${cleanCity}.com`,
      city,
      cityName,
      format: 'keyword+city',
      priority: 1,
      tld: '.com',
    });
    suggestions.push({
      domain: `${cleanKeyword}${cleanCity}.ca`,
      city,
      cityName,
      format: 'keyword+city',
      priority: 1,
      tld: '.ca',
    });

    // Priority 2: city+keyword.com and city+keyword.ca
    suggestions.push({
      domain: `${cleanCity}${cleanKeyword}.com`,
      city,
      cityName,
      format: 'city+keyword',
      priority: 2,
      tld: '.com',
    });
    suggestions.push({
      domain: `${cleanCity}${cleanKeyword}.ca`,
      city,
      cityName,
      format: 'city+keyword',
      priority: 2,
      tld: '.ca',
    });

    // Priority 3: keyword-city.com and keyword-city.ca (hyphenated)
    suggestions.push({
      domain: `${cleanKeyword}-${cleanCity}.com`,
      city,
      cityName,
      format: 'keyword-city (hyphenated)',
      priority: 3,
      tld: '.com',
    });
    suggestions.push({
      domain: `${cleanKeyword}-${cleanCity}.ca`,
      city,
      cityName,
      format: 'keyword-city (hyphenated)',
      priority: 3,
      tld: '.ca',
    });
  }

  // Sort by priority, then by city order (preserves geographic ordering)
  suggestions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const cityIndexA = cities.indexOf(a.city);
    const cityIndexB = cities.indexOf(b.city);
    return cityIndexA - cityIndexB;
  });

  return suggestions;
}


// ===========================================================================
// Domain Availability Checking (DNS-based)
// ===========================================================================

/**
 * Check a single domain's availability using DNS resolution.
 * If DNS fails with ENOTFOUND or ENODATA, the domain is likely available.
 * This is fast and free but not 100% accurate (parked domains register DNS).
 *
 * @param {string} domain - Full domain name (e.g., "weddingplannertoronto.com")
 * @returns {Promise<{domain: string, available: boolean, method: string, error?: string}>}
 */
async function checkDomainAvailability(domain) {
  try {
    // Try resolving A records first (fastest signal)
    await dns.resolve(domain, 'A');
    // If it resolves, the domain has DNS records -> taken
    return { domain, available: false, method: 'dns' };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      // No DNS records found - domain is likely available
      return { domain, available: true, method: 'dns' };
    }
    if (err.code === 'SERVFAIL' || err.code === 'REFUSED') {
      // DNS server error - inconclusive, mark as unknown
      return { domain, available: null, method: 'dns', error: `DNS error: ${err.code}` };
    }
    // Other errors - treat as inconclusive
    return { domain, available: null, method: 'dns', error: err.message };
  }
}

/**
 * Process items in batches with concurrency control.
 * @param {Array} items - Items to process
 * @param {Function} fn - Async function to call on each item
 * @param {number} concurrency - Max concurrent operations
 * @returns {Promise<Array>} Results array
 */
async function processInBatches(items, fn, concurrency) {
  const results = [];
  const pending = [];

  for (let i = 0; i < items.length; i++) {
    const promise = fn(items[i]).then((result) => {
      results.push(result);
    });

    pending.push(promise);

    // When we hit the concurrency limit, wait for one to finish
    if (pending.length >= concurrency) {
      await Promise.race(pending);
      // Remove resolved promises
      for (let j = pending.length - 1; j >= 0; j--) {
        // Check if promise is settled by racing with an immediate resolve
        const settled = await Promise.race([
          pending[j].then(() => true).catch(() => true),
          Promise.resolve(false),
        ]);
        if (settled) {
          pending.splice(j, 1);
        }
      }
    }
  }

  // Wait for remaining
  await Promise.allSettled(pending);
  return results;
}

/**
 * Batch check domain availability for a keyword across cities.
 * Generates domain suggestions then checks each one with controlled concurrency.
 *
 * @param {string} keyword - Product keyword
 * @param {string[]} cities - City slugs to check (defaults to all 50)
 * @param {string[]} tlds - TLD extensions to check (defaults to ['.com', '.ca'])
 * @param {number} concurrency - Max concurrent DNS lookups (defaults to 5)
 * @returns {Promise<{keyword: string, results: Array, summary: {total: number, available: number, taken: number, unknown: number}}>}
 */
async function batchCheckDomains(keyword, cities = CITIES, tlds = ['.com', '.ca'], concurrency = 5) {
  // Generate all suggestions
  let suggestions = generateDomainSuggestions(keyword, cities);

  // Filter by requested TLDs
  if (tlds && tlds.length > 0) {
    suggestions = suggestions.filter((s) => tlds.includes(s.tld));
  }

  console.log(`[domains] Batch checking ${suggestions.length} domains for "${keyword}" (concurrency: ${concurrency})`);

  // Check availability in controlled batches
  const results = [];
  const batchSize = concurrency;

  for (let i = 0; i < suggestions.length; i += batchSize) {
    const batch = suggestions.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (suggestion) => {
        const check = await checkDomainAvailability(suggestion.domain);
        return {
          ...suggestion,
          available: check.available,
          method: check.method,
          error: check.error || null,
        };
      })
    );

    results.push(...batchResults);

    // Small delay between batches to avoid DNS throttling
    if (i + batchSize < suggestions.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Compute summary
  const available = results.filter((r) => r.available === true).length;
  const taken = results.filter((r) => r.available === false).length;
  const unknown = results.filter((r) => r.available === null).length;

  // Sort: available first, then by priority
  results.sort((a, b) => {
    // Available domains first
    if (a.available === true && b.available !== true) return -1;
    if (a.available !== true && b.available === true) return 1;
    // Then by priority
    return a.priority - b.priority;
  });

  return {
    keyword,
    results,
    summary: {
      total: results.length,
      available,
      taken,
      unknown,
      availabilityRate: results.length > 0 ? Math.round((available / results.length) * 100) : 0,
    },
  };
}


module.exports = {
  CITIES,
  CITY_NAMES,
  cleanForDomain,
  generateDomainSuggestions,
  checkDomainAvailability,
  batchCheckDomains,
};
