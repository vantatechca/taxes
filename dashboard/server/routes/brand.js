const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getCollection, updateCollection } = require('../db');

const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }
function findBrand(brands, id) {
  const index = brands.findIndex((b) => b.id === id);
  return index === -1 ? null : { brand: brands[index], index };
}
function saveBase64Image(base64String, originalName) {
  let data = base64String;
  let ext = 'png';
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  if (match) { ext = match[1] === 'jpeg' ? 'jpg' : match[1]; data = base64String.replace(/^data:image\/\w+;base64,/, ''); }
  else if (originalName) { const parsed = path.extname(originalName).replace('.', ''); if (parsed) ext = parsed; }
  const filename = `${uid()}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), Buffer.from(data, 'base64'));
  return `/uploads/${filename}`;
}
function deleteImageFile(urlPath) {
  if (!urlPath) return;
  const filepath = path.join(UPLOADS_DIR, path.basename(urlPath));
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
}

router.get('/', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    res.json({ success: true, brands: brands.map((b) => ({ id: b.id, name: b.name, niche: b.niche, description: b.description, colors: b.colors, bannerCount: (b.banners || []).length, layoutCount: (b.layouts || []).length, assetCount: (b.assets || []).length, productCount: (b.products || []).length, createdAt: b.createdAt, updatedAt: b.updatedAt })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, niche, description, colors } = req.body;
    if (!name || !niche) return res.status(400).json({ error: 'name and niche are required' });
    const brand = { id: uid(), name, niche, description: description || '', colors: colors || { primary: '#1a365d', secondary: '#2d3748', accent: '#ecc94b', bg: '#ffffff', text: '#1a202c' }, products: [], banners: [], selectedBannerId: null, layouts: [], selectedHomepageLayoutId: null, selectedProductLayoutId: null, assets: [], createdAt: now(), updatedAt: now() };
    const brands = await getCollection('brands');
    brands.push(brand);
    await updateCollection('brands', brands);
    res.status(201).json({ success: true, brand });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/brain/preferences', async (req, res) => {
  try {
    const feedback = await getCollection('brandFeedback');
    const prompts = await getCollection('brandPrompts');
    const byNiche = {};
    for (const entry of feedback) {
      const niche = entry.niche || 'general';
      if (!byNiche[niche]) byNiche[niche] = { likes: 0, dislikes: 0, tags: {}, notes: [] };
      if (entry.action === 'like') byNiche[niche].likes++;
      if (entry.action === 'dislike') byNiche[niche].dislikes++;
      for (const tag of entry.tags || []) byNiche[niche].tags[tag] = (byNiche[niche].tags[tag] || 0) + 1;
      if (entry.note) byNiche[niche].notes.push(entry.note);
    }
    for (const niche of Object.keys(byNiche)) {
      byNiche[niche].tags = Object.entries(byNiche[niche].tags).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
    }
    const promptsByNiche = {};
    for (const p of prompts) { const niche = p.niche || 'general'; if (!promptsByNiche[niche]) promptsByNiche[niche] = []; promptsByNiche[niche].push(p); }
    res.json({ success: true, preferences: byNiche, prompts: promptsByNiche });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/brain/feedback', async (req, res) => {
  try {
    const { niche, bannerId, action, tags, note } = req.body;
    if (!action || !['like', 'dislike'].includes(action)) return res.status(400).json({ error: 'action must be "like" or "dislike"' });
    const entry = { id: uid(), niche: niche || 'general', bannerId: bannerId || null, action, tags: tags || [], note: note || '', createdAt: now() };
    const feedback = await getCollection('brandFeedback');
    feedback.push(entry);
    await updateCollection('brandFeedback', feedback);
    res.status(201).json({ success: true, entry });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/brain/feedback/:id', async (req, res) => {
  try {
    const feedback = await getCollection('brandFeedback');
    const idx = feedback.findIndex((f) => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Feedback entry not found' });
    feedback.splice(idx, 1);
    await updateCollection('brandFeedback', feedback);
    res.json({ success: true, message: 'Feedback deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/brain/prompt', async (req, res) => {
  try {
    const { niche, text, category } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const entry = { id: uid(), niche: niche || 'general', text, category: category || 'general', createdAt: now() };
    const prompts = await getCollection('brandPrompts');
    prompts.push(entry);
    await updateCollection('brandPrompts', prompts);
    res.status(201).json({ success: true, entry });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/brain/prompts', async (req, res) => {
  try {
    const prompts = await getCollection('brandPrompts');
    res.json({ success: true, prompts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/brain/prompt/:id', async (req, res) => {
  try {
    const prompts = await getCollection('brandPrompts');
    const idx = prompts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Prompt not found' });
    prompts.splice(idx, 1);
    await updateCollection('brandPrompts', prompts);
    res.json({ success: true, message: 'Prompt deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    res.json({ success: true, brand: found.brand });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const { name, niche, description, colors, products } = req.body;
    if (name !== undefined) found.brand.name = name;
    if (niche !== undefined) found.brand.niche = niche;
    if (description !== undefined) found.brand.description = description;
    if (colors !== undefined) found.brand.colors = colors;
    if (products !== undefined) found.brand.products = products;
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, brand: found.brand });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    for (const product of found.brand.products || []) for (const imgUrl of product.images || []) deleteImageFile(imgUrl);
    for (const asset of found.brand.assets || []) { if (asset.originalImage) deleteImageFile(asset.originalImage); if (asset.rebrandedImage) deleteImageFile(asset.rebrandedImage); }
    brands.splice(found.index, 1);
    await updateCollection('brands', brands);
    res.json({ success: true, message: 'Brand deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/images', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const { productId, images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) return res.status(400).json({ error: 'images array is required' });
    const urls = images.map((img) => saveBase64Image(img.data || img, img.name || null));
    if (productId) { const product = (found.brand.products || []).find((p) => p.id === productId); if (product) product.images = [...(product.images || []), ...urls]; }
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.status(201).json({ success: true, urls });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const imageUrl = `/uploads/${req.params.imageId}`;
    let removed = false;
    for (const product of found.brand.products || []) { const idx = (product.images || []).indexOf(imageUrl); if (idx !== -1) { product.images.splice(idx, 1); removed = true; } }
    deleteImageFile(imageUrl);
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, removed, message: 'Image deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/banners', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const { styleId, html, css, liquidCode } = req.body;
    if (!html) return res.status(400).json({ error: 'html is required' });
    const banner = { id: uid(), styleId: styleId || null, html, css: css || '', liquidCode: liquidCode || '', liked: null, feedback: { tags: [], note: '' }, createdAt: now() };
    if (!found.brand.banners) found.brand.banners = [];
    found.brand.banners.push(banner);
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.status(201).json({ success: true, banner });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/banners/:bannerId', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const banner = (found.brand.banners || []).find((b) => b.id === req.params.bannerId);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    const { liked, feedback, html, css, liquidCode, styleId } = req.body;
    if (liked !== undefined) banner.liked = liked;
    if (feedback !== undefined) banner.feedback = { ...banner.feedback, ...feedback };
    if (html !== undefined) banner.html = html;
    if (css !== undefined) banner.css = css;
    if (liquidCode !== undefined) banner.liquidCode = liquidCode;
    if (styleId !== undefined) banner.styleId = styleId;
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, banner });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/banners/:bannerId', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const idx = (found.brand.banners || []).findIndex((b) => b.id === req.params.bannerId);
    if (idx === -1) return res.status(404).json({ error: 'Banner not found' });
    found.brand.banners.splice(idx, 1);
    if (found.brand.selectedBannerId === req.params.bannerId) found.brand.selectedBannerId = null;
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/banners/:bannerId/select', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    if (!(found.brand.banners || []).find((b) => b.id === req.params.bannerId)) return res.status(404).json({ error: 'Banner not found' });
    found.brand.selectedBannerId = req.params.bannerId;
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, selectedBannerId: req.params.bannerId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/layouts', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const { type, layoutId, html, liquidCode } = req.body;
    if (!type || !html) return res.status(400).json({ error: 'type and html are required' });
    const layout = { id: uid(), type, layoutId: layoutId || null, html, liquidCode: liquidCode || '', liked: null, feedback: { tags: [], note: '' }, createdAt: now() };
    if (!found.brand.layouts) found.brand.layouts = [];
    found.brand.layouts.push(layout);
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.status(201).json({ success: true, layout });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/layouts/:layoutId', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const layout = (found.brand.layouts || []).find((l) => l.id === req.params.layoutId);
    if (!layout) return res.status(404).json({ error: 'Layout not found' });
    const { type, layoutId: newLayoutId, html, liquidCode, liked, feedback } = req.body;
    if (type !== undefined) layout.type = type;
    if (newLayoutId !== undefined) layout.layoutId = newLayoutId;
    if (html !== undefined) layout.html = html;
    if (liquidCode !== undefined) layout.liquidCode = liquidCode;
    if (liked !== undefined) layout.liked = liked;
    if (feedback !== undefined) layout.feedback = { ...layout.feedback, ...feedback };
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, layout });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/layouts/:layoutId', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const idx = (found.brand.layouts || []).findIndex((l) => l.id === req.params.layoutId);
    if (idx === -1) return res.status(404).json({ error: 'Layout not found' });
    const deletedId = found.brand.layouts[idx].id;
    found.brand.layouts.splice(idx, 1);
    if (found.brand.selectedHomepageLayoutId === deletedId) found.brand.selectedHomepageLayoutId = null;
    if (found.brand.selectedProductLayoutId === deletedId) found.brand.selectedProductLayoutId = null;
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, message: 'Layout deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/layouts/:layoutId/select', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const layout = (found.brand.layouts || []).find((l) => l.id === req.params.layoutId);
    if (!layout) return res.status(404).json({ error: 'Layout not found' });
    const type = req.body.type || layout.type || 'homepage';
    if (type === 'product') found.brand.selectedProductLayoutId = req.params.layoutId;
    else found.brand.selectedHomepageLayoutId = req.params.layoutId;
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, type, selectedLayoutId: req.params.layoutId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/assets', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const { productId, originalImage, rebrandedImage } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    let origUrl = originalImage || '';
    let rebrandUrl = rebrandedImage || '';
    if (originalImage?.startsWith('data:')) origUrl = saveBase64Image(originalImage, 'original.png');
    if (rebrandedImage?.startsWith('data:')) rebrandUrl = saveBase64Image(rebrandedImage, 'rebranded.png');
    const asset = { id: uid(), productId, originalImage: origUrl, rebrandedImage: rebrandUrl, liked: null, createdAt: now() };
    if (!found.brand.assets) found.brand.assets = [];
    found.brand.assets.push(asset);
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.status(201).json({ success: true, asset });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/assets/:assetId', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const asset = (found.brand.assets || []).find((a) => a.id === req.params.assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const { liked, originalImage, rebrandedImage, productId } = req.body;
    if (liked !== undefined) asset.liked = liked;
    if (productId !== undefined) asset.productId = productId;
    if (originalImage !== undefined) asset.originalImage = originalImage.startsWith('data:') ? saveBase64Image(originalImage, 'original.png') : originalImage;
    if (rebrandedImage !== undefined) asset.rebrandedImage = rebrandedImage.startsWith('data:') ? saveBase64Image(rebrandedImage, 'rebranded.png') : rebrandedImage;
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, asset });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/assets/:assetId', async (req, res) => {
  try {
    const brands = await getCollection('brands');
    const found = findBrand(brands, req.params.id);
    if (!found) return res.status(404).json({ error: 'Brand not found' });
    const idx = (found.brand.assets || []).findIndex((a) => a.id === req.params.assetId);
    if (idx === -1) return res.status(404).json({ error: 'Asset not found' });
    const asset = found.brand.assets[idx];
    deleteImageFile(asset.originalImage);
    deleteImageFile(asset.rebrandedImage);
    found.brand.assets.splice(idx, 1);
    found.brand.updatedAt = now();
    brands[found.index] = found.brand;
    await updateCollection('brands', brands);
    res.json({ success: true, message: 'Asset deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
