// ===========================================================================
// etsy.js - Etsy scraper
// Scrapes Etsy search results, shop pages, and individual product listings
// using proxies and randomized User-Agents for stealth.
// ===========================================================================

const axios = require('axios');
const cheerio = require('cheerio');
const { getNextProxy, createProxyAgent, markProxyFailed } = require('../utils/proxy');

// ---- Realistic User-Agent list (Chrome + Firefox, Win/Mac/Linux) ----
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
];

/**
 * Get a random User-Agent string.
 */
function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Sleep for a random duration between min and max milliseconds.
 */
function randomDelay(minMs = 2000, maxMs = 5000) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make an HTTP GET request through a proxy with a random UA.
 * Falls back to direct request if no proxies are available.
 */
async function fetchPage(url) {
  const proxyUrl = getNextProxy();
  const headers = {
    'User-Agent': randomUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  };

  const config = { headers, timeout: 30000 };

  if (proxyUrl) {
    try {
      const agent = createProxyAgent(proxyUrl);
      config.httpAgent = agent;
      config.httpsAgent = agent;
      const response = await axios.get(url, config);
      return response.data;
    } catch (err) {
      console.warn(`[etsy] Proxy ${proxyUrl} failed for ${url}: ${err.message}`);
      markProxyFailed(proxyUrl);
      // Try direct as fallback
      try {
        delete config.httpAgent;
        delete config.httpsAgent;
        const response = await axios.get(url, config);
        return response.data;
      } catch (directErr) {
        console.error(`[etsy] Direct request also failed for ${url}: ${directErr.message}`);
        throw directErr;
      }
    }
  }

  // No proxy available - direct request
  const response = await axios.get(url, config);
  return response.data;
}

/**
 * Search Etsy for digital products matching a query.
 *
 * @param {string} query - Search keywords
 * @param {Object} options - { pages: 1-5 }
 * @returns {Array} Array of product objects
 */
async function searchEtsy(query, options = {}) {
  const maxPages = Math.min(options.pages || 1, 5);
  const allProducts = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      // Build Etsy search URL with digital item filter
      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.etsy.com/search?q=${encodedQuery}&explicit=1&item_type=digital&page=${page}`;

      console.log(`[etsy] Searching page ${page}/${maxPages}: ${query}`);

      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      // Parse search result listings
      // Etsy uses data attributes and structured listing cards
      $('[data-listing-id]').each((i, el) => {
        try {
          const $el = $(el);
          const listingId = $el.attr('data-listing-id');

          // Title
          const title = $el.find('h3').first().text().trim()
            || $el.find('[class*="title"]').first().text().trim()
            || $el.find('a[title]').first().attr('title')
            || '';

          // Price
          const priceText = $el.find('[class*="price"]').first().text().trim()
            || $el.find('span.currency-value').first().text().trim()
            || '';
          const priceMatch = priceText.match(/[\d,.]+/);
          const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;

          // Currency
          const currencyMatch = priceText.match(/([A-Z]{3}|\$|€|£)/);
          const currency = currencyMatch ? currencyMatch[1] : 'USD';

          // Reviews count
          const reviewsText = $el.find('[class*="review"]').text().trim()
            || $el.find('[aria-label*="review"]').attr('aria-label')
            || '';
          const reviewsMatch = reviewsText.match(/([\d,]+)/);
          const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(',', ''), 10) : 0;

          // Shop name
          const shopName = $el.find('[class*="shop-name"]').text().trim()
            || $el.find('p[class*="shop"]').text().trim()
            || '';

          // Listing URL
          const listingLink = $el.find('a[href*="/listing/"]').first().attr('href') || '';
          const listingUrl = listingLink.startsWith('http')
            ? listingLink.split('?')[0]
            : listingLink ? `https://www.etsy.com${listingLink.split('?')[0]}` : '';

          // Image URL
          const imageUrl = $el.find('img').first().attr('src')
            || $el.find('img').first().attr('data-src')
            || '';

          if (title || listingId) {
            allProducts.push({
              id: `etsy-${listingId || Date.now()}-${i}`,
              listingId,
              title: title || 'Untitled',
              price,
              currency,
              reviews,
              shopName,
              listingUrl,
              imageUrl,
              query,
              page,
              isDigital: true,
              scrapedAt: new Date().toISOString(),
            });
          }
        } catch (parseErr) {
          // Skip individual parse failures
          console.warn(`[etsy] Failed to parse listing ${i}:`, parseErr.message);
        }
      });

      // If no listings found via data-listing-id, try alternative selectors
      if (allProducts.length === 0 && page === 1) {
        $('a[href*="/listing/"]').each((i, el) => {
          try {
            const $el = $(el);
            const href = $el.attr('href') || '';
            const title = $el.attr('title') || $el.text().trim().substring(0, 200);
            const listingMatch = href.match(/\/listing\/(\d+)/);
            const listingId = listingMatch ? listingMatch[1] : null;

            if (listingId && title && !allProducts.find((p) => p.listingId === listingId)) {
              allProducts.push({
                id: `etsy-${listingId}`,
                listingId,
                title,
                price: 0,
                currency: 'USD',
                reviews: 0,
                shopName: '',
                listingUrl: `https://www.etsy.com/listing/${listingId}`,
                imageUrl: '',
                query,
                page,
                isDigital: true,
                scrapedAt: new Date().toISOString(),
              });
            }
          } catch (e) {
            // Skip
          }
        });
      }

      console.log(`[etsy] Page ${page}: found ${allProducts.length} products so far`);

      // Random delay between pages
      if (page < maxPages) {
        await randomDelay(2000, 5000);
      }
    } catch (pageErr) {
      console.error(`[etsy] Failed to scrape page ${page}:`, pageErr.message);
      // Continue to next page instead of crashing
    }
  }

  return allProducts;
}

/**
 * Deep-scrape an Etsy shop page.
 *
 * @param {string} shopUrl - Full Etsy shop URL (e.g., https://www.etsy.com/shop/ShopName)
 * @returns {Object} Shop data with products
 */
async function scrapeShop(shopUrl) {
  const shopData = {
    url: shopUrl,
    name: '',
    totalSales: 0,
    memberSince: '',
    location: '',
    sections: [],
    products: [],
    scrapedAt: new Date().toISOString(),
  };

  try {
    // Scrape the main shop page
    const html = await fetchPage(shopUrl);
    const $ = cheerio.load(html);

    // Shop name
    shopData.name = $('h1').first().text().trim()
      || $('[class*="shop-name"]').first().text().trim()
      || shopUrl.split('/shop/')[1] || 'Unknown';

    // Total sales
    const salesText = $('[class*="sales"]').text().trim()
      || $('span:contains("sales")').first().text().trim()
      || '';
    const salesMatch = salesText.match(/([\d,]+)\s*sales/i);
    shopData.totalSales = salesMatch ? parseInt(salesMatch[1].replace(',', ''), 10) : 0;

    // Member since
    const memberText = $('[class*="member-since"]').text().trim()
      || $('span:contains("member since")').parent().text().trim()
      || '';
    const memberMatch = memberText.match(/since\s+(.+)/i);
    shopData.memberSince = memberMatch ? memberMatch[1].trim() : '';

    // Location
    shopData.location = $('[class*="location"]').first().text().trim() || '';

    // Shop sections
    $('[class*="section"] a, [data-section-id]').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100) {
        shopData.sections.push(text);
      }
    });
    // Deduplicate sections
    shopData.sections = [...new Set(shopData.sections)];

    // Scrape listings from the shop (up to 3 pages)
    for (let page = 1; page <= 3; page++) {
      try {
        const pageUrl = page === 1 ? shopUrl : `${shopUrl}?page=${page}`;
        const pageHtml = page === 1 ? html : await fetchPage(pageUrl);
        const $page = page === 1 ? $ : cheerio.load(pageHtml);

        $page('[data-listing-id], [class*="listing-link"]').each((i, el) => {
          try {
            const $el = $page(el);
            const listingId = $el.attr('data-listing-id')
              || ($el.attr('href') || '').match(/\/listing\/(\d+)/)?.[1]
              || '';

            const title = $el.find('h3, [class*="title"]').first().text().trim()
              || $el.attr('title')
              || '';

            const priceText = $el.find('[class*="price"]').first().text().trim() || '';
            const priceMatch = priceText.match(/[\d,.]+/);
            const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;

            const reviewsText = $el.find('[class*="review"]').text().trim() || '';
            const reviewsMatch = reviewsText.match(/([\d,]+)/);
            const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(',', ''), 10) : 0;

            const favoritesText = $el.find('[class*="favorite"]').text().trim() || '';
            const favMatch = favoritesText.match(/([\d,]+)/);
            const favorites = favMatch ? parseInt(favMatch[1].replace(',', ''), 10) : 0;

            const href = $el.attr('href') || $el.find('a').first().attr('href') || '';
            const listingUrl = href.startsWith('http') ? href.split('?')[0] : `https://www.etsy.com${href.split('?')[0]}`;

            if (title || listingId) {
              shopData.products.push({
                listingId,
                title: title || 'Untitled',
                price,
                reviews,
                favorites,
                listingUrl,
              });
            }
          } catch (e) {
            // Skip individual listing parse errors
          }
        });

        if (page < 3) await randomDelay(2000, 4000);
      } catch (pageErr) {
        console.warn(`[etsy] Shop page ${page} failed:`, pageErr.message);
        break;
      }
    }

    // Deduplicate products by listingId
    const seen = new Set();
    shopData.products = shopData.products.filter((p) => {
      if (!p.listingId || seen.has(p.listingId)) return false;
      seen.add(p.listingId);
      return true;
    });

    // Sort by reviews (bestsellers first)
    shopData.products.sort((a, b) => b.reviews - a.reviews);

    // Estimate monthly sales: total reviews * 5 (rough heuristic)
    shopData.estimatedMonthlySales = shopData.totalSales > 0
      ? Math.round(shopData.totalSales / Math.max(1, _monthsSinceDate(shopData.memberSince)))
      : shopData.products.reduce((sum, p) => sum + p.reviews, 0) * 5;

    shopData.id = `shop-${shopData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  } catch (err) {
    console.error(`[etsy] Failed to scrape shop ${shopUrl}:`, err.message);
    shopData.error = err.message;
  }

  return shopData;
}

/**
 * Scrape a single Etsy product listing page for detailed info.
 *
 * @param {string} listingUrl - Full Etsy listing URL
 * @returns {Object} Detailed product data
 */
async function scrapeProduct(listingUrl) {
  const product = {
    url: listingUrl,
    title: '',
    description: '',
    price: 0,
    currency: 'USD',
    reviews: 0,
    favorites: 0,
    shopName: '',
    shopUrl: '',
    relatedProducts: [],
    scrapedAt: new Date().toISOString(),
  };

  try {
    const html = await fetchPage(listingUrl);
    const $ = cheerio.load(html);

    // Title
    product.title = $('h1').first().text().trim()
      || $('[data-buy-box-listing-title]').text().trim()
      || '';

    // Description
    product.description = $('[data-product-details-description-text-content]').text().trim()
      || $('[class*="description"]').first().text().trim()
      || '';
    // Truncate long descriptions
    if (product.description.length > 2000) {
      product.description = product.description.substring(0, 2000) + '...';
    }

    // Price
    const priceText = $('[data-buy-box-region="price"]').text().trim()
      || $('[class*="price"]').first().text().trim()
      || '';
    const priceMatch = priceText.match(/[\d,.]+/);
    product.price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;

    const currencyMatch = priceText.match(/([A-Z]{3}|\$|€|£)/);
    product.currency = currencyMatch ? currencyMatch[1] : 'USD';

    // Reviews
    const reviewsText = $('[class*="reviews"]').first().text().trim()
      || $('[href*="#reviews"]').text().trim()
      || '';
    const reviewsMatch = reviewsText.match(/([\d,]+)/);
    product.reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(',', ''), 10) : 0;

    // Favorites
    const favText = $('[class*="favorite"]').text().trim()
      || $('[data-favorite-count]').attr('data-favorite-count')
      || '';
    const favMatch = favText.match(/([\d,]+)/);
    product.favorites = favMatch ? parseInt(favMatch[1].replace(',', ''), 10) : 0;

    // Shop info
    product.shopName = $('[class*="shop-name"] a, a[href*="/shop/"]').first().text().trim() || '';
    const shopHref = $('a[href*="/shop/"]').first().attr('href') || '';
    product.shopUrl = shopHref.startsWith('http') ? shopHref : shopHref ? `https://www.etsy.com${shopHref}` : '';

    // Related / similar products
    $('[class*="related"] a[href*="/listing/"], [class*="similar"] a[href*="/listing/"]').each((i, el) => {
      if (i >= 10) return false; // limit to 10 related
      const $el = $(el);
      const href = $el.attr('href') || '';
      const relTitle = $el.attr('title') || $el.text().trim().substring(0, 100);
      const relUrl = href.startsWith('http') ? href.split('?')[0] : `https://www.etsy.com${href.split('?')[0]}`;

      if (relTitle && relUrl.includes('/listing/')) {
        product.relatedProducts.push({
          title: relTitle,
          url: relUrl,
        });
      }
    });

    // Extract listing ID from URL
    const listingIdMatch = listingUrl.match(/\/listing\/(\d+)/);
    product.listingId = listingIdMatch ? listingIdMatch[1] : '';
    product.id = `etsy-${product.listingId || Date.now()}`;

  } catch (err) {
    console.error(`[etsy] Failed to scrape product ${listingUrl}:`, err.message);
    product.error = err.message;
  }

  return product;
}

// ---- Helpers ----

/**
 * Estimate months since a "Member since YYYY" or "Member since Mon YYYY" date string.
 */
function _monthsSinceDate(dateStr) {
  if (!dateStr) return 12;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 12;
    const now = new Date();
    return Math.max(1, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
  } catch {
    return 12;
  }
}

module.exports = { searchEtsy, scrapeShop, scrapeProduct };
