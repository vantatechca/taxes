// ============================================================================
// Brand Studio — Banner Templates
// 12 unique animated banner generators for Shopify storefronts
// ============================================================================

export const BANNER_STYLES = [
  { id: 'gradient-pulse', name: 'Gradient Pulse', description: 'Smooth animated gradient background shifting between brand colors with pulse animation', category: 'bold' },
  { id: 'parallax-float', name: 'Parallax Float', description: 'Multi-depth layers with floating product images and sliding text', category: 'dynamic' },
  { id: 'split-screen', name: 'Split Screen', description: 'Diagonal split layout with text and imagery on opposing sides', category: 'modern' },
  { id: 'neon-glow', name: 'Neon Glow', description: 'Dark background with pulsing neon borders, glowing text and product highlights', category: 'bold' },
  { id: 'minimal-fade', name: 'Minimal Fade', description: 'Clean background with sequential fade-in products and elegant serif typography', category: 'elegant' },
  { id: 'wave-motion', name: 'Wave Motion', description: 'Animated SVG wave shapes with floating product imagery', category: 'dynamic' },
  { id: 'grid-reveal', name: 'Grid Reveal', description: 'Products in a grid with staggered clip-path reveal animations', category: 'modern' },
  { id: 'cinematic', name: 'Cinematic', description: 'Full-width product background with dark overlay, mask text reveal and film grain', category: 'bold' },
  { id: 'floating-cards', name: 'Floating Cards', description: '3D perspective cards with gentle auto-rotation loop', category: 'dynamic' },
  { id: 'typewriter', name: 'Typewriter', description: 'Letter-by-letter text reveal with delayed product fade-in', category: 'elegant' },
  { id: 'glassmorphism', name: 'Glassmorphism', description: 'Frosted glass panels over floating colored orbs backdrop', category: 'modern' },
  { id: 'geometric', name: 'Geometric', description: 'Animated geometric shapes as decoration around product imagery', category: 'bold' },
];

export const NICHE_COLOR_PALETTES = {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function imgTag(url, alt, extraStyle = '') {
  if (!url) return '';
  return `<img src="${esc(url)}" alt="${esc(alt)}" style="max-width:100%;height:auto;display:block;${extraStyle}" />`;
}

function ctaButton(text, url, colors, extraCss = '') {
  return `<a href="${esc(url || '#')}" class="banner-cta" style="${extraCss}">${esc(text || 'Shop Now')}</a>`;
}

function wrapPreview(innerHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Banner Preview</title>
</head>
<body style="margin:0;padding:0;">
${innerHtml}
</body>
</html>`;
}

function wrapLiquid(innerHtml, css) {
  return `{% comment %} Brand Studio Banner — Shopify Section {% endcomment %}
<style>${css}</style>
${innerHtml.replace(/class="banner-cta"/g, 'class="banner-cta" href="{{ section.settings.button_url }}"')}

{% schema %}
{
  "name": "Brand Studio Banner",
  "settings": [
    { "type": "text", "id": "brand_name", "label": "Brand Name", "default": "Your Brand" },
    { "type": "text", "id": "tagline", "label": "Tagline", "default": "Quality you can trust" },
    { "type": "color", "id": "color_primary", "label": "Primary Color", "default": "#2563eb" },
    { "type": "color", "id": "color_secondary", "label": "Secondary Color", "default": "#38bdf8" },
    { "type": "color", "id": "color_accent", "label": "Accent Color", "default": "#6366f1" },
    { "type": "color", "id": "color_bg", "label": "Background Color", "default": "#0f172a" },
    { "type": "color", "id": "color_text", "label": "Text Color", "default": "#f1f5f9" },
    { "type": "image_picker", "id": "product_image_1", "label": "Product Image 1" },
    { "type": "image_picker", "id": "product_image_2", "label": "Product Image 2" },
    { "type": "image_picker", "id": "product_image_3", "label": "Product Image 3" },
    { "type": "text", "id": "button_text", "label": "Button Text", "default": "Shop Now" },
    { "type": "url", "id": "button_url", "label": "Button URL" }
  ],
  "presets": [{ "name": "Brand Studio Banner" }]
}
{% endschema %}`;
}

// ---------------------------------------------------------------------------
// Individual Banner Generators
// ---------------------------------------------------------------------------

function bannerGradientPulse({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'gp' + Date.now();

  const imageSection = imgs.length > 1
    ? `<div class="${uid}-images">${imgs.slice(0, 3).map((u, i) => `<div class="${uid}-img-wrap" style="animation-delay:${i * 0.3}s"><img src="${esc(u)}" alt="Product ${i + 1}" /></div>`).join('')}</div>`
    : imgs.length === 1
      ? `<div class="${uid}-img-single"><img src="${esc(imgs[0])}" alt="Product" /></div>`
      : '';

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; display: flex; align-items: center; justify-content: center; flex-direction: column;
  background: linear-gradient(135deg, ${c.primary}, ${c.secondary}, ${c.accent}, ${c.primary});
  background-size: 400% 400%; animation: ${uid}-gradShift 8s ease infinite; overflow: hidden; padding: 60px 20px; box-sizing: border-box;
}
@keyframes ${uid}-gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
.${uid}-banner h1 {
  font-family: 'Segoe UI',system-ui,sans-serif; font-size: 3.5rem; font-weight: 800; color: ${c.text}; margin: 0 0 12px;
  letter-spacing: 2px; animation: ${uid}-letterPop 3s ease infinite alternate; text-align: center;
}
@keyframes ${uid}-letterPop { 0%{letter-spacing:2px;opacity:.9} 100%{letter-spacing:6px;opacity:1} }
.${uid}-banner p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.35rem; color: ${c.text}; opacity: .85; margin: 0 0 40px; text-align: center; }
.${uid}-img-single { animation: ${uid}-pulse 4s ease-in-out infinite; margin-bottom: 36px; }
.${uid}-img-single img { max-height: 320px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
@keyframes ${uid}-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
.${uid}-images { display: flex; gap: 20px; margin-bottom: 36px; flex-wrap: wrap; justify-content: center; }
.${uid}-img-wrap { animation: ${uid}-pulse 4s ease-in-out infinite; }
.${uid}-img-wrap img { max-height: 220px; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.25); }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 16px 48px; background: ${c.text}; color: ${c.primary}; font-size: 1.1rem; font-weight: 700;
  border-radius: 50px; text-decoration: none; transition: transform .3s, box-shadow .3s;
}
.${uid}-banner .banner-cta:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.3); }
@media(max-width:768px) {
  .${uid}-banner { min-height: 500px; padding: 40px 16px; }
  .${uid}-banner h1 { font-size: 2rem; }
  .${uid}-banner p { font-size: 1rem; }
  .${uid}-img-single img { max-height: 200px; }
  .${uid}-img-wrap img { max-height: 140px; }
}`;

  const html = `<div class="${uid}-banner">
  <h1>${esc(brandName)}</h1>
  <p>${esc(tagline)}</p>
  ${imageSection}
  ${ctaButton(ctaText, ctaUrl, c)}
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerParallaxFloat({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'pf' + Date.now();

  const floatingImgs = imgs.slice(0, 3).map((u, i) => {
    const offsets = [{ top: '15%', left: '10%' }, { top: '30%', right: '8%' }, { bottom: '18%', left: '55%' }];
    const pos = offsets[i] || offsets[0];
    const posStr = Object.entries(pos).map(([k, v]) => `${k}:${v}`).join(';');
    return `<div class="${uid}-float-img" style="position:absolute;${posStr};animation-delay:${i * 1.5}s"><img src="${esc(u)}" alt="Product ${i + 1}" /></div>`;
  }).join('');

  const singleImg = imgs.length === 1
    ? `<div class="${uid}-center-img"><img src="${esc(imgs[0])}" alt="Product" /></div>` : '';

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; background: ${c.bg}; overflow: hidden; display: flex; align-items: center;
  padding: 60px 5%; box-sizing: border-box;
}
.${uid}-float-img { z-index: 1; animation: ${uid}-floatUp 6s ease-in-out infinite; }
.${uid}-float-img img { max-height: 200px; border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,.2); }
@keyframes ${uid}-floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }
.${uid}-content { position: relative; z-index: 2; max-width: 520px; animation: ${uid}-slideIn 1.2s ease-out both; }
@keyframes ${uid}-slideIn { from{opacity:0;transform:translateX(-80px)} to{opacity:1;transform:translateX(0)} }
.${uid}-content h1 { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 3.2rem; font-weight: 800; color: ${c.text}; margin: 0 0 16px; line-height: 1.15; }
.${uid}-content p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.25rem; color: ${c.text}; opacity: .8; margin: 0 0 36px; }
.${uid}-center-img { position: absolute; right: 8%; top: 50%; transform: translateY(-50%); z-index: 1; animation: ${uid}-floatUp 6s ease-in-out infinite; }
.${uid}-center-img img { max-height: 340px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
.${uid}-bg-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: .08;
  background: radial-gradient(circle at 30% 50%, ${c.primary}, transparent 60%), radial-gradient(circle at 70% 50%, ${c.secondary}, transparent 60%);
  animation: ${uid}-bgShift 10s ease infinite;
}
@keyframes ${uid}-bgShift { 0%,100%{opacity:.08} 50%{opacity:.15} }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 14px 42px; background: ${c.primary}; color: ${c.bg}; font-size: 1.05rem; font-weight: 700;
  border-radius: 8px; text-decoration: none; transition: transform .3s, background .3s;
}
.${uid}-banner .banner-cta:hover { transform: translateY(-2px); background: ${c.secondary}; }
@media(max-width:768px) {
  .${uid}-banner { flex-direction: column; min-height: 600px; padding: 40px 16px; text-align: center; }
  .${uid}-content h1 { font-size: 2rem; }
  .${uid}-float-img, .${uid}-center-img { position: relative; top: auto; left: auto; right: auto; bottom: auto; transform: none; margin: 10px auto; }
  .${uid}-center-img img { max-height: 200px; }
}`;

  const html = `<div class="${uid}-banner">
  <div class="${uid}-bg-layer"></div>
  <div class="${uid}-content">
    <h1>${esc(brandName)}</h1>
    <p>${esc(tagline)}</p>
    ${ctaButton(ctaText, ctaUrl, c)}
  </div>
  ${imgs.length > 1 ? floatingImgs : singleImg}
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerSplitScreen({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'ss' + Date.now();
  const imgSrc = imgs[0] || '';

  const rightContent = imgSrc
    ? `<img src="${esc(imgSrc)}" alt="Product" class="${uid}-product-img" />`
    : `<div class="${uid}-placeholder"></div>`;

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; display: flex; overflow: hidden; background: ${c.bg};
}
.${uid}-left {
  flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 60px 5%;
  background: ${c.primary}; clip-path: polygon(0 0, 92% 0, 78% 100%, 0 100%);
  animation: ${uid}-slideLeft 1s ease-out both; z-index: 2;
}
@keyframes ${uid}-slideLeft { from{transform:translateX(-100%)} to{transform:translateX(0)} }
.${uid}-left h1 { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 3rem; font-weight: 800; color: ${c.text}; margin: 0 0 16px; line-height: 1.1; }
.${uid}-left p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.2rem; color: ${c.text}; opacity: .85; margin: 0 0 32px; max-width: 400px; }
.${uid}-right {
  flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px;
  animation: ${uid}-slideRight 1s ease-out both;
}
@keyframes ${uid}-slideRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
.${uid}-product-img { max-height: 420px; max-width: 90%; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.2); animation: ${uid}-imgFloat 5s ease-in-out infinite; }
@keyframes ${uid}-imgFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(1deg)} }
.${uid}-placeholder { width: 280px; height: 280px; border-radius: 50%; background: linear-gradient(135deg, ${c.secondary}, ${c.accent}); animation: ${uid}-imgFloat 5s ease-in-out infinite; }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 14px 40px; background: ${c.accent}; color: ${c.text}; font-size: 1.05rem; font-weight: 700;
  border-radius: 50px; text-decoration: none; transition: all .3s;
}
.${uid}-banner .banner-cta:hover { background: ${c.secondary}; transform: scale(1.05); }
@media(max-width:768px) {
  .${uid}-banner { flex-direction: column; min-height: 600px; }
  .${uid}-left { clip-path: none; padding: 40px 20px; text-align: center; }
  .${uid}-left h1 { font-size: 2rem; }
  .${uid}-right { padding: 20px; }
  .${uid}-product-img { max-height: 240px; }
}`;

  const html = `<div class="${uid}-banner">
  <div class="${uid}-left">
    <h1>${esc(brandName)}</h1>
    <p>${esc(tagline)}</p>
    ${ctaButton(ctaText, ctaUrl, c)}
  </div>
  <div class="${uid}-right">
    ${rightContent}
  </div>
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerNeonGlow({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'ng' + Date.now();

  const imageSection = imgs.length > 1
    ? `<div class="${uid}-images">${imgs.slice(0, 3).map((u, i) => `<div class="${uid}-glow-card" style="animation-delay:${i * 0.4}s"><img src="${esc(u)}" alt="Product ${i + 1}" /></div>`).join('')}</div>`
    : imgs.length === 1
      ? `<div class="${uid}-glow-card ${uid}-single"><img src="${esc(imgs[0])}" alt="Product" /></div>`
      : '';

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; background: #0a0a0a; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 60px 20px; box-sizing: border-box; overflow: hidden;
}
.${uid}-banner::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  border: 3px solid ${c.primary}; margin: 24px; border-radius: 12px;
  box-shadow: 0 0 15px ${c.primary}, inset 0 0 15px ${c.primary}; animation: ${uid}-borderPulse 3s ease-in-out infinite;
}
@keyframes ${uid}-borderPulse { 0%,100%{box-shadow:0 0 15px ${c.primary},inset 0 0 15px ${c.primary}} 50%{box-shadow:0 0 40px ${c.primary},inset 0 0 40px ${c.primary},0 0 80px ${c.secondary}} }
.${uid}-banner h1 {
  font-family: 'Segoe UI',system-ui,sans-serif; font-size: 3.5rem; font-weight: 900; color: #fff; margin: 0 0 12px;
  text-shadow: 0 0 10px ${c.primary}, 0 0 30px ${c.primary}, 0 0 60px ${c.secondary}; animation: ${uid}-textGlow 2.5s ease-in-out infinite alternate;
  text-align: center; position: relative; z-index: 1;
}
@keyframes ${uid}-textGlow { 0%{text-shadow:0 0 10px ${c.primary},0 0 30px ${c.primary}} 100%{text-shadow:0 0 20px ${c.primary},0 0 50px ${c.primary},0 0 80px ${c.secondary},0 0 120px ${c.accent}} }
.${uid}-banner p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.3rem; color: #aaa; margin: 0 0 40px; text-align: center; position: relative; z-index: 1; }
.${uid}-images { display: flex; gap: 24px; margin-bottom: 36px; position: relative; z-index: 1; flex-wrap: wrap; justify-content: center; }
.${uid}-glow-card {
  border-radius: 12px; overflow: hidden; box-shadow: 0 0 20px ${c.primary}, 0 0 40px rgba(0,0,0,.5);
  animation: ${uid}-cardGlow 3s ease-in-out infinite alternate;
}
.${uid}-glow-card.${uid}-single { margin-bottom: 36px; }
@keyframes ${uid}-cardGlow { 0%{box-shadow:0 0 20px ${c.primary}} 100%{box-shadow:0 0 40px ${c.primary},0 0 80px ${c.secondary}} }
.${uid}-glow-card img { max-height: 240px; display: block; }
.${uid}-glow-card.${uid}-single img { max-height: 320px; }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 16px 48px; background: transparent; color: ${c.primary}; font-size: 1.1rem; font-weight: 700;
  border: 2px solid ${c.primary}; border-radius: 50px; text-decoration: none; position: relative; z-index: 1;
  box-shadow: 0 0 10px ${c.primary}; transition: all .3s;
}
.${uid}-banner .banner-cta:hover { background: ${c.primary}; color: #0a0a0a; box-shadow: 0 0 30px ${c.primary}, 0 0 60px ${c.secondary}; }
@media(max-width:768px) {
  .${uid}-banner { min-height: 500px; padding: 40px 16px; }
  .${uid}-banner h1 { font-size: 2rem; }
  .${uid}-glow-card img { max-height: 150px; }
  .${uid}-glow-card.${uid}-single img { max-height: 200px; }
}`;

  const html = `<div class="${uid}-banner">
  <h1>${esc(brandName)}</h1>
  <p>${esc(tagline)}</p>
  ${imageSection}
  ${ctaButton(ctaText, ctaUrl, c)}
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerMinimalFade({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'mf' + Date.now();

  const imageSection = imgs.length > 0
    ? `<div class="${uid}-products">${imgs.slice(0, 4).map((u, i) => `<div class="${uid}-prod" style="animation-delay:${0.6 + i * 0.5}s"><img src="${esc(u)}" alt="Product ${i + 1}" /></div>`).join('')}</div>`
    : '';

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; background: ${c.bg}; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 80px 20px; box-sizing: border-box; overflow: hidden;
}
.${uid}-banner::before {
  content: ''; position: absolute; top: 40px; left: 40px; right: 40px; bottom: 40px;
  border: 1px solid ${c.accent}; opacity: .3; animation: ${uid}-borderFade 4s ease-in-out infinite alternate;
}
@keyframes ${uid}-borderFade { 0%{opacity:.15} 100%{opacity:.4} }
.${uid}-banner h1 {
  font-family: Georgia,'Times New Roman',serif; font-size: 3rem; font-weight: 400; color: ${c.text}; margin: 0 0 12px;
  letter-spacing: 4px; text-transform: uppercase; animation: ${uid}-fadeIn 1.5s ease both; text-align: center;
}
@keyframes ${uid}-fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.${uid}-divider { width: 60px; height: 1px; background: ${c.primary}; margin: 0 auto 16px; animation: ${uid}-divGrow 2s ease both; }
@keyframes ${uid}-divGrow { from{width:0} to{width:60px} }
.${uid}-banner p {
  font-family: Georgia,'Times New Roman',serif; font-size: 1.15rem; color: ${c.text}; opacity: .7; margin: 0 0 48px;
  animation: ${uid}-fadeIn 1.8s ease both; text-align: center;
}
.${uid}-products { display: flex; gap: 28px; margin-bottom: 40px; flex-wrap: wrap; justify-content: center; }
.${uid}-prod { opacity: 0; animation: ${uid}-fadeIn 1s ease both; }
.${uid}-prod img { max-height: 240px; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,.08); transition: transform .4s; }
.${uid}-prod img:hover { transform: translateY(-6px); }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 14px 44px; background: transparent; color: ${c.text}; font-family: Georgia,serif;
  font-size: 1rem; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; border: 1px solid ${c.text};
  text-decoration: none; transition: all .4s;
}
.${uid}-banner .banner-cta:hover { background: ${c.text}; color: ${c.bg}; }
@media(max-width:768px) {
  .${uid}-banner { min-height: 500px; padding: 50px 16px; }
  .${uid}-banner h1 { font-size: 1.8rem; letter-spacing: 2px; }
  .${uid}-prod img { max-height: 160px; }
}`;

  const html = `<div class="${uid}-banner">
  <h1>${esc(brandName)}</h1>
  <div class="${uid}-divider"></div>
  <p>${esc(tagline)}</p>
  ${imageSection}
  ${ctaButton(ctaText, ctaUrl, c)}
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerWaveMotion({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'wm' + Date.now();

  const imageSection = imgs.length > 0
    ? imgs.length === 1
      ? `<div class="${uid}-center-img"><img src="${esc(imgs[0])}" alt="Product" /></div>`
      : `<div class="${uid}-img-row">${imgs.slice(0, 3).map((u, i) => `<img src="${esc(u)}" alt="Product ${i + 1}" class="${uid}-wave-img" style="animation-delay:${i * 0.6}s" />`).join('')}</div>`
    : '';

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; background: linear-gradient(180deg, ${c.bg} 0%, ${c.primary}22 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px 160px; box-sizing: border-box; overflow: hidden;
}
.${uid}-banner h1 { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 3.2rem; font-weight: 800; color: ${c.text}; margin: 0 0 12px; text-align: center; z-index: 2; position: relative; }
.${uid}-banner p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.2rem; color: ${c.text}; opacity: .75; margin: 0 0 36px; text-align: center; z-index: 2; position: relative; }
.${uid}-center-img { z-index: 2; position: relative; margin-bottom: 32px; animation: ${uid}-float 5s ease-in-out infinite; }
.${uid}-center-img img { max-height: 300px; border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,.15); }
@keyframes ${uid}-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
.${uid}-img-row { display: flex; gap: 20px; z-index: 2; position: relative; margin-bottom: 32px; flex-wrap: wrap; justify-content: center; }
.${uid}-wave-img { max-height: 200px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.12); animation: ${uid}-float 5s ease-in-out infinite; }
.${uid}-waves { position: absolute; bottom: 0; left: 0; width: 100%; z-index: 1; }
.${uid}-wave-path { animation: ${uid}-waveMove 6s ease-in-out infinite; }
@keyframes ${uid}-waveMove { 0%,100%{d:path('M0,120 C320,180 640,60 960,120 C1280,180 1440,80 1440,80 L1440,200 L0,200 Z')} 50%{d:path('M0,80 C320,40 640,160 960,80 C1280,40 1440,120 1440,120 L1440,200 L0,200 Z')} }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 14px 42px; background: ${c.primary}; color: ${c.bg}; font-size: 1.05rem; font-weight: 700;
  border-radius: 50px; text-decoration: none; z-index: 2; position: relative; transition: all .3s;
}
.${uid}-banner .banner-cta:hover { background: ${c.secondary}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.2); }
@media(max-width:768px) {
  .${uid}-banner { min-height: 520px; padding: 40px 16px 120px; }
  .${uid}-banner h1 { font-size: 2rem; }
  .${uid}-center-img img { max-height: 200px; }
  .${uid}-wave-img { max-height: 140px; }
}`;

  const html = `<div class="${uid}-banner">
  <h1>${esc(brandName)}</h1>
  <p>${esc(tagline)}</p>
  ${imageSection}
  ${ctaButton(ctaText, ctaUrl, c)}
  <svg class="${uid}-waves" viewBox="0 0 1440 200" preserveAspectRatio="none" style="height:160px">
    <path class="${uid}-wave-path" fill="${c.primary}" opacity=".3" d="M0,120 C320,180 640,60 960,120 C1280,180 1440,80 1440,80 L1440,200 L0,200 Z"/>
    <path fill="${c.secondary}" opacity=".2" d="M0,140 C360,100 720,180 1080,120 C1260,90 1440,130 1440,130 L1440,200 L0,200 Z">
      <animate attributeName="d" dur="8s" repeatCount="indefinite" values="M0,140 C360,100 720,180 1080,120 C1260,90 1440,130 1440,130 L1440,200 L0,200 Z;M0,110 C360,170 720,90 1080,150 C1260,120 1440,100 1440,100 L1440,200 L0,200 Z;M0,140 C360,100 720,180 1080,120 C1260,90 1440,130 1440,130 L1440,200 L0,200 Z"/>
    </path>
    <path fill="${c.accent}" opacity=".15" d="M0,160 C400,130 800,190 1200,150 C1360,140 1440,160 1440,160 L1440,200 L0,200 Z">
      <animate attributeName="d" dur="10s" repeatCount="indefinite" values="M0,160 C400,130 800,190 1200,150 C1360,140 1440,160 1440,160 L1440,200 L0,200 Z;M0,150 C400,180 800,120 1200,170 C1360,150 1440,140 1440,140 L1440,200 L0,200 Z;M0,160 C400,130 800,190 1200,150 C1360,140 1440,160 1440,160 L1440,200 L0,200 Z"/>
    </path>
  </svg>
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerGridReveal({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'gr' + Date.now();

  const gridCells = imgs.length > 0
    ? imgs.slice(0, 6).map((u, i) => `<div class="${uid}-cell" style="animation-delay:${i * 0.25}s"><img src="${esc(u)}" alt="Product ${i + 1}" /></div>`).join('')
    : [1, 2, 3, 4].map((_, i) => `<div class="${uid}-cell ${uid}-placeholder-cell" style="animation-delay:${i * 0.25}s;background:linear-gradient(135deg,${c.primary},${c.secondary})"></div>`).join('');

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; background: ${c.bg}; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 60px 20px; box-sizing: border-box; overflow: hidden;
}
.${uid}-banner h1 {
  font-family: 'Segoe UI',system-ui,sans-serif; font-size: 2.8rem; font-weight: 800; color: ${c.text}; margin: 0 0 8px;
  text-align: center; animation: ${uid}-fadeDown .8s ease both;
}
@keyframes ${uid}-fadeDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
.${uid}-banner p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.15rem; color: ${c.text}; opacity: .7; margin: 0 0 40px; text-align: center; animation: ${uid}-fadeDown 1s ease both; }
.${uid}-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; width: 100%; max-width: 800px; margin-bottom: 40px; }
.${uid}-cell {
  aspect-ratio: 1; overflow: hidden; border-radius: 12px; clip-path: inset(100% 0 0 0);
  animation: ${uid}-reveal .8s ease both;
}
@keyframes ${uid}-reveal { to{clip-path:inset(0 0 0 0)} }
.${uid}-cell img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.${uid}-cell:hover img { transform: scale(1.08); }
.${uid}-placeholder-cell { min-height: 180px; }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 14px 44px; background: ${c.primary}; color: ${c.bg}; font-size: 1.05rem; font-weight: 700;
  border-radius: 8px; text-decoration: none; transition: all .3s; animation: ${uid}-fadeDown 1.5s ease both;
}
.${uid}-banner .banner-cta:hover { background: ${c.secondary}; transform: translateY(-2px); }
@media(max-width:768px) {
  .${uid}-banner { min-height: 500px; padding: 40px 16px; }
  .${uid}-banner h1 { font-size: 2rem; }
  .${uid}-grid { grid-template-columns: repeat(2, 1fr); max-width: 400px; }
}`;

  const html = `<div class="${uid}-banner">
  <h1>${esc(brandName)}</h1>
  <p>${esc(tagline)}</p>
  <div class="${uid}-grid">
    ${gridCells}
  </div>
  ${ctaButton(ctaText, ctaUrl, c)}
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerCinematic({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'cm' + Date.now();
  const bgImg = imgs[0] || '';

  const bgStyle = bgImg
    ? `background-image:url('${esc(bgImg)}');background-size:cover;background-position:center;`
    : `background:linear-gradient(135deg,${c.primary},${c.secondary});`;

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; ${bgStyle}
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; box-sizing: border-box; overflow: hidden;
}
.${uid}-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(180deg, rgba(0,0,0,.6) 0%, rgba(0,0,0,.8) 100%); z-index: 1;
}
.${uid}-grain {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; opacity: .06; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat; animation: ${uid}-grainMove .5s steps(4) infinite;
}
@keyframes ${uid}-grainMove { 0%{transform:translate(0,0)} 25%{transform:translate(-2%,2%)} 50%{transform:translate(2%,-1%)} 75%{transform:translate(-1%,-2%)} 100%{transform:translate(0,0)} }
.${uid}-content { position: relative; z-index: 3; text-align: center; max-width: 700px; }
.${uid}-content h1 {
  font-family: 'Segoe UI',system-ui,sans-serif; font-size: 4rem; font-weight: 900; color: #fff; margin: 0 0 16px;
  text-transform: uppercase; letter-spacing: 6px; overflow: hidden;
}
.${uid}-content h1 span { display: inline-block; animation: ${uid}-maskReveal 1.2s ease both; }
@keyframes ${uid}-maskReveal { from{transform:translateY(110%);opacity:0} to{transform:translateY(0);opacity:1} }
.${uid}-content p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.3rem; color: #ddd; margin: 0 0 40px; animation: ${uid}-fadeUp 1.5s ease both; }
@keyframes ${uid}-fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 16px 52px; background: ${c.primary}; color: #fff; font-size: 1.15rem; font-weight: 700;
  letter-spacing: 2px; text-transform: uppercase; border-radius: 0; text-decoration: none; transition: all .3s;
  animation: ${uid}-fadeUp 2s ease both;
}
.${uid}-banner .banner-cta:hover { background: ${c.secondary}; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.4); }
@media(max-width:768px) {
  .${uid}-banner { min-height: 500px; padding: 40px 16px; }
  .${uid}-content h1 { font-size: 2.2rem; letter-spacing: 3px; }
  .${uid}-content p { font-size: 1rem; }
}`;

  const words = (brandName || '').split(' ');
  const h1Inner = words.map((w, i) => `<span style="animation-delay:${i * 0.2}s">${esc(w)}&nbsp;</span>`).join('');

  const html = `<div class="${uid}-banner">
  <div class="${uid}-overlay"></div>
  <div class="${uid}-grain"></div>
  <div class="${uid}-content">
    <h1>${h1Inner}</h1>
    <p>${esc(tagline)}</p>
    ${ctaButton(ctaText, ctaUrl, c)}
  </div>
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerFloatingCards({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'fc' + Date.now();

  const cards = imgs.length > 0
    ? imgs.slice(0, 3).map((u, i) => {
      const rotations = ['rotateY(5deg) rotateX(3deg)', 'rotateY(-5deg) rotateX(-2deg)', 'rotateY(3deg) rotateX(-4deg)'];
      return `<div class="${uid}-card" style="animation-delay:${i * 1.2}s"><img src="${esc(u)}" alt="Product ${i + 1}" /></div>`;
    }).join('')
    : `<div class="${uid}-card ${uid}-text-card"><span>${esc(brandName)}</span></div>`;

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; background: ${c.bg}; perspective: 1200px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; box-sizing: border-box; overflow: hidden;
}
.${uid}-banner h1 { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 3rem; font-weight: 800; color: ${c.text}; margin: 0 0 10px; text-align: center; }
.${uid}-banner p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.2rem; color: ${c.text}; opacity: .75; margin: 0 0 48px; text-align: center; }
.${uid}-cards { display: flex; gap: 32px; margin-bottom: 44px; perspective: 1200px; flex-wrap: wrap; justify-content: center; }
.${uid}-card {
  width: 240px; height: 300px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.15);
  transform-style: preserve-3d; animation: ${uid}-cardRotate 8s ease-in-out infinite;
  background: linear-gradient(135deg, ${c.primary}22, ${c.secondary}22);
}
@keyframes ${uid}-cardRotate {
  0%{transform:rotateY(0deg) rotateX(0deg) translateY(0)}
  25%{transform:rotateY(8deg) rotateX(4deg) translateY(-10px)}
  50%{transform:rotateY(0deg) rotateX(0deg) translateY(0)}
  75%{transform:rotateY(-8deg) rotateX(-4deg) translateY(-10px)}
  100%{transform:rotateY(0deg) rotateX(0deg) translateY(0)}
}
.${uid}-card img { width: 100%; height: 100%; object-fit: cover; }
.${uid}-text-card { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${c.primary}, ${c.secondary}); }
.${uid}-text-card span { color: ${c.bg}; font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.4rem; font-weight: 700; text-align: center; padding: 20px; }
.${uid}-shimmer {
  position: absolute; top: 0; left: -50%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
  animation: ${uid}-shimmerMove 4s ease infinite;
}
@keyframes ${uid}-shimmerMove { 0%{left:-50%} 100%{left:150%} }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 14px 44px; background: ${c.primary}; color: ${c.bg}; font-size: 1.05rem; font-weight: 700;
  border-radius: 12px; text-decoration: none; transition: all .3s; box-shadow: 0 8px 24px ${c.primary}33;
}
.${uid}-banner .banner-cta:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 12px 36px ${c.primary}55; }
@media(max-width:768px) {
  .${uid}-banner { min-height: 550px; padding: 40px 16px; }
  .${uid}-banner h1 { font-size: 2rem; }
  .${uid}-card { width: 180px; height: 230px; }
  .${uid}-cards { gap: 16px; }
}`;

  const html = `<div class="${uid}-banner">
  <div class="${uid}-shimmer"></div>
  <h1>${esc(brandName)}</h1>
  <p>${esc(tagline)}</p>
  <div class="${uid}-cards">
    ${cards}
  </div>
  ${ctaButton(ctaText, ctaUrl, c)}
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerTypewriter({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'tw' + Date.now();
  const nameLen = (brandName || '').length || 10;

  const imageSection = imgs.length > 0
    ? imgs.length === 1
      ? `<div class="${uid}-img-wrap"><img src="${esc(imgs[0])}" alt="Product" /></div>`
      : `<div class="${uid}-img-row">${imgs.slice(0, 3).map((u, i) => `<div class="${uid}-img-item" style="animation-delay:${2.5 + i * 0.4}s"><img src="${esc(u)}" alt="Product ${i + 1}" /></div>`).join('')}</div>`
    : '';

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; background: ${c.bg}; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 60px 20px; box-sizing: border-box; overflow: hidden;
}
.${uid}-typing-wrap { display: inline-flex; align-items: center; margin-bottom: 8px; }
.${uid}-banner h1 {
  font-family: 'Courier New', Courier, monospace; font-size: 3rem; font-weight: 700; color: ${c.text}; margin: 0;
  overflow: hidden; white-space: nowrap; border-right: 3px solid ${c.primary};
  width: 0; animation: ${uid}-type ${nameLen * 0.12}s steps(${nameLen}) 0.5s forwards, ${uid}-blink 0.75s step-end infinite;
}
@keyframes ${uid}-type { to{width:${nameLen}ch} }
@keyframes ${uid}-blink { 0%,100%{border-color:${c.primary}} 50%{border-color:transparent} }
.${uid}-banner p {
  font-family: Georgia,'Times New Roman',serif; font-size: 1.2rem; color: ${c.text}; opacity: 0; margin: 0 0 40px;
  animation: ${uid}-fadeInSlow 1s ease ${nameLen * 0.12 + 0.8}s forwards; text-align: center;
}
@keyframes ${uid}-fadeInSlow { to{opacity:.75} }
.${uid}-img-wrap { opacity: 0; animation: ${uid}-imgAppear 1.2s ease ${nameLen * 0.12 + 1.2}s forwards; margin-bottom: 32px; }
.${uid}-img-wrap img { max-height: 300px; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.12); }
@keyframes ${uid}-imgAppear { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
.${uid}-img-row { display: flex; gap: 20px; margin-bottom: 32px; flex-wrap: wrap; justify-content: center; }
.${uid}-img-item { opacity: 0; animation: ${uid}-imgAppear 1s ease forwards; }
.${uid}-img-item img { max-height: 200px; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.1); }
.${uid}-cursor-line { width: 60px; height: 2px; background: ${c.primary}; margin: 16px auto 24px; animation: ${uid}-lineGrow 1s ease ${nameLen * 0.12 + 0.5}s both; }
@keyframes ${uid}-lineGrow { from{width:0;opacity:0} to{width:60px;opacity:1} }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 14px 40px; background: ${c.text}; color: ${c.bg}; font-family: 'Courier New', monospace;
  font-size: 1rem; font-weight: 700; letter-spacing: 1px; border: none; border-radius: 0; text-decoration: none; transition: all .3s;
  opacity: 0; animation: ${uid}-fadeInSlow 1s ease ${nameLen * 0.12 + 1.5}s forwards;
}
.${uid}-banner .banner-cta:hover { background: ${c.primary}; color: ${c.bg}; }
@media(max-width:768px) {
  .${uid}-banner { min-height: 500px; padding: 40px 16px; }
  .${uid}-banner h1 { font-size: 1.8rem; }
  .${uid}-img-wrap img { max-height: 200px; }
  .${uid}-img-item img { max-height: 140px; }
}`;

  const html = `<div class="${uid}-banner">
  <div class="${uid}-typing-wrap">
    <h1>${esc(brandName)}</h1>
  </div>
  <div class="${uid}-cursor-line"></div>
  <p>${esc(tagline)}</p>
  ${imageSection}
  ${ctaButton(ctaText, ctaUrl, c)}
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerGlassmorphism({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'gl' + Date.now();

  const imageSection = imgs.length > 0
    ? imgs.length === 1
      ? `<div class="${uid}-glass-img"><img src="${esc(imgs[0])}" alt="Product" /></div>`
      : `<div class="${uid}-glass-row">${imgs.slice(0, 3).map((u, i) => `<div class="${uid}-glass-item" style="animation-delay:${i * 0.3}s"><img src="${esc(u)}" alt="Product ${i + 1}" /></div>`).join('')}</div>`
    : '';

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; background: ${c.bg}; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 60px 20px; box-sizing: border-box; overflow: hidden;
}
.${uid}-orb {
  position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5; z-index: 0;
}
.${uid}-orb1 { width: 400px; height: 400px; background: ${c.primary}; top: -10%; left: -5%; animation: ${uid}-orbFloat 12s ease-in-out infinite; }
.${uid}-orb2 { width: 350px; height: 350px; background: ${c.secondary}; bottom: -10%; right: -5%; animation: ${uid}-orbFloat 10s ease-in-out infinite reverse; }
.${uid}-orb3 { width: 250px; height: 250px; background: ${c.accent}; top: 40%; left: 50%; animation: ${uid}-orbFloat 14s ease-in-out infinite 2s; }
@keyframes ${uid}-orbFloat { 0%,100%{transform:translate(0,0)} 33%{transform:translate(40px,-30px)} 66%{transform:translate(-20px,40px)} }
.${uid}-glass-panel {
  position: relative; z-index: 1; background: rgba(255,255,255,.12); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.2); border-radius: 24px; padding: 48px 40px; max-width: 700px; text-align: center;
  animation: ${uid}-panelIn 1s ease both;
}
@keyframes ${uid}-panelIn { from{opacity:0;transform:translateY(30px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
.${uid}-glass-panel h1 { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 3rem; font-weight: 800; color: ${c.text}; margin: 0 0 12px; }
.${uid}-glass-panel p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.15rem; color: ${c.text}; opacity: .8; margin: 0 0 32px; }
.${uid}-glass-img { margin-bottom: 28px; }
.${uid}-glass-img img { max-height: 260px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,.15); animation: ${uid}-imgFloat 6s ease-in-out infinite; }
@keyframes ${uid}-imgFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
.${uid}-glass-row { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; justify-content: center; }
.${uid}-glass-item img { max-height: 180px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,.12); animation: ${uid}-imgFloat 6s ease-in-out infinite; }
.${uid}-glass-panel .banner-cta {
  display: inline-block; padding: 14px 42px; background: ${c.primary}; color: ${c.bg}; font-size: 1.05rem; font-weight: 700;
  border-radius: 50px; text-decoration: none; transition: all .3s; box-shadow: 0 4px 16px ${c.primary}44;
}
.${uid}-glass-panel .banner-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px ${c.primary}66; }
@media(max-width:768px) {
  .${uid}-banner { min-height: 520px; padding: 40px 12px; }
  .${uid}-glass-panel { padding: 32px 20px; }
  .${uid}-glass-panel h1 { font-size: 2rem; }
  .${uid}-glass-img img { max-height: 180px; }
  .${uid}-glass-item img { max-height: 120px; }
  .${uid}-orb { filter: blur(60px); }
}`;

  const html = `<div class="${uid}-banner">
  <div class="${uid}-orb ${uid}-orb1"></div>
  <div class="${uid}-orb ${uid}-orb2"></div>
  <div class="${uid}-orb ${uid}-orb3"></div>
  <div class="${uid}-glass-panel">
    <h1>${esc(brandName)}</h1>
    <p>${esc(tagline)}</p>
    ${imageSection}
    ${ctaButton(ctaText, ctaUrl, c)}
  </div>
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

function bannerGeometric({ brandName, tagline, productImages, colors, ctaText, ctaUrl }) {
  const imgs = productImages || [];
  const c = colors;
  const uid = 'ge' + Date.now();

  const imageSection = imgs.length > 0
    ? imgs.length === 1
      ? `<div class="${uid}-product"><img src="${esc(imgs[0])}" alt="Product" /></div>`
      : `<div class="${uid}-product-row">${imgs.slice(0, 3).map((u, i) => `<img src="${esc(u)}" alt="Product ${i + 1}" class="${uid}-product-img" style="animation-delay:${i * 0.3}s" />`).join('')}</div>`
    : '';

  const css = `
.${uid}-banner {
  position: relative; width: 100%; min-height: 700px; background: ${c.bg}; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 60px 20px; box-sizing: border-box; overflow: hidden;
}
.${uid}-shape { position: absolute; opacity: .12; z-index: 0; }
.${uid}-hex1 {
  top: 8%; left: 5%; width: 120px; height: 120px; background: ${c.primary};
  clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
  animation: ${uid}-spinSlow 20s linear infinite;
}
.${uid}-hex2 {
  bottom: 12%; right: 8%; width: 160px; height: 160px; background: ${c.secondary};
  clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
  animation: ${uid}-spinSlow 25s linear infinite reverse;
}
.${uid}-tri1 {
  top: 35%; right: 15%; width: 0; height: 0;
  border-left: 50px solid transparent; border-right: 50px solid transparent; border-bottom: 86px solid ${c.accent};
  animation: ${uid}-triPulse 6s ease-in-out infinite;
}
.${uid}-circle1 {
  bottom: 25%; left: 12%; width: 80px; height: 80px; border: 3px solid ${c.primary}; border-radius: 50%;
  animation: ${uid}-circlePulse 5s ease-in-out infinite;
}
.${uid}-circle2 {
  top: 15%; right: 30%; width: 50px; height: 50px; background: ${c.accent}; border-radius: 50%;
  animation: ${uid}-circlePulse 7s ease-in-out infinite 1s;
}
@keyframes ${uid}-spinSlow { to{transform:rotate(360deg)} }
@keyframes ${uid}-triPulse { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.15) translateY(-15px)} }
@keyframes ${uid}-circlePulse { 0%,100%{transform:scale(1);opacity:.12} 50%{transform:scale(1.2);opacity:.2} }
.${uid}-content { position: relative; z-index: 1; text-align: center; }
.${uid}-content h1 {
  font-family: 'Segoe UI',system-ui,sans-serif; font-size: 3.2rem; font-weight: 900; color: ${c.text}; margin: 0 0 12px;
  letter-spacing: 3px; text-transform: uppercase;
}
.${uid}-content p { font-family: 'Segoe UI',system-ui,sans-serif; font-size: 1.2rem; color: ${c.text}; opacity: .7; margin: 0 0 36px; }
.${uid}-product { margin-bottom: 32px; position: relative; z-index: 1; }
.${uid}-product img { max-height: 300px; border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,.15); }
.${uid}-product-row { display: flex; gap: 20px; margin-bottom: 32px; z-index: 1; position: relative; flex-wrap: wrap; justify-content: center; }
.${uid}-product-img { max-height: 200px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.12); animation: ${uid}-imgFadeIn 1s ease both; }
@keyframes ${uid}-imgFadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.${uid}-banner .banner-cta {
  display: inline-block; padding: 14px 44px; background: ${c.primary}; color: ${c.bg}; font-size: 1.05rem; font-weight: 700;
  border-radius: 4px; text-decoration: none; transition: all .3s; letter-spacing: 1px; text-transform: uppercase; position: relative; z-index: 1;
}
.${uid}-banner .banner-cta:hover { background: ${c.secondary}; transform: translateY(-2px); }
@media(max-width:768px) {
  .${uid}-banner { min-height: 500px; padding: 40px 16px; }
  .${uid}-content h1 { font-size: 2rem; letter-spacing: 2px; }
  .${uid}-product img { max-height: 200px; }
  .${uid}-product-img { max-height: 140px; }
  .${uid}-hex1, .${uid}-hex2 { width: 80px; height: 80px; }
}`;

  const html = `<div class="${uid}-banner">
  <div class="${uid}-shape ${uid}-hex1"></div>
  <div class="${uid}-shape ${uid}-hex2"></div>
  <div class="${uid}-shape ${uid}-tri1"></div>
  <div class="${uid}-shape ${uid}-circle1"></div>
  <div class="${uid}-shape ${uid}-circle2"></div>
  <div class="${uid}-content">
    <h1>${esc(brandName)}</h1>
    <p>${esc(tagline)}</p>
    ${imageSection}
    ${ctaButton(ctaText, ctaUrl, c)}
  </div>
</div>`;

  return { html, css, combinedHtml: `<style>${css}</style>${html}`, liquidCode: wrapLiquid(html, css), previewHtml: wrapPreview(`<style>${css}</style>${html}`) };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const generators = {
  'gradient-pulse': bannerGradientPulse,
  'parallax-float': bannerParallaxFloat,
  'split-screen': bannerSplitScreen,
  'neon-glow': bannerNeonGlow,
  'minimal-fade': bannerMinimalFade,
  'wave-motion': bannerWaveMotion,
  'grid-reveal': bannerGridReveal,
  'cinematic': bannerCinematic,
  'floating-cards': bannerFloatingCards,
  'typewriter': bannerTypewriter,
  'glassmorphism': bannerGlassmorphism,
  'geometric': bannerGeometric,
};

/**
 * Generate a banner.
 * @param {string} styleId - One of the BANNER_STYLES ids
 * @param {object} options - { brandName, tagline, productImages, colors, niche, ctaText, ctaUrl }
 * @returns {{ html: string, css: string, combinedHtml: string, liquidCode: string, previewHtml: string }}
 */
export function generateBanner(styleId, options = {}) {
  const gen = generators[styleId];
  if (!gen) throw new Error(`Unknown banner style: ${styleId}`);

  const colors = options.colors || (options.niche && NICHE_COLOR_PALETTES[options.niche]) || NICHE_COLOR_PALETTES['startup-kits'];

  return gen({
    brandName: options.brandName || 'Your Brand',
    tagline: options.tagline || 'Quality you can trust',
    productImages: options.productImages || [],
    colors,
    ctaText: options.ctaText || 'Shop Now',
    ctaUrl: options.ctaUrl || '#',
  });
}

/**
 * Get random style IDs.
 * @param {number} count
 * @param {string[]} exclude - IDs to exclude
 * @returns {object[]}
 */
export function getRandomStyles(count = 6, exclude = []) {
  const available = BANNER_STYLES.filter(s => !exclude.includes(s.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Suggest a color palette based on a niche slug.
 * @param {string} niche
 * @returns {object}
 */
export function suggestColors(niche) {
  if (!niche) return NICHE_COLOR_PALETTES['startup-kits'];
  const key = niche.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '');
  return NICHE_COLOR_PALETTES[key] || NICHE_COLOR_PALETTES['startup-kits'];
}
