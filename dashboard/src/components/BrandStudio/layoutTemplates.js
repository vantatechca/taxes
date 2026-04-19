// ============================================================================
// Brand Studio — Layout Templates
// 4 Homepage Layouts + 4 Product Page Layouts for Shopify storefronts
// ============================================================================

export const HOMEPAGE_LAYOUTS = [
  { id: 'modern-minimal', name: 'Modern Minimal', description: 'Clean lines, generous whitespace, typography-focused' },
  { id: 'bold-editorial', name: 'Bold Editorial', description: 'Magazine-style with large typography and dramatic sections' },
  { id: 'product-first', name: 'Product First', description: 'Grid-heavy, showcases products prominently' },
  { id: 'story-driven', name: 'Story Driven', description: 'Narrative scroll with storytelling sections' },
];

export const PRODUCT_PAGE_LAYOUTS = [
  { id: 'classic-split', name: 'Classic Split', description: 'Image gallery left, details right' },
  { id: 'full-gallery', name: 'Full-Width Gallery', description: 'Large image carousel with details below' },
  { id: 'immersive', name: 'Immersive', description: 'Full-bleed images with floating detail panels' },
  { id: 'compact', name: 'Compact', description: 'Everything visible above the fold, efficient layout' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function priceDisplay(price) {
  if (!price && price !== 0) return '$0.00';
  const num = typeof price === 'number' ? price : parseFloat(price);
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
}

function wrapFullPage(title, css, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${esc(title)}</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.6; -webkit-font-smoothing: antialiased; }
img { max-width: 100%; height: auto; display: block; }
a { text-decoration: none; }
${css}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

const PLACEHOLDER_TESTIMONIALS = [
  { name: 'Sarah M.', text: 'Absolutely love the quality! Will be ordering again.', stars: 5 },
  { name: 'James K.', text: 'Fast shipping, great product. Exceeded my expectations.', stars: 5 },
  { name: 'Emily R.', text: 'Perfect for what I needed. Highly recommend to everyone.', stars: 4 },
];

const PLACEHOLDER_REVIEWS = [
  { author: 'Alex T.', rating: 5, title: 'Fantastic quality', text: 'Exactly as described. The craftsmanship is top notch and it arrived quickly.' },
  { author: 'Morgan W.', rating: 5, title: 'Worth every penny', text: 'I have been looking for something like this for a while. So glad I found it.' },
  { author: 'Chris L.', rating: 4, title: 'Great product', text: 'Very satisfied with my purchase. Minor shipping delay but the product itself is excellent.' },
];

function starsHtml(count) {
  return Array.from({ length: 5 }, (_, i) => i < count ? '\u2605' : '\u2606').join('');
}

// ---------------------------------------------------------------------------
// Shared Section Builders
// ---------------------------------------------------------------------------

function buildProductCard(product, colors, idx) {
  return `<div class="hp-product-card" style="animation-delay:${idx * 0.15}s">
  ${product.image ? `<div class="hp-product-img"><img src="${esc(product.image)}" alt="${esc(product.name)}" /></div>` : `<div class="hp-product-img hp-product-placeholder" style="background:linear-gradient(135deg,${colors.primary}22,${colors.secondary}22)"></div>`}
  <div class="hp-product-info">
    <h3>${esc(product.name)}</h3>
    <p class="hp-product-price">${priceDisplay(product.price)}</p>
    ${product.description ? `<p class="hp-product-desc">${esc(product.description)}</p>` : ''}
  </div>
</div>`;
}

function buildTestimonials(colors) {
  return PLACEHOLDER_TESTIMONIALS.map(t => `<div class="hp-testimonial">
  <div class="hp-testimonial-stars" style="color:${colors.accent}">${starsHtml(t.stars)}</div>
  <p class="hp-testimonial-text">&ldquo;${esc(t.text)}&rdquo;</p>
  <p class="hp-testimonial-author">&mdash; ${esc(t.name)}</p>
</div>`).join('');
}

function buildNewsletter(colors) {
  return `<div class="hp-newsletter">
  <h2>Stay in the Loop</h2>
  <p>Join our community for exclusive deals and new arrivals.</p>
  <div class="hp-newsletter-form">
    <input type="email" placeholder="Enter your email" />
    <button type="button">Subscribe</button>
  </div>
</div>`;
}

function buildFooter(brandName, colors) {
  return `<footer class="hp-footer">
  <div class="hp-footer-inner">
    <div class="hp-footer-brand">
      <h3>${esc(brandName)}</h3>
      <p>Quality products, delivered with care.</p>
    </div>
    <div class="hp-footer-links">
      <h4>Shop</h4>
      <a href="#">All Products</a>
      <a href="#">New Arrivals</a>
      <a href="#">Best Sellers</a>
    </div>
    <div class="hp-footer-links">
      <h4>Support</h4>
      <a href="#">Contact Us</a>
      <a href="#">FAQ</a>
      <a href="#">Shipping</a>
    </div>
    <div class="hp-footer-links">
      <h4>Company</h4>
      <a href="#">About</a>
      <a href="#">Blog</a>
      <a href="#">Careers</a>
    </div>
  </div>
  <div class="hp-footer-bottom">
    <p>&copy; ${new Date().getFullYear()} ${esc(brandName)}. All rights reserved.</p>
  </div>
</footer>`;
}

function buildReviewsSection(colors) {
  return PLACEHOLDER_REVIEWS.map(r => `<div class="pp-review">
  <div class="pp-review-header">
    <span class="pp-review-stars" style="color:${colors.accent}">${starsHtml(r.rating)}</span>
    <strong>${esc(r.title)}</strong>
  </div>
  <p class="pp-review-text">${esc(r.text)}</p>
  <p class="pp-review-author">&mdash; ${esc(r.author)}</p>
</div>`).join('');
}

// ============================================================================
// HOMEPAGE GENERATORS
// ============================================================================

function homepageModernMinimal({ brandName, tagline, products, colors, bannerHtml, ctaText }) {
  const c = colors;
  const prods = (products || []).slice(0, 4);

  const css = `
/* Modern Minimal Homepage */
.mm-hero { width: 100%; }
.mm-section { max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
.mm-section-header { text-align: center; margin-bottom: 56px; }
.mm-section-header h2 { font-size: 2.2rem; font-weight: 300; color: ${c.text}; letter-spacing: 1px; margin-bottom: 12px; }
.mm-section-header p { font-size: 1.05rem; color: ${c.text}; opacity: .6; }
.mm-divider { width: 48px; height: 1px; background: ${c.primary}; margin: 16px auto 0; }

/* Products */
.mm-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 32px; }
.hp-product-card { background: #fff; border-radius: 8px; overflow: hidden; transition: transform .3s, box-shadow .3s; cursor: pointer; border: 1px solid ${c.text}11; }
.hp-product-card:hover { transform: translateY(-6px); box-shadow: 0 12px 36px rgba(0,0,0,.08); }
.hp-product-img { aspect-ratio: 1; overflow: hidden; background: ${c.bg}; }
.hp-product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.hp-product-card:hover .hp-product-img img { transform: scale(1.06); }
.hp-product-placeholder { min-height: 260px; }
.hp-product-info { padding: 20px; }
.hp-product-info h3 { font-size: 1.05rem; font-weight: 600; color: ${c.text}; margin-bottom: 6px; }
.hp-product-price { font-size: 1.1rem; font-weight: 700; color: ${c.primary}; margin-bottom: 6px; }
.hp-product-desc { font-size: .85rem; color: ${c.text}; opacity: .6; }

/* Value Proposition */
.mm-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 40px; text-align: center; }
.mm-value-item h3 { font-size: 1.15rem; font-weight: 600; color: ${c.text}; margin: 12px 0 8px; }
.mm-value-item p { font-size: .95rem; color: ${c.text}; opacity: .65; }
.mm-value-icon { width: 56px; height: 56px; border-radius: 50%; background: ${c.primary}15; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 1.5rem; color: ${c.primary}; }

/* Testimonials */
.mm-testimonials { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; }
.hp-testimonial { background: ${c.bg}; border-radius: 12px; padding: 32px; text-align: center; border: 1px solid ${c.text}0a; }
.hp-testimonial-stars { font-size: 1.2rem; margin-bottom: 12px; }
.hp-testimonial-text { font-size: 1rem; color: ${c.text}; opacity: .8; font-style: italic; margin-bottom: 12px; }
.hp-testimonial-author { font-size: .9rem; color: ${c.text}; opacity: .5; font-weight: 600; }

/* Newsletter */
.hp-newsletter { text-align: center; background: ${c.bg}; padding: 64px 24px; }
.hp-newsletter h2 { font-size: 1.8rem; color: ${c.text}; margin-bottom: 12px; }
.hp-newsletter p { font-size: 1rem; color: ${c.text}; opacity: .65; margin-bottom: 28px; }
.hp-newsletter-form { display: flex; gap: 12px; max-width: 440px; margin: 0 auto; }
.hp-newsletter-form input {
  flex: 1; padding: 14px 20px; border: 1px solid ${c.text}22; border-radius: 8px; font-size: 1rem;
  outline: none; transition: border-color .3s; background: #fff; color: ${c.text};
}
.hp-newsletter-form input:focus { border-color: ${c.primary}; }
.hp-newsletter-form button {
  padding: 14px 28px; background: ${c.primary}; color: ${c.bg}; border: none; border-radius: 8px;
  font-size: 1rem; font-weight: 600; cursor: pointer; transition: background .3s;
}
.hp-newsletter-form button:hover { background: ${c.secondary}; }

/* Footer */
.hp-footer { background: ${c.text}; color: ${c.bg}; padding: 60px 24px 24px; }
.hp-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 40px; }
.hp-footer-brand h3 { font-size: 1.4rem; margin-bottom: 8px; }
.hp-footer-brand p { opacity: .6; font-size: .9rem; }
.hp-footer-links h4 { font-size: .95rem; margin-bottom: 12px; opacity: .8; }
.hp-footer-links a { display: block; color: ${c.bg}; opacity: .5; font-size: .9rem; margin-bottom: 8px; transition: opacity .3s; }
.hp-footer-links a:hover { opacity: .9; }
.hp-footer-bottom { max-width: 1200px; margin: 40px auto 0; padding-top: 24px; border-top: 1px solid ${c.bg}22; text-align: center; }
.hp-footer-bottom p { font-size: .85rem; opacity: .4; }

@media(max-width:768px) {
  .mm-section { padding: 48px 16px; }
  .mm-section-header h2 { font-size: 1.6rem; }
  .hp-footer-inner { grid-template-columns: 1fr 1fr; }
  .hp-newsletter-form { flex-direction: column; }
}`;

  const bodyHtml = `
<div class="mm-hero">${bannerHtml || ''}</div>

<section class="mm-section">
  <div class="mm-section-header">
    <h2>Featured Products</h2>
    <p>Handpicked for you</p>
    <div class="mm-divider"></div>
  </div>
  <div class="mm-products">
    ${prods.map((p, i) => buildProductCard(p, c, i)).join('')}
  </div>
</section>

<section class="mm-section" style="background:${c.bg}">
  <div class="mm-section-header">
    <h2>Why Choose ${esc(brandName)}</h2>
    <div class="mm-divider"></div>
  </div>
  <div class="mm-values">
    <div class="mm-value-item">
      <div class="mm-value-icon">&#9733;</div>
      <h3>Premium Quality</h3>
      <p>Every product is crafted with the finest materials and attention to detail.</p>
    </div>
    <div class="mm-value-item">
      <div class="mm-value-icon">&#9889;</div>
      <h3>Fast Shipping</h3>
      <p>Orders ship within 24 hours with tracking on every package.</p>
    </div>
    <div class="mm-value-item">
      <div class="mm-value-icon">&#9825;</div>
      <h3>Satisfaction Guaranteed</h3>
      <p>Love it or your money back. No questions asked.</p>
    </div>
  </div>
</section>

<section class="mm-section">
  <div class="mm-section-header">
    <h2>What Our Customers Say</h2>
    <div class="mm-divider"></div>
  </div>
  <div class="mm-testimonials">
    ${buildTestimonials(c)}
  </div>
</section>

${buildNewsletter(c)}
${buildFooter(brandName, c)}`;

  const html = `<style>${css}</style>${bodyHtml}`;
  const liquidCode = buildHomepageLiquid('modern-minimal', brandName, c);

  return { html, liquidCode, previewHtml: wrapFullPage(brandName + ' | Home', css, bodyHtml) };
}

function homepageBoldEditorial({ brandName, tagline, products, colors, bannerHtml, ctaText }) {
  const c = colors;
  const prods = (products || []).slice(0, 4);

  const css = `
/* Bold Editorial Homepage */
.be-hero { width: 100%; }
.be-section { max-width: 1200px; margin: 0 auto; padding: 96px 24px; }
.be-section-full { width: 100%; padding: 96px 24px; }
.be-headline { font-size: 3.5rem; font-weight: 900; color: ${c.text}; line-height: 1.05; letter-spacing: -1px; margin-bottom: 16px; }
.be-subtitle { font-size: 1.2rem; color: ${c.text}; opacity: .55; text-transform: uppercase; letter-spacing: 4px; font-weight: 600; margin-bottom: 8px; }

/* Products — large tiles */
.be-products { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.be-products .hp-product-card { border: none; border-radius: 0; overflow: hidden; position: relative; }
.be-products .hp-product-card:nth-child(1) { grid-row: span 2; }
.be-products .hp-product-img { aspect-ratio: auto; min-height: 300px; }
.be-products .hp-product-card:nth-child(1) .hp-product-img { min-height: 100%; }
.hp-product-card { background: #fff; overflow: hidden; transition: transform .3s, box-shadow .3s; cursor: pointer; }
.hp-product-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,.1); }
.hp-product-img { overflow: hidden; background: ${c.bg}; }
.hp-product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s; }
.hp-product-card:hover .hp-product-img img { transform: scale(1.05); }
.hp-product-placeholder { min-height: 280px; }
.hp-product-info { padding: 24px; }
.hp-product-info h3 { font-size: 1.2rem; font-weight: 700; color: ${c.text}; margin-bottom: 6px; }
.hp-product-price { font-size: 1.15rem; font-weight: 800; color: ${c.primary}; }
.hp-product-desc { font-size: .85rem; color: ${c.text}; opacity: .6; margin-top: 4px; }

/* Value Banner */
.be-value-banner { display: flex; background: ${c.primary}; color: ${c.bg}; }
.be-value-left { flex: 1; padding: 64px 48px; display: flex; flex-direction: column; justify-content: center; }
.be-value-left h2 { font-size: 2.8rem; font-weight: 900; line-height: 1.1; margin-bottom: 16px; }
.be-value-left p { font-size: 1.1rem; opacity: .85; line-height: 1.7; }
.be-value-right { flex: 1; background: ${c.secondary}; display: flex; align-items: center; justify-content: center; padding: 48px; }
.be-value-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.be-stat { text-align: center; }
.be-stat-num { font-size: 3rem; font-weight: 900; color: ${c.bg}; }
.be-stat-label { font-size: .9rem; color: ${c.bg}; opacity: .7; text-transform: uppercase; letter-spacing: 2px; }

/* Testimonials */
.be-testimonials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
.hp-testimonial { padding: 48px 32px; text-align: left; border-right: 1px solid ${c.text}0d; background: ${c.bg}; }
.hp-testimonial:last-child { border-right: none; }
.hp-testimonial-stars { font-size: 1.2rem; margin-bottom: 16px; }
.hp-testimonial-text { font-size: 1.1rem; color: ${c.text}; line-height: 1.7; margin-bottom: 16px; font-style: normal; font-weight: 500; }
.hp-testimonial-author { font-size: .85rem; color: ${c.text}; opacity: .5; text-transform: uppercase; letter-spacing: 2px; }

/* Newsletter */
.hp-newsletter { text-align: center; background: ${c.text}; color: ${c.bg}; padding: 80px 24px; }
.hp-newsletter h2 { font-size: 2.4rem; font-weight: 900; color: ${c.bg}; margin-bottom: 12px; }
.hp-newsletter p { font-size: 1rem; color: ${c.bg}; opacity: .6; margin-bottom: 32px; }
.hp-newsletter-form { display: flex; gap: 0; max-width: 480px; margin: 0 auto; }
.hp-newsletter-form input {
  flex: 1; padding: 16px 20px; border: 2px solid ${c.bg}33; border-right: none; border-radius: 0;
  font-size: 1rem; background: transparent; color: ${c.bg}; outline: none;
}
.hp-newsletter-form input::placeholder { color: ${c.bg}66; }
.hp-newsletter-form input:focus { border-color: ${c.primary}; }
.hp-newsletter-form button {
  padding: 16px 32px; background: ${c.primary}; color: ${c.bg}; border: 2px solid ${c.primary}; border-radius: 0;
  font-size: 1rem; font-weight: 700; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: all .3s;
}
.hp-newsletter-form button:hover { background: ${c.secondary}; border-color: ${c.secondary}; }

/* Footer */
.hp-footer { background: ${c.text}; color: ${c.bg}; padding: 60px 24px 24px; }
.hp-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 40px; }
.hp-footer-brand h3 { font-size: 1.6rem; margin-bottom: 8px; font-weight: 900; }
.hp-footer-brand p { opacity: .5; font-size: .9rem; }
.hp-footer-links h4 { font-size: .85rem; margin-bottom: 12px; opacity: .7; text-transform: uppercase; letter-spacing: 2px; }
.hp-footer-links a { display: block; color: ${c.bg}; opacity: .4; font-size: .9rem; margin-bottom: 8px; transition: opacity .3s; }
.hp-footer-links a:hover { opacity: 1; }
.hp-footer-bottom { max-width: 1200px; margin: 48px auto 0; padding-top: 24px; border-top: 1px solid ${c.bg}15; text-align: center; }
.hp-footer-bottom p { font-size: .8rem; opacity: .3; text-transform: uppercase; letter-spacing: 2px; }

@media(max-width:768px) {
  .be-section { padding: 56px 16px; }
  .be-headline { font-size: 2rem; }
  .be-products { grid-template-columns: 1fr; }
  .be-products .hp-product-card:nth-child(1) { grid-row: auto; }
  .be-value-banner { flex-direction: column; }
  .be-value-left, .be-value-right { padding: 40px 24px; }
  .be-testimonials { grid-template-columns: 1fr; }
  .hp-testimonial { border-right: none; border-bottom: 1px solid ${c.text}0d; }
  .hp-footer-inner { grid-template-columns: 1fr 1fr; }
  .hp-newsletter-form { flex-direction: column; }
  .hp-newsletter-form input { border-right: 2px solid ${c.bg}33; }
}`;

  const bodyHtml = `
<div class="be-hero">${bannerHtml || ''}</div>

<section class="be-section">
  <p class="be-subtitle">Our Collection</p>
  <h2 class="be-headline">Featured Products</h2>
  <div style="height:40px"></div>
  <div class="be-products">
    ${prods.map((p, i) => buildProductCard(p, c, i)).join('')}
  </div>
</section>

<div class="be-value-banner">
  <div class="be-value-left">
    <h2>Built Different.<br/>Designed Better.</h2>
    <p>We believe in products that make a real difference. Every item is rigorously tested and thoughtfully designed for people who value quality.</p>
  </div>
  <div class="be-value-right">
    <div class="be-value-stats">
      <div class="be-stat"><div class="be-stat-num">10K+</div><div class="be-stat-label">Happy Customers</div></div>
      <div class="be-stat"><div class="be-stat-num">4.9</div><div class="be-stat-label">Average Rating</div></div>
      <div class="be-stat"><div class="be-stat-num">24h</div><div class="be-stat-label">Ship Time</div></div>
      <div class="be-stat"><div class="be-stat-num">100%</div><div class="be-stat-label">Satisfaction</div></div>
    </div>
  </div>
</div>

<section class="be-section">
  <p class="be-subtitle">Testimonials</p>
  <h2 class="be-headline">Real Words. Real People.</h2>
  <div style="height:40px"></div>
  <div class="be-testimonials">
    ${buildTestimonials(c)}
  </div>
</section>

<div class="hp-newsletter">
  <h2>Never Miss a Drop</h2>
  <p>Be the first to know about new releases and exclusive offers.</p>
  <div class="hp-newsletter-form">
    <input type="email" placeholder="Enter your email" />
    <button type="button">Join</button>
  </div>
</div>

${buildFooter(brandName, c)}`;

  const html = `<style>${css}</style>${bodyHtml}`;
  const liquidCode = buildHomepageLiquid('bold-editorial', brandName, c);

  return { html, liquidCode, previewHtml: wrapFullPage(brandName + ' | Home', css, bodyHtml) };
}

function homepageProductFirst({ brandName, tagline, products, colors, bannerHtml, ctaText }) {
  const c = colors;
  const prods = (products || []).slice(0, 8);

  const css = `
/* Product First Homepage */
.pf-hero { width: 100%; }
.pf-section { max-width: 1280px; margin: 0 auto; padding: 72px 24px; }
.pf-section-center { text-align: center; }
.pf-section h2 { font-size: 1.8rem; font-weight: 700; color: ${c.text}; margin-bottom: 8px; }
.pf-section .pf-sub { font-size: 1rem; color: ${c.text}; opacity: .55; margin-bottom: 40px; }

/* Product Grid — 4 columns */
.pf-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.hp-product-card { background: #fff; border-radius: 12px; overflow: hidden; transition: transform .3s, box-shadow .3s; cursor: pointer; border: 1px solid ${c.text}0a; }
.hp-product-card:hover { transform: translateY(-5px); box-shadow: 0 12px 36px rgba(0,0,0,.08); }
.hp-product-img { aspect-ratio: 1; overflow: hidden; background: ${c.bg}; }
.hp-product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.hp-product-card:hover .hp-product-img img { transform: scale(1.05); }
.hp-product-placeholder { min-height: 200px; }
.hp-product-info { padding: 16px; }
.hp-product-info h3 { font-size: .95rem; font-weight: 600; color: ${c.text}; margin-bottom: 4px; }
.hp-product-price { font-size: 1rem; font-weight: 700; color: ${c.primary}; }
.hp-product-desc { font-size: .8rem; color: ${c.text}; opacity: .55; margin-top: 4px; }

/* Quick shop bar */
.pf-quick-bar { display: flex; justify-content: center; gap: 16px; margin-top: 40px; flex-wrap: wrap; }
.pf-quick-btn { padding: 10px 28px; border: 2px solid ${c.primary}; color: ${c.primary}; border-radius: 50px; font-weight: 600; font-size: .9rem; background: transparent; cursor: pointer; transition: all .3s; }
.pf-quick-btn:hover { background: ${c.primary}; color: ${c.bg}; }

/* Value Row */
.pf-values { display: flex; gap: 0; background: ${c.primary}; color: ${c.bg}; border-radius: 16px; overflow: hidden; margin: 0 24px; }
.pf-value-item { flex: 1; padding: 40px 24px; text-align: center; border-right: 1px solid ${c.bg}15; }
.pf-value-item:last-child { border-right: none; }
.pf-value-item h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; }
.pf-value-item p { font-size: .85rem; opacity: .75; }

/* Testimonials */
.pf-testimonials { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
.hp-testimonial { background: #fff; border-radius: 12px; padding: 28px; border: 1px solid ${c.text}0a; }
.hp-testimonial-stars { font-size: 1.1rem; margin-bottom: 10px; }
.hp-testimonial-text { font-size: .95rem; color: ${c.text}; opacity: .75; font-style: italic; margin-bottom: 10px; }
.hp-testimonial-author { font-size: .85rem; color: ${c.text}; opacity: .45; font-weight: 600; }

/* Newsletter */
.hp-newsletter { text-align: center; background: ${c.bg}; padding: 64px 24px; }
.hp-newsletter h2 { font-size: 1.8rem; color: ${c.text}; margin-bottom: 10px; }
.hp-newsletter p { font-size: 1rem; color: ${c.text}; opacity: .55; margin-bottom: 24px; }
.hp-newsletter-form { display: flex; gap: 12px; max-width: 440px; margin: 0 auto; }
.hp-newsletter-form input { flex: 1; padding: 14px 20px; border: 1px solid ${c.text}22; border-radius: 50px; font-size: .95rem; outline: none; }
.hp-newsletter-form input:focus { border-color: ${c.primary}; }
.hp-newsletter-form button { padding: 14px 28px; background: ${c.primary}; color: ${c.bg}; border: none; border-radius: 50px; font-size: .95rem; font-weight: 600; cursor: pointer; transition: background .3s; }
.hp-newsletter-form button:hover { background: ${c.secondary}; }

/* Footer */
.hp-footer { background: ${c.text}; color: ${c.bg}; padding: 56px 24px 20px; }
.hp-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 36px; }
.hp-footer-brand h3 { font-size: 1.3rem; margin-bottom: 8px; }
.hp-footer-brand p { opacity: .5; font-size: .85rem; }
.hp-footer-links h4 { font-size: .9rem; margin-bottom: 10px; opacity: .7; }
.hp-footer-links a { display: block; color: ${c.bg}; opacity: .45; font-size: .85rem; margin-bottom: 6px; transition: opacity .3s; }
.hp-footer-links a:hover { opacity: .9; }
.hp-footer-bottom { max-width: 1200px; margin: 36px auto 0; padding-top: 20px; border-top: 1px solid ${c.bg}15; text-align: center; }
.hp-footer-bottom p { font-size: .8rem; opacity: .35; }

@media(max-width:1024px) { .pf-grid { grid-template-columns: repeat(3, 1fr); } }
@media(max-width:768px) {
  .pf-section { padding: 48px 16px; }
  .pf-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .pf-values { flex-direction: column; margin: 0 16px; border-radius: 12px; }
  .pf-value-item { border-right: none; border-bottom: 1px solid ${c.bg}15; padding: 24px; }
  .hp-footer-inner { grid-template-columns: 1fr 1fr; }
  .hp-newsletter-form { flex-direction: column; }
}`;

  const bodyHtml = `
<div class="pf-hero">${bannerHtml || ''}</div>

<section class="pf-section pf-section-center">
  <h2>Shop the Collection</h2>
  <p class="pf-sub">${esc(tagline || 'Curated products for every need')}</p>
  <div class="pf-grid">
    ${prods.map((p, i) => buildProductCard(p, c, i)).join('')}
  </div>
  <div class="pf-quick-bar">
    <button class="pf-quick-btn">All Products</button>
    <button class="pf-quick-btn">New Arrivals</button>
    <button class="pf-quick-btn">Best Sellers</button>
    <button class="pf-quick-btn">Sale</button>
  </div>
</section>

<div class="pf-values">
  <div class="pf-value-item"><h3>Free Shipping</h3><p>On orders over $50</p></div>
  <div class="pf-value-item"><h3>Easy Returns</h3><p>30-day hassle-free returns</p></div>
  <div class="pf-value-item"><h3>Secure Checkout</h3><p>SSL encrypted payments</p></div>
  <div class="pf-value-item"><h3>24/7 Support</h3><p>We are here to help</p></div>
</div>

<section class="pf-section pf-section-center">
  <h2>Customer Reviews</h2>
  <p class="pf-sub">See why thousands trust us</p>
  <div class="pf-testimonials">
    ${buildTestimonials(c)}
  </div>
</section>

${buildNewsletter(c)}
${buildFooter(brandName, c)}`;

  const html = `<style>${css}</style>${bodyHtml}`;
  const liquidCode = buildHomepageLiquid('product-first', brandName, c);

  return { html, liquidCode, previewHtml: wrapFullPage(brandName + ' | Home', css, bodyHtml) };
}

function homepageStoryDriven({ brandName, tagline, products, colors, bannerHtml, ctaText }) {
  const c = colors;
  const prods = (products || []).slice(0, 4);

  const css = `
/* Story Driven Homepage */
.sd-hero { width: 100%; }
.sd-section { max-width: 900px; margin: 0 auto; padding: 96px 24px; }
.sd-section-wide { max-width: 1200px; margin: 0 auto; padding: 96px 24px; }
.sd-narrative { text-align: center; }
.sd-narrative h2 { font-family: Georgia,'Times New Roman',serif; font-size: 2.6rem; font-weight: 400; color: ${c.text}; line-height: 1.35; margin-bottom: 24px; }
.sd-narrative p { font-family: Georgia,serif; font-size: 1.15rem; color: ${c.text}; opacity: .65; line-height: 1.9; max-width: 640px; margin: 0 auto; }

/* Story Section — alternating */
.sd-story { display: flex; align-items: center; gap: 64px; margin-bottom: 80px; }
.sd-story:nth-child(even) { flex-direction: row-reverse; }
.sd-story-img { flex: 1; border-radius: 16px; overflow: hidden; min-height: 360px; background: linear-gradient(135deg, ${c.primary}15, ${c.secondary}15); }
.sd-story-img img { width: 100%; height: 100%; object-fit: cover; }
.sd-story-text { flex: 1; }
.sd-story-text h3 { font-family: Georgia,serif; font-size: 1.8rem; color: ${c.text}; margin-bottom: 16px; }
.sd-story-text p { font-size: 1rem; color: ${c.text}; opacity: .65; line-height: 1.8; margin-bottom: 20px; }
.sd-story-link { color: ${c.primary}; font-weight: 600; font-size: .95rem; transition: opacity .3s; }
.sd-story-link:hover { opacity: .7; }

/* Products */
.sd-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 28px; }
.hp-product-card { background: #fff; border-radius: 12px; overflow: hidden; transition: transform .4s, box-shadow .4s; cursor: pointer; border: 1px solid ${c.text}08; }
.hp-product-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0,0,0,.08); }
.hp-product-img { aspect-ratio: 1; overflow: hidden; background: ${c.bg}; }
.hp-product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.hp-product-card:hover .hp-product-img img { transform: scale(1.06); }
.hp-product-placeholder { min-height: 260px; }
.hp-product-info { padding: 20px; }
.hp-product-info h3 { font-size: 1rem; font-weight: 600; color: ${c.text}; margin-bottom: 4px; }
.hp-product-price { font-size: 1.05rem; font-weight: 700; color: ${c.primary}; }
.hp-product-desc { font-size: .8rem; color: ${c.text}; opacity: .55; margin-top: 4px; }

/* Testimonial single-quote */
.sd-quote { text-align: center; background: ${c.primary}; color: ${c.bg}; padding: 96px 24px; }
.sd-quote blockquote { font-family: Georgia,serif; font-size: 1.8rem; font-weight: 400; line-height: 1.5; max-width: 700px; margin: 0 auto 24px; }
.sd-quote cite { font-size: 1rem; opacity: .7; font-style: normal; }

/* Newsletter */
.hp-newsletter { text-align: center; background: ${c.bg}; padding: 72px 24px; }
.hp-newsletter h2 { font-family: Georgia,serif; font-size: 2rem; color: ${c.text}; margin-bottom: 10px; }
.hp-newsletter p { font-size: 1rem; color: ${c.text}; opacity: .6; margin-bottom: 28px; }
.hp-newsletter-form { display: flex; gap: 12px; max-width: 440px; margin: 0 auto; }
.hp-newsletter-form input { flex: 1; padding: 14px 20px; border: 1px solid ${c.text}22; border-radius: 50px; font-size: .95rem; outline: none; }
.hp-newsletter-form input:focus { border-color: ${c.primary}; }
.hp-newsletter-form button { padding: 14px 28px; background: ${c.primary}; color: ${c.bg}; border: none; border-radius: 50px; font-size: .95rem; font-weight: 600; cursor: pointer; transition: background .3s; }
.hp-newsletter-form button:hover { background: ${c.secondary}; }

/* Footer */
.hp-footer { background: ${c.text}; color: ${c.bg}; padding: 60px 24px 24px; }
.hp-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 40px; }
.hp-footer-brand h3 { font-family: Georgia,serif; font-size: 1.4rem; margin-bottom: 8px; }
.hp-footer-brand p { opacity: .5; font-size: .85rem; }
.hp-footer-links h4 { font-size: .85rem; margin-bottom: 10px; opacity: .7; text-transform: uppercase; letter-spacing: 1px; }
.hp-footer-links a { display: block; color: ${c.bg}; opacity: .45; font-size: .85rem; margin-bottom: 6px; transition: opacity .3s; }
.hp-footer-links a:hover { opacity: .9; }
.hp-footer-bottom { max-width: 1200px; margin: 40px auto 0; padding-top: 20px; border-top: 1px solid ${c.bg}15; text-align: center; }
.hp-footer-bottom p { font-size: .8rem; opacity: .35; }

@media(max-width:768px) {
  .sd-section, .sd-section-wide { padding: 56px 16px; }
  .sd-narrative h2 { font-size: 1.8rem; }
  .sd-story { flex-direction: column !important; gap: 32px; margin-bottom: 48px; }
  .sd-story-img { min-height: 240px; }
  .sd-quote blockquote { font-size: 1.3rem; }
  .hp-footer-inner { grid-template-columns: 1fr 1fr; }
  .hp-newsletter-form { flex-direction: column; }
}`;

  const bodyHtml = `
<div class="sd-hero">${bannerHtml || ''}</div>

<section class="sd-section">
  <div class="sd-narrative">
    <h2>Our story begins with a simple idea: quality matters.</h2>
    <p>At ${esc(brandName)}, we believe that the things you surround yourself with should be as exceptional as you are. That is why every product we create starts with intention and ends with satisfaction.</p>
  </div>
</section>

<section class="sd-section-wide">
  <div class="sd-story">
    <div class="sd-story-img">${prods[0]?.image ? `<img src="${esc(prods[0].image)}" alt="${esc(prods[0].name)}" />` : ''}</div>
    <div class="sd-story-text">
      <h3>Crafted With Care</h3>
      <p>Every product goes through a rigorous quality process. We source the best materials and work with skilled artisans who share our passion for excellence.</p>
      <a href="#" class="sd-story-link">Learn More &rarr;</a>
    </div>
  </div>
  <div class="sd-story">
    <div class="sd-story-img">${prods[1]?.image ? `<img src="${esc(prods[1].image)}" alt="${esc(prods[1].name)}" />` : ''}</div>
    <div class="sd-story-text">
      <h3>Designed For You</h3>
      <p>We listen to our customers. Your feedback shapes our products, ensuring they solve real problems and bring genuine joy to your everyday life.</p>
      <a href="#" class="sd-story-link">Our Process &rarr;</a>
    </div>
  </div>
</section>

<section class="sd-section-wide">
  <div class="sd-narrative" style="margin-bottom:48px">
    <h2>Products We Love</h2>
  </div>
  <div class="sd-products">
    ${prods.map((p, i) => buildProductCard(p, c, i)).join('')}
  </div>
</section>

<div class="sd-quote">
  <blockquote>&ldquo;${esc(PLACEHOLDER_TESTIMONIALS[0].text)}&rdquo;</blockquote>
  <cite>&mdash; ${esc(PLACEHOLDER_TESTIMONIALS[0].name)}</cite>
</div>

${buildNewsletter(c)}
${buildFooter(brandName, c)}`;

  const html = `<style>${css}</style>${bodyHtml}`;
  const liquidCode = buildHomepageLiquid('story-driven', brandName, c);

  return { html, liquidCode, previewHtml: wrapFullPage(brandName + ' | Home', css, bodyHtml) };
}

// ============================================================================
// PRODUCT PAGE GENERATORS
// ============================================================================

function productClassicSplit({ brandName, product, colors, relatedProducts }) {
  const c = colors;
  const p = product || {};
  const images = p.images || (p.image ? [p.image] : []);
  const features = p.features || [];
  const related = (relatedProducts || []).slice(0, 4);

  const css = `
/* Classic Split Product Page */
.cs-product { max-width: 1200px; margin: 0 auto; padding: 48px 24px; display: flex; gap: 56px; }
.cs-gallery { flex: 1; position: sticky; top: 24px; align-self: flex-start; }
.cs-gallery-main { width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: ${c.bg}; margin-bottom: 12px; }
.cs-gallery-main img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; cursor: zoom-in; }
.cs-gallery-main:hover img { transform: scale(1.05); }
.cs-gallery-thumbs { display: flex; gap: 8px; }
.cs-thumb { width: 72px; height: 72px; border-radius: 8px; overflow: hidden; border: 2px solid transparent; cursor: pointer; transition: border-color .3s; }
.cs-thumb:hover, .cs-thumb.active { border-color: ${c.primary}; }
.cs-thumb img { width: 100%; height: 100%; object-fit: cover; }

.cs-details { flex: 1; }
.cs-breadcrumb { font-size: .85rem; color: ${c.text}; opacity: .45; margin-bottom: 16px; }
.cs-breadcrumb a { color: ${c.text}; opacity: .45; transition: opacity .3s; }
.cs-breadcrumb a:hover { opacity: .8; }
.cs-details h1 { font-size: 2rem; font-weight: 700; color: ${c.text}; margin-bottom: 8px; line-height: 1.2; }
.cs-price { font-size: 1.6rem; font-weight: 800; color: ${c.primary}; margin-bottom: 20px; }
.cs-rating { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.cs-rating-stars { color: ${c.accent}; font-size: 1.1rem; }
.cs-rating-count { font-size: .85rem; color: ${c.text}; opacity: .5; }
.cs-description { font-size: 1rem; color: ${c.text}; opacity: .7; line-height: 1.8; margin-bottom: 28px; }
.cs-features { margin-bottom: 32px; }
.cs-features h3 { font-size: 1rem; font-weight: 700; color: ${c.text}; margin-bottom: 12px; }
.cs-features ul { list-style: none; padding: 0; }
.cs-features li { font-size: .95rem; color: ${c.text}; opacity: .7; padding: 6px 0 6px 20px; position: relative; }
.cs-features li::before { content: '\\2713'; position: absolute; left: 0; color: ${c.primary}; font-weight: 700; }

.cs-add-to-cart {
  width: 100%; padding: 18px; background: ${c.primary}; color: ${c.bg}; border: none; border-radius: 12px;
  font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all .3s; margin-bottom: 12px;
}
.cs-add-to-cart:hover { background: ${c.secondary}; transform: translateY(-2px); box-shadow: 0 8px 24px ${c.primary}33; }
.cs-guarantee { font-size: .85rem; color: ${c.text}; opacity: .45; text-align: center; }

/* Related */
.cs-related { max-width: 1200px; margin: 0 auto; padding: 64px 24px; }
.cs-related h2 { font-size: 1.5rem; font-weight: 700; color: ${c.text}; margin-bottom: 28px; }
.cs-related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.hp-product-card { background: #fff; border-radius: 12px; overflow: hidden; transition: transform .3s, box-shadow .3s; cursor: pointer; border: 1px solid ${c.text}0a; }
.hp-product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(0,0,0,.08); }
.hp-product-img { aspect-ratio: 1; overflow: hidden; background: ${c.bg}; }
.hp-product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.hp-product-card:hover .hp-product-img img { transform: scale(1.05); }
.hp-product-placeholder { min-height: 200px; }
.hp-product-info { padding: 14px; }
.hp-product-info h3 { font-size: .9rem; font-weight: 600; color: ${c.text}; margin-bottom: 4px; }
.hp-product-price { font-size: .95rem; font-weight: 700; color: ${c.primary}; }
.hp-product-desc { display: none; }

/* Reviews */
.cs-reviews { max-width: 1200px; margin: 0 auto; padding: 0 24px 64px; }
.cs-reviews h2 { font-size: 1.5rem; font-weight: 700; color: ${c.text}; margin-bottom: 28px; }
.pp-review { padding: 24px 0; border-bottom: 1px solid ${c.text}0d; }
.pp-review:last-child { border-bottom: none; }
.pp-review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.pp-review-stars { font-size: 1rem; }
.pp-review-header strong { font-size: .95rem; color: ${c.text}; }
.pp-review-text { font-size: .95rem; color: ${c.text}; opacity: .7; line-height: 1.7; }
.pp-review-author { font-size: .85rem; color: ${c.text}; opacity: .4; margin-top: 8px; }

@media(max-width:768px) {
  .cs-product { flex-direction: column; padding: 24px 16px; gap: 32px; }
  .cs-gallery { position: static; }
  .cs-details h1 { font-size: 1.5rem; }
  .cs-related-grid { grid-template-columns: repeat(2, 1fr); }
  .cs-related, .cs-reviews { padding-left: 16px; padding-right: 16px; }
}`;

  const galleryMain = images[0]
    ? `<img src="${esc(images[0])}" alt="${esc(p.name)}" />`
    : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c.primary}15,${c.secondary}15)"></div>`;

  const thumbs = images.length > 1
    ? images.slice(0, 5).map((img, i) => `<div class="cs-thumb${i === 0 ? ' active' : ''}"><img src="${esc(img)}" alt="Thumbnail ${i + 1}" /></div>`).join('')
    : '';

  const bodyHtml = `
<div class="cs-product">
  <div class="cs-gallery">
    <div class="cs-gallery-main">${galleryMain}</div>
    ${thumbs ? `<div class="cs-gallery-thumbs">${thumbs}</div>` : ''}
  </div>
  <div class="cs-details">
    <div class="cs-breadcrumb"><a href="#">Home</a> / <a href="#">Products</a> / ${esc(p.name || 'Product')}</div>
    <h1>${esc(p.name || 'Product Name')}</h1>
    <div class="cs-rating">
      <span class="cs-rating-stars">${starsHtml(5)}</span>
      <span class="cs-rating-count">(128 reviews)</span>
    </div>
    <div class="cs-price">${priceDisplay(p.price)}</div>
    <p class="cs-description">${esc(p.description || 'A premium product crafted with care and attention to detail. Designed to exceed your expectations in every way.')}</p>
    ${features.length > 0 ? `<div class="cs-features"><h3>Features</h3><ul>${features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}
    <button class="cs-add-to-cart">Add to Cart</button>
    <p class="cs-guarantee">Free shipping &bull; 30-day returns &bull; Secure checkout</p>
  </div>
</div>

${related.length > 0 ? `<section class="cs-related">
  <h2>You May Also Like</h2>
  <div class="cs-related-grid">${related.map((r, i) => buildProductCard(r, c, i)).join('')}</div>
</section>` : ''}

<section class="cs-reviews">
  <h2>Customer Reviews</h2>
  ${buildReviewsSection(c)}
</section>`;

  const html = `<style>${css}</style>${bodyHtml}`;
  const liquidCode = buildProductLiquid('classic-split', c);

  return { html, liquidCode, previewHtml: wrapFullPage((p.name || 'Product') + ' | ' + brandName, css, bodyHtml) };
}

function productFullGallery({ brandName, product, colors, relatedProducts }) {
  const c = colors;
  const p = product || {};
  const images = p.images || (p.image ? [p.image] : []);
  const features = p.features || [];
  const related = (relatedProducts || []).slice(0, 4);

  const css = `
/* Full-Width Gallery Product Page */
.fg-gallery { width: 100%; overflow: hidden; background: ${c.bg}; }
.fg-gallery-track { display: flex; gap: 8px; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding: 0; }
.fg-gallery-track::-webkit-scrollbar { display: none; }
.fg-gallery-slide { flex: 0 0 70%; scroll-snap-align: center; min-height: 560px; overflow: hidden; }
.fg-gallery-slide img { width: 100%; height: 100%; object-fit: cover; }
.fg-gallery-placeholder { min-height: 560px; background: linear-gradient(135deg, ${c.primary}15, ${c.secondary}15); flex: 0 0 100%; }

.fg-details { max-width: 800px; margin: 0 auto; padding: 56px 24px; text-align: center; }
.fg-details h1 { font-size: 2.4rem; font-weight: 800; color: ${c.text}; margin-bottom: 8px; }
.fg-price { font-size: 1.5rem; font-weight: 700; color: ${c.primary}; margin-bottom: 16px; }
.fg-rating { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 24px; }
.fg-rating-stars { color: ${c.accent}; font-size: 1.2rem; }
.fg-rating-count { font-size: .9rem; color: ${c.text}; opacity: .5; }
.fg-description { font-size: 1.05rem; color: ${c.text}; opacity: .7; line-height: 1.8; margin-bottom: 32px; }

.fg-features { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-bottom: 36px; }
.fg-feature-tag { padding: 8px 20px; background: ${c.primary}12; color: ${c.primary}; border-radius: 50px; font-size: .9rem; font-weight: 600; }

.fg-add-to-cart {
  padding: 18px 64px; background: ${c.primary}; color: ${c.bg}; border: none; border-radius: 50px;
  font-size: 1.15rem; font-weight: 700; cursor: pointer; transition: all .3s;
}
.fg-add-to-cart:hover { background: ${c.secondary}; transform: scale(1.03); box-shadow: 0 8px 28px ${c.primary}33; }

/* Related */
.fg-related { max-width: 1200px; margin: 0 auto; padding: 64px 24px; }
.fg-related h2 { font-size: 1.5rem; font-weight: 700; color: ${c.text}; text-align: center; margin-bottom: 32px; }
.fg-related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.hp-product-card { background: #fff; border-radius: 12px; overflow: hidden; transition: transform .3s, box-shadow .3s; cursor: pointer; border: 1px solid ${c.text}0a; }
.hp-product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(0,0,0,.08); }
.hp-product-img { aspect-ratio: 1; overflow: hidden; background: ${c.bg}; }
.hp-product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.hp-product-card:hover .hp-product-img img { transform: scale(1.05); }
.hp-product-placeholder { min-height: 200px; }
.hp-product-info { padding: 14px; }
.hp-product-info h3 { font-size: .9rem; font-weight: 600; color: ${c.text}; margin-bottom: 4px; }
.hp-product-price { font-size: .95rem; font-weight: 700; color: ${c.primary}; }
.hp-product-desc { display: none; }

/* Reviews */
.fg-reviews { max-width: 800px; margin: 0 auto; padding: 0 24px 64px; }
.fg-reviews h2 { font-size: 1.5rem; font-weight: 700; color: ${c.text}; text-align: center; margin-bottom: 32px; }
.pp-review { padding: 24px; background: ${c.bg}; border-radius: 12px; margin-bottom: 16px; }
.pp-review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.pp-review-stars { font-size: 1rem; }
.pp-review-header strong { font-size: .95rem; color: ${c.text}; }
.pp-review-text { font-size: .95rem; color: ${c.text}; opacity: .7; line-height: 1.7; }
.pp-review-author { font-size: .85rem; color: ${c.text}; opacity: .4; margin-top: 8px; }

@media(max-width:768px) {
  .fg-gallery-slide { flex: 0 0 90%; min-height: 360px; }
  .fg-details { padding: 40px 16px; }
  .fg-details h1 { font-size: 1.7rem; }
  .fg-related-grid { grid-template-columns: repeat(2, 1fr); }
  .fg-related, .fg-reviews { padding-left: 16px; padding-right: 16px; }
}`;

  const gallerySlides = images.length > 0
    ? images.map((img, i) => `<div class="fg-gallery-slide"><img src="${esc(img)}" alt="${esc(p.name)} ${i + 1}" /></div>`).join('')
    : `<div class="fg-gallery-placeholder"></div>`;

  const bodyHtml = `
<div class="fg-gallery">
  <div class="fg-gallery-track">${gallerySlides}</div>
</div>

<div class="fg-details">
  <h1>${esc(p.name || 'Product Name')}</h1>
  <div class="fg-rating">
    <span class="fg-rating-stars">${starsHtml(5)}</span>
    <span class="fg-rating-count">(128 reviews)</span>
  </div>
  <div class="fg-price">${priceDisplay(p.price)}</div>
  <p class="fg-description">${esc(p.description || 'A premium product crafted with care and attention to detail.')}</p>
  ${features.length > 0 ? `<div class="fg-features">${features.map(f => `<span class="fg-feature-tag">${esc(f)}</span>`).join('')}</div>` : ''}
  <button class="fg-add-to-cart">Add to Cart</button>
</div>

${related.length > 0 ? `<section class="fg-related">
  <h2>You May Also Like</h2>
  <div class="fg-related-grid">${related.map((r, i) => buildProductCard(r, c, i)).join('')}</div>
</section>` : ''}

<section class="fg-reviews">
  <h2>Customer Reviews</h2>
  ${buildReviewsSection(c)}
</section>`;

  const html = `<style>${css}</style>${bodyHtml}`;
  const liquidCode = buildProductLiquid('full-gallery', c);

  return { html, liquidCode, previewHtml: wrapFullPage((p.name || 'Product') + ' | ' + brandName, css, bodyHtml) };
}

function productImmersive({ brandName, product, colors, relatedProducts }) {
  const c = colors;
  const p = product || {};
  const images = p.images || (p.image ? [p.image] : []);
  const features = p.features || [];
  const related = (relatedProducts || []).slice(0, 4);

  const css = `
/* Immersive Product Page */
.im-hero {
  width: 100%; min-height: 80vh; position: relative; display: flex; align-items: flex-end;
  ${images[0] ? `background-image:url('${esc(images[0])}');background-size:cover;background-position:center;` : `background:linear-gradient(135deg,${c.primary}22,${c.secondary}22);`}
}
.im-hero-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,.7) 100%); }
.im-hero-content { position: relative; z-index: 1; padding: 48px; max-width: 600px; color: #fff; }
.im-hero-content h1 { font-size: 3rem; font-weight: 900; margin-bottom: 8px; line-height: 1.1; }
.im-hero-price { font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; }
.im-hero-content p { font-size: 1.05rem; opacity: .85; line-height: 1.7; margin-bottom: 24px; }
.im-add-to-cart {
  padding: 16px 48px; background: ${c.primary}; color: #fff; border: none; border-radius: 8px;
  font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all .3s;
}
.im-add-to-cart:hover { background: ${c.secondary}; transform: translateY(-2px); }

/* Additional images */
.im-gallery-extra { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 4px; }
.im-gallery-extra img { width: 100%; height: 400px; object-fit: cover; transition: transform .4s; cursor: pointer; }
.im-gallery-extra img:hover { transform: scale(1.02); }

/* Floating details panel */
.im-details-panel { max-width: 900px; margin: -40px auto 0; position: relative; z-index: 2; background: #fff; border-radius: 16px; padding: 48px; box-shadow: 0 12px 48px rgba(0,0,0,.1); }
.im-details-panel h2 { font-size: 1.6rem; font-weight: 700; color: ${c.text}; margin-bottom: 16px; }
.im-details-panel p { font-size: 1rem; color: ${c.text}; opacity: .7; line-height: 1.8; margin-bottom: 24px; }
.im-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
.im-feature-item { padding: 20px; background: ${c.bg}; border-radius: 12px; text-align: center; }
.im-feature-item strong { display: block; font-size: .95rem; color: ${c.text}; margin-bottom: 4px; }
.im-feature-item span { font-size: .85rem; color: ${c.text}; opacity: .55; }

/* Related */
.im-related { max-width: 1200px; margin: 0 auto; padding: 64px 24px; }
.im-related h2 { font-size: 1.5rem; font-weight: 700; color: ${c.text}; margin-bottom: 28px; }
.im-related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.hp-product-card { background: #fff; border-radius: 12px; overflow: hidden; transition: transform .3s, box-shadow .3s; cursor: pointer; border: 1px solid ${c.text}0a; }
.hp-product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(0,0,0,.08); }
.hp-product-img { aspect-ratio: 1; overflow: hidden; background: ${c.bg}; }
.hp-product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.hp-product-card:hover .hp-product-img img { transform: scale(1.05); }
.hp-product-placeholder { min-height: 200px; }
.hp-product-info { padding: 14px; }
.hp-product-info h3 { font-size: .9rem; font-weight: 600; color: ${c.text}; margin-bottom: 4px; }
.hp-product-price { font-size: .95rem; font-weight: 700; color: ${c.primary}; }
.hp-product-desc { display: none; }

/* Reviews */
.im-reviews { max-width: 900px; margin: 0 auto; padding: 0 24px 64px; }
.im-reviews h2 { font-size: 1.5rem; font-weight: 700; color: ${c.text}; margin-bottom: 28px; }
.pp-review { padding: 24px 0; border-bottom: 1px solid ${c.text}0d; }
.pp-review:last-child { border-bottom: none; }
.pp-review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.pp-review-stars { font-size: 1rem; }
.pp-review-header strong { font-size: .95rem; color: ${c.text}; }
.pp-review-text { font-size: .95rem; color: ${c.text}; opacity: .7; line-height: 1.7; }
.pp-review-author { font-size: .85rem; color: ${c.text}; opacity: .4; margin-top: 8px; }

@media(max-width:768px) {
  .im-hero { min-height: 60vh; }
  .im-hero-content { padding: 24px; }
  .im-hero-content h1 { font-size: 2rem; }
  .im-details-panel { margin: -20px 16px 0; padding: 28px 20px; }
  .im-gallery-extra img { height: 240px; }
  .im-related-grid { grid-template-columns: repeat(2, 1fr); }
  .im-related, .im-reviews { padding-left: 16px; padding-right: 16px; }
}`;

  const extraImages = images.length > 1
    ? `<div class="im-gallery-extra">${images.slice(1, 4).map((img, i) => `<img src="${esc(img)}" alt="${esc(p.name)} ${i + 2}" />`).join('')}</div>`
    : '';

  const bodyHtml = `
<div class="im-hero">
  <div class="im-hero-overlay"></div>
  <div class="im-hero-content">
    <h1>${esc(p.name || 'Product Name')}</h1>
    <div class="im-hero-price">${priceDisplay(p.price)}</div>
    <p>${esc(p.description || 'A premium product crafted with care and attention to detail.')}</p>
    <button class="im-add-to-cart">Add to Cart</button>
  </div>
</div>

${extraImages}

${features.length > 0 || true ? `<div class="im-details-panel">
  <h2>Product Details</h2>
  <p>${esc(p.description || 'Every aspect of this product has been designed with quality and functionality in mind. From the premium materials to the precise construction, no detail has been overlooked.')}</p>
  <div class="im-features">
    ${features.length > 0 ? features.map(f => `<div class="im-feature-item"><strong>${esc(f)}</strong><span>Included</span></div>`).join('') : `
    <div class="im-feature-item"><strong>Premium Materials</strong><span>Built to last</span></div>
    <div class="im-feature-item"><strong>Fast Shipping</strong><span>Ships in 24h</span></div>
    <div class="im-feature-item"><strong>Easy Returns</strong><span>30-day policy</span></div>
    <div class="im-feature-item"><strong>Warranty</strong><span>1 year covered</span></div>`}
  </div>
</div>` : ''}

${related.length > 0 ? `<section class="im-related">
  <h2>You May Also Like</h2>
  <div class="im-related-grid">${related.map((r, i) => buildProductCard(r, c, i)).join('')}</div>
</section>` : ''}

<section class="im-reviews">
  <h2>Customer Reviews</h2>
  ${buildReviewsSection(c)}
</section>`;

  const html = `<style>${css}</style>${bodyHtml}`;
  const liquidCode = buildProductLiquid('immersive', c);

  return { html, liquidCode, previewHtml: wrapFullPage((p.name || 'Product') + ' | ' + brandName, css, bodyHtml) };
}

function productCompact({ brandName, product, colors, relatedProducts }) {
  const c = colors;
  const p = product || {};
  const images = p.images || (p.image ? [p.image] : []);
  const features = p.features || [];
  const related = (relatedProducts || []).slice(0, 4);

  const css = `
/* Compact Product Page */
.cp-main { max-width: 1200px; margin: 0 auto; padding: 32px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
.cp-gallery { display: grid; grid-template-columns: 64px 1fr; gap: 8px; }
.cp-thumbs { display: flex; flex-direction: column; gap: 6px; }
.cp-thumb { width: 64px; height: 64px; border-radius: 6px; overflow: hidden; border: 2px solid transparent; cursor: pointer; transition: border-color .3s; }
.cp-thumb:hover, .cp-thumb.active { border-color: ${c.primary}; }
.cp-thumb img { width: 100%; height: 100%; object-fit: cover; }
.cp-main-img { border-radius: 12px; overflow: hidden; background: ${c.bg}; aspect-ratio: 1; }
.cp-main-img img { width: 100%; height: 100%; object-fit: cover; }

.cp-details { }
.cp-details h1 { font-size: 1.6rem; font-weight: 700; color: ${c.text}; margin-bottom: 4px; }
.cp-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.cp-rating { color: ${c.accent}; font-size: 1rem; }
.cp-review-count { font-size: .8rem; color: ${c.text}; opacity: .45; }
.cp-price { font-size: 1.5rem; font-weight: 800; color: ${c.primary}; margin-bottom: 16px; }
.cp-desc { font-size: .9rem; color: ${c.text}; opacity: .65; line-height: 1.7; margin-bottom: 16px; }

.cp-features { margin-bottom: 20px; }
.cp-features-list { display: flex; flex-wrap: wrap; gap: 8px; }
.cp-feature-chip { padding: 6px 14px; background: ${c.bg}; border-radius: 6px; font-size: .8rem; color: ${c.text}; font-weight: 600; }

.cp-actions { display: flex; gap: 12px; margin-bottom: 12px; }
.cp-add-to-cart {
  flex: 1; padding: 14px; background: ${c.primary}; color: ${c.bg}; border: none; border-radius: 10px;
  font-size: 1rem; font-weight: 700; cursor: pointer; transition: all .3s;
}
.cp-add-to-cart:hover { background: ${c.secondary}; }
.cp-buy-now {
  padding: 14px 24px; background: transparent; color: ${c.primary}; border: 2px solid ${c.primary}; border-radius: 10px;
  font-size: 1rem; font-weight: 700; cursor: pointer; transition: all .3s;
}
.cp-buy-now:hover { background: ${c.primary}; color: ${c.bg}; }
.cp-trust { display: flex; gap: 20px; font-size: .75rem; color: ${c.text}; opacity: .4; }

/* Related */
.cp-related { max-width: 1200px; margin: 0 auto; padding: 48px 24px; border-top: 1px solid ${c.text}0d; }
.cp-related h2 { font-size: 1.2rem; font-weight: 700; color: ${c.text}; margin-bottom: 20px; }
.cp-related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.hp-product-card { background: #fff; border-radius: 10px; overflow: hidden; transition: transform .3s, box-shadow .3s; cursor: pointer; border: 1px solid ${c.text}0a; }
.hp-product-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,.07); }
.hp-product-img { aspect-ratio: 1; overflow: hidden; background: ${c.bg}; }
.hp-product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.hp-product-card:hover .hp-product-img img { transform: scale(1.04); }
.hp-product-placeholder { min-height: 160px; }
.hp-product-info { padding: 10px; }
.hp-product-info h3 { font-size: .8rem; font-weight: 600; color: ${c.text}; margin-bottom: 2px; }
.hp-product-price { font-size: .85rem; font-weight: 700; color: ${c.primary}; }
.hp-product-desc { display: none; }

/* Reviews */
.cp-reviews { max-width: 1200px; margin: 0 auto; padding: 0 24px 48px; }
.cp-reviews h2 { font-size: 1.2rem; font-weight: 700; color: ${c.text}; margin-bottom: 20px; }
.pp-review { padding: 16px 0; border-bottom: 1px solid ${c.text}0a; }
.pp-review:last-child { border-bottom: none; }
.pp-review-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.pp-review-stars { font-size: .9rem; }
.pp-review-header strong { font-size: .85rem; color: ${c.text}; }
.pp-review-text { font-size: .85rem; color: ${c.text}; opacity: .65; line-height: 1.6; }
.pp-review-author { font-size: .8rem; color: ${c.text}; opacity: .35; margin-top: 6px; }

@media(max-width:768px) {
  .cp-main { grid-template-columns: 1fr; padding: 16px; }
  .cp-gallery { grid-template-columns: 1fr; }
  .cp-thumbs { flex-direction: row; order: 1; }
  .cp-main-img { order: 0; }
  .cp-related-grid { grid-template-columns: repeat(2, 1fr); }
  .cp-related, .cp-reviews { padding-left: 16px; padding-right: 16px; }
}`;

  const mainImg = images[0]
    ? `<img src="${esc(images[0])}" alt="${esc(p.name)}" />`
    : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c.primary}15,${c.secondary}15)"></div>`;

  const thumbs = images.length > 1
    ? images.slice(0, 5).map((img, i) => `<div class="cp-thumb${i === 0 ? ' active' : ''}"><img src="${esc(img)}" alt="Thumb ${i + 1}" /></div>`).join('')
    : '';

  const bodyHtml = `
<div class="cp-main">
  <div class="cp-gallery">
    ${thumbs ? `<div class="cp-thumbs">${thumbs}</div>` : '<div></div>'}
    <div class="cp-main-img">${mainImg}</div>
  </div>
  <div class="cp-details">
    <h1>${esc(p.name || 'Product Name')}</h1>
    <div class="cp-meta">
      <span class="cp-rating">${starsHtml(5)}</span>
      <span class="cp-review-count">128 reviews</span>
    </div>
    <div class="cp-price">${priceDisplay(p.price)}</div>
    <p class="cp-desc">${esc(p.description || 'Premium quality product designed for everyday use.')}</p>
    ${features.length > 0 ? `<div class="cp-features"><div class="cp-features-list">${features.map(f => `<span class="cp-feature-chip">${esc(f)}</span>`).join('')}</div></div>` : ''}
    <div class="cp-actions">
      <button class="cp-add-to-cart">Add to Cart</button>
      <button class="cp-buy-now">Buy Now</button>
    </div>
    <div class="cp-trust">
      <span>Free Shipping</span>
      <span>30-Day Returns</span>
      <span>Secure Checkout</span>
    </div>
  </div>
</div>

${related.length > 0 ? `<section class="cp-related">
  <h2>Related Products</h2>
  <div class="cp-related-grid">${related.map((r, i) => buildProductCard(r, c, i)).join('')}</div>
</section>` : ''}

<section class="cp-reviews">
  <h2>Reviews</h2>
  ${buildReviewsSection(c)}
</section>`;

  const html = `<style>${css}</style>${bodyHtml}`;
  const liquidCode = buildProductLiquid('compact', c);

  return { html, liquidCode, previewHtml: wrapFullPage((p.name || 'Product') + ' | ' + brandName, css, bodyHtml) };
}

// ---------------------------------------------------------------------------
// Liquid Code Builders
// ---------------------------------------------------------------------------

function buildHomepageLiquid(layoutId, brandName, colors) {
  return `{% comment %} Brand Studio Homepage — ${layoutId} — Shopify Liquid {% endcomment %}

{%- assign brand_name = section.settings.brand_name | default: '${esc(brandName)}' -%}

<!-- Hero Banner -->
{% section 'brand-studio-banner' %}

<!-- Featured Products -->
<section class="homepage-products">
  <h2>Featured Products</h2>
  <div class="product-grid">
    {% for product in collections[section.settings.collection].products limit: 4 %}
      <div class="product-card">
        <a href="{{ product.url }}">
          {% if product.featured_image %}
            <img src="{{ product.featured_image | img_url: '400x400', crop: 'center' }}" alt="{{ product.title | escape }}" loading="lazy" />
          {% endif %}
          <h3>{{ product.title }}</h3>
          <p class="price">{{ product.price | money }}</p>
        </a>
      </div>
    {% endfor %}
  </div>
</section>

<!-- Value Proposition -->
<section class="homepage-values">
  <div class="value-item">
    <h3>{{ section.settings.value_1_title | default: 'Premium Quality' }}</h3>
    <p>{{ section.settings.value_1_text | default: 'Crafted with the finest materials.' }}</p>
  </div>
  <div class="value-item">
    <h3>{{ section.settings.value_2_title | default: 'Fast Shipping' }}</h3>
    <p>{{ section.settings.value_2_text | default: 'Orders ship within 24 hours.' }}</p>
  </div>
  <div class="value-item">
    <h3>{{ section.settings.value_3_title | default: 'Satisfaction Guaranteed' }}</h3>
    <p>{{ section.settings.value_3_text | default: 'Love it or your money back.' }}</p>
  </div>
</section>

<!-- Newsletter -->
<section class="homepage-newsletter">
  <h2>{{ section.settings.newsletter_heading | default: 'Stay in the Loop' }}</h2>
  <p>{{ section.settings.newsletter_text | default: 'Join our community for exclusive deals.' }}</p>
  {% form 'customer' %}
    <input type="email" name="contact[email]" placeholder="Enter your email" required />
    <button type="submit">Subscribe</button>
  {% endform %}
</section>

{% schema %}
{
  "name": "Brand Studio Homepage",
  "settings": [
    { "type": "text", "id": "brand_name", "label": "Brand Name", "default": "${esc(brandName)}" },
    { "type": "collection", "id": "collection", "label": "Featured Collection" },
    { "type": "text", "id": "value_1_title", "label": "Value 1 Title", "default": "Premium Quality" },
    { "type": "text", "id": "value_1_text", "label": "Value 1 Text", "default": "Crafted with the finest materials." },
    { "type": "text", "id": "value_2_title", "label": "Value 2 Title", "default": "Fast Shipping" },
    { "type": "text", "id": "value_2_text", "label": "Value 2 Text", "default": "Orders ship within 24 hours." },
    { "type": "text", "id": "value_3_title", "label": "Value 3 Title", "default": "Satisfaction Guaranteed" },
    { "type": "text", "id": "value_3_text", "label": "Value 3 Text", "default": "Love it or your money back." },
    { "type": "text", "id": "newsletter_heading", "label": "Newsletter Heading", "default": "Stay in the Loop" },
    { "type": "text", "id": "newsletter_text", "label": "Newsletter Text", "default": "Join our community for exclusive deals." },
    { "type": "color", "id": "color_primary", "label": "Primary Color", "default": "${colors.primary}" },
    { "type": "color", "id": "color_secondary", "label": "Secondary Color", "default": "${colors.secondary}" },
    { "type": "color", "id": "color_bg", "label": "Background Color", "default": "${colors.bg}" },
    { "type": "color", "id": "color_text", "label": "Text Color", "default": "${colors.text}" }
  ],
  "presets": [{ "name": "Brand Studio Homepage (${layoutId})" }]
}
{% endschema %}`;
}

function buildProductLiquid(layoutId, colors) {
  return `{% comment %} Brand Studio Product Page — ${layoutId} — Shopify Liquid {% endcomment %}

<div class="product-page" data-product-id="{{ product.id }}">
  <!-- Product Gallery -->
  <div class="product-gallery">
    {% for image in product.images %}
      <div class="gallery-image{% if forloop.first %} active{% endif %}">
        <img src="{{ image | img_url: '800x800', crop: 'center' }}" alt="{{ image.alt | escape | default: product.title }}" loading="{% if forloop.first %}eager{% else %}lazy{% endif %}" />
      </div>
    {% endfor %}
    {% if product.images.size > 1 %}
      <div class="gallery-thumbs">
        {% for image in product.images %}
          <button class="gallery-thumb{% if forloop.first %} active{% endif %}" data-index="{{ forloop.index0 }}">
            <img src="{{ image | img_url: '100x100', crop: 'center' }}" alt="Thumbnail {{ forloop.index }}" />
          </button>
        {% endfor %}
      </div>
    {% endif %}
  </div>

  <!-- Product Details -->
  <div class="product-details">
    <h1>{{ product.title }}</h1>
    <div class="product-price">
      {% if product.compare_at_price > product.price %}
        <span class="price-compare">{{ product.compare_at_price | money }}</span>
      {% endif %}
      <span class="price-current">{{ product.price | money }}</span>
    </div>
    <div class="product-description">{{ product.description }}</div>

    {% form 'product', product %}
      {% if product.variants.size > 1 %}
        <div class="product-variants">
          {% for option in product.options_with_values %}
            <div class="variant-option">
              <label>{{ option.name }}</label>
              <select name="id">
                {% for value in option.values %}
                  <option value="{{ value }}">{{ value }}</option>
                {% endfor %}
              </select>
            </div>
          {% endfor %}
        </div>
      {% else %}
        <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" />
      {% endif %}
      <button type="submit" class="add-to-cart"{% unless product.available %} disabled{% endunless %}>
        {% if product.available %}Add to Cart{% else %}Sold Out{% endif %}
      </button>
    {% endform %}
  </div>

  <!-- Related Products -->
  {% if product.collections.first %}
    <div class="related-products">
      <h2>You May Also Like</h2>
      <div class="related-grid">
        {% for related in product.collections.first.products limit: 4 %}
          {% unless related.id == product.id %}
            <div class="related-card">
              <a href="{{ related.url }}">
                <img src="{{ related.featured_image | img_url: '300x300', crop: 'center' }}" alt="{{ related.title | escape }}" loading="lazy" />
                <h3>{{ related.title }}</h3>
                <p>{{ related.price | money }}</p>
              </a>
            </div>
          {% endunless %}
        {% endfor %}
      </div>
    </div>
  {% endif %}
</div>

{% schema %}
{
  "name": "Brand Studio Product (${layoutId})",
  "settings": [
    { "type": "color", "id": "color_primary", "label": "Primary Color", "default": "${colors.primary}" },
    { "type": "color", "id": "color_secondary", "label": "Secondary Color", "default": "${colors.secondary}" },
    { "type": "color", "id": "color_accent", "label": "Accent Color", "default": "${colors.accent}" },
    { "type": "color", "id": "color_bg", "label": "Background Color", "default": "${colors.bg}" },
    { "type": "color", "id": "color_text", "label": "Text Color", "default": "${colors.text}" }
  ],
  "presets": [{ "name": "Brand Studio Product (${layoutId})" }]
}
{% endschema %}`;
}

// ---------------------------------------------------------------------------
// Default colors and niche palette lookup for layout generators
// ---------------------------------------------------------------------------

const DEFAULT_COLORS = { primary: '#2563eb', secondary: '#38bdf8', accent: '#6366f1', bg: '#f8fafc', text: '#1e293b' };

const LAYOUT_NICHE_PALETTES = {
  'wedding-planning': { primary: '#c9918b', secondary: '#d4af37', accent: '#f5e6e0', bg: '#fdf8f6', text: '#3d2c29' },
  'startup-kits': { primary: '#2563eb', secondary: '#38bdf8', accent: '#6366f1', bg: '#0f172a', text: '#f1f5f9' },
  'resume-career': { primary: '#1e3a5f', secondary: '#ffffff', accent: '#6b7280', bg: '#f9fafb', text: '#111827' },
  'personal-finance': { primary: '#16a34a', secondary: '#d4af37', accent: '#065f46', bg: '#0c1a0f', text: '#f0fdf4' },
  'meal-planning': { primary: '#ea580c', secondary: '#65a30d', accent: '#f59e0b', bg: '#fefce8', text: '#422006' },
  'fitness-workout': { primary: '#dc2626', secondary: '#111111', accent: '#f97316', bg: '#0a0a0a', text: '#ffffff' },
  'home-organization': { primary: '#0d9488', secondary: '#86efac', accent: '#a7f3d0', bg: '#f0fdfa', text: '#134e4a' },
  'parenting-baby': { primary: '#a78bfa', secondary: '#fda4af', accent: '#7dd3fc', bg: '#fdf4ff', text: '#3b0764' },
  'event-planning': { primary: '#9333ea', secondary: '#ec4899', accent: '#d4af37', bg: '#1a0533', text: '#f5f3ff' },
  'social-media': { primary: '#f43f5e', secondary: '#a855f7', accent: '#fb923c', bg: '#18181b', text: '#fafafa' },
  'pet-care': { primary: '#22c55e', secondary: '#92400e', accent: '#fbbf24', bg: '#fefdf5', text: '#1a2e05' },
  'real-estate': { primary: '#1e3a5f', secondary: '#d4af37', accent: '#e8dcc8', bg: '#faf9f7', text: '#1c1917' },
};

// ============================================================================
// Routers
// ============================================================================

const homepageGenerators = {
  'modern-minimal': homepageModernMinimal,
  'bold-editorial': homepageBoldEditorial,
  'product-first': homepageProductFirst,
  'story-driven': homepageStoryDriven,
};

const productGenerators = {
  'classic-split': productClassicSplit,
  'full-gallery': productFullGallery,
  'immersive': productImmersive,
  'compact': productCompact,
};

/**
 * Generate a homepage layout.
 * @param {string} layoutId
 * @param {object} options - { brandName, tagline, products, colors, niche, bannerHtml, ctaText }
 * @returns {{ html: string, liquidCode: string, previewHtml: string }}
 */
export function generateHomepage(layoutId, options = {}) {
  const gen = homepageGenerators[layoutId];
  if (!gen) throw new Error(`Unknown homepage layout: ${layoutId}`);

  const nicheKey = options.niche ? options.niche.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '') : null;
  const colors = options.colors || (nicheKey && LAYOUT_NICHE_PALETTES[nicheKey]) || DEFAULT_COLORS;

  return gen({
    brandName: options.brandName || 'Your Brand',
    tagline: options.tagline || 'Quality you can trust',
    products: options.products || [],
    colors,
    bannerHtml: options.bannerHtml || '',
    ctaText: options.ctaText || 'Shop Now',
  });
}

/**
 * Generate a product page layout.
 * @param {string} layoutId
 * @param {object} options - { brandName, product, colors, niche, relatedProducts }
 * @returns {{ html: string, liquidCode: string, previewHtml: string }}
 */
export function generateProductPage(layoutId, options = {}) {
  const gen = productGenerators[layoutId];
  if (!gen) throw new Error(`Unknown product page layout: ${layoutId}`);

  const nicheKey = options.niche ? options.niche.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '') : null;
  const colors = options.colors || (nicheKey && LAYOUT_NICHE_PALETTES[nicheKey]) || DEFAULT_COLORS;

  return gen({
    brandName: options.brandName || 'Your Brand',
    product: options.product || {},
    colors,
    relatedProducts: options.relatedProducts || [],
  });
}
