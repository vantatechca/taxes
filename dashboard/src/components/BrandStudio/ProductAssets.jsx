import { useState, useMemo } from 'react';

const API_BASE = '/api/brands';

const REBRAND_STYLES = [
  {
    id: 'clean-frame',
    name: 'Clean Frame',
    description: 'Elegant border and shadow in brand colors',
    icon: '🖼️',
  },
  {
    id: 'gradient-overlay',
    name: 'Gradient Overlay',
    description: 'Brand gradient at bottom with product name',
    icon: '🌈',
  },
  {
    id: 'badge-style',
    name: 'Badge Style',
    description: 'Corner badge with price and brand logo area',
    icon: '🏷️',
  },
  {
    id: 'lifestyle-mock',
    name: 'Lifestyle Mock',
    description: 'Product in a device/desk mockup frame',
    icon: '💻',
  },
];

function generateStyledHtml(style, product, brand) {
  const colors = brand.colors || ['#6366f1', '#8b5cf6', '#f59e0b', '#1e1b4b', '#f3f4f6'];
  const [primary, secondary, accent, bg, text] = colors;
  const imgSrc = product.image || product.data || product.url;
  const productName = product.name || 'Product';
  const price = product.price || '29.99';

  switch (style) {
    case 'clean-frame':
      return `
        <div style="width:1080px;height:1080px;display:flex;align-items:center;justify-content:center;background:${bg};padding:40px;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;">
          <div style="width:100%;height:100%;border:4px solid ${primary};border-radius:24px;box-shadow:0 25px 60px ${primary}40, 0 0 0 1px ${secondary}30;overflow:hidden;position:relative;background:#fff;">
            <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;" alt="${productName}" />
            <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 30px;background:linear-gradient(transparent, ${bg}ee);text-align:center;">
              <div style="font-size:28px;font-weight:700;color:${text};letter-spacing:-0.5px;">${productName}</div>
            </div>
          </div>
        </div>`;

    case 'gradient-overlay':
      return `
        <div style="width:1080px;height:1080px;position:relative;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;">
          <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;" alt="${productName}" />
          <div style="position:absolute;bottom:0;left:0;right:0;height:45%;background:linear-gradient(transparent, ${primary}dd, ${secondary}ee);display:flex;flex-direction:column;justify-content:flex-end;padding:40px;">
            <div style="font-size:42px;font-weight:800;color:#fff;text-shadow:0 2px 8px #0004;margin-bottom:8px;">${productName}</div>
            <div style="font-size:22px;color:#ffffffcc;">by ${brand.name}</div>
            <div style="margin-top:16px;display:inline-flex;background:${accent};color:${bg};font-size:24px;font-weight:700;padding:10px 28px;border-radius:12px;width:fit-content;">$${price}</div>
          </div>
        </div>`;

    case 'badge-style':
      return `
        <div style="width:1080px;height:1080px;position:relative;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;">
          <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;" alt="${productName}" />
          <div style="position:absolute;top:30px;right:30px;background:${accent};color:${bg};font-size:28px;font-weight:800;padding:14px 24px;border-radius:16px;box-shadow:0 8px 24px ${accent}60;">$${price}</div>
          <div style="position:absolute;top:30px;left:30px;background:${primary}ee;backdrop-filter:blur(12px);color:#fff;padding:14px 24px;border-radius:16px;display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:10px;background:${secondary};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;">${brand.name.charAt(0)}</div>
            <div style="font-size:18px;font-weight:600;">${brand.name}</div>
          </div>
          <div style="position:absolute;bottom:0;left:0;right:0;background:${bg}ee;backdrop-filter:blur(8px);padding:24px 30px;text-align:center;">
            <div style="font-size:26px;font-weight:700;color:${text};">${productName}</div>
          </div>
        </div>`;

    case 'lifestyle-mock':
      return `
        <div style="width:1080px;height:1080px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, ${bg} 0%, ${primary}15 50%, ${secondary}15 100%);font-family:system-ui,-apple-system,sans-serif;">
          <div style="position:relative;">
            <!-- Desk/device mockup -->
            <div style="width:720px;background:#222;border-radius:20px;padding:12px;box-shadow:0 40px 80px #0005, 0 0 0 1px #333;">
              <div style="background:#333;border-radius:12px 12px 0 0;padding:8px 16px;display:flex;align-items:center;gap:6px;">
                <div style="width:10px;height:10px;border-radius:50%;background:#f44;"></div>
                <div style="width:10px;height:10px;border-radius:50%;background:#fa3;"></div>
                <div style="width:10px;height:10px;border-radius:50%;background:#4d4;"></div>
                <div style="flex:1;text-align:center;font-size:11px;color:#888;">${brand.name} Store</div>
              </div>
              <div style="aspect-ratio:16/10;overflow:hidden;border-radius:0 0 8px 8px;">
                <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;" alt="${productName}" />
              </div>
            </div>
            <!-- Stand -->
            <div style="width:200px;height:20px;background:#333;border-radius:0 0 12px 12px;margin:0 auto;"></div>
            <div style="width:300px;height:8px;background:#2a2a2a;border-radius:8px;margin:0 auto;"></div>
            <!-- Product info below -->
            <div style="text-align:center;margin-top:30px;">
              <div style="font-size:28px;font-weight:700;color:${text};">${productName}</div>
              <div style="font-size:20px;color:${accent};font-weight:600;margin-top:4px;">$${price}</div>
            </div>
          </div>
        </div>`;

    default:
      return `<div style="width:1080px;height:1080px;display:flex;align-items:center;justify-content:center;background:${bg};"><img src="${imgSrc}" style="max-width:90%;max-height:90%;object-fit:contain;" alt="${productName}" /></div>`;
  }
}

export default function ProductAssets({ brand, onBrandUpdate }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('clean-frame');
  const [bulkStyle, setBulkStyle] = useState(null);
  const [reactions, setReactions] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const products = useMemo(() => {
    return (brand.images || []).map(img => ({
      id: img.id,
      name: img.name || 'Product',
      price: img.price || '29.99',
      description: img.description || '',
      image: img.data || img.url,
    }));
  }, [brand]);

  const styledPreviews = useMemo(() => {
    if (!selectedProduct) return [];
    return REBRAND_STYLES.map(style => ({
      ...style,
      html: generateStyledHtml(style.id, selectedProduct, brand),
    }));
  }, [selectedProduct, brand]);

  const bulkPreviews = useMemo(() => {
    if (!bulkStyle) return [];
    return products.map(product => ({
      product,
      html: generateStyledHtml(bulkStyle, product, brand),
    }));
  }, [bulkStyle, products, brand]);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveAssets = async () => {
    if (!bulkStyle || bulkPreviews.length === 0) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/${brand.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: bulkPreviews.map(bp => ({
            productId: bp.product.id,
            productName: bp.product.name,
            style: bulkStyle,
            html: bp.html,
          })),
        }),
      });
      onBrandUpdate();
    } catch (err) {
      console.error('Failed to save assets:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Product Selector */}
      <section>
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <span>📷</span> Select a Product to Rebrand
        </h3>

        {products.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <div className="text-5xl mb-3">📷</div>
            <p>No product images. Upload some in the Brands tab first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {products.map(product => {
              const isSelected = selectedProduct?.id === product.id;
              return (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(isSelected ? null : product)}
                  className={`rounded-xl overflow-hidden border-2 transition-all text-left ${
                    isSelected
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'border-slate-700/30 hover:border-slate-600'
                  }`}
                >
                  <div className="aspect-square bg-gray-800 overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2 bg-slate-800/40">
                    <p className="text-xs font-medium text-gray-200 truncate">{product.name}</p>
                    <p className="text-xs text-green-400">${product.price}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Rebranding Preview */}
      {selectedProduct && (
        <section>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <span>🎨</span> Rebranding Styles — {selectedProduct.name}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {styledPreviews.map(preview => {
              const previewId = `${selectedProduct.id}_${preview.id}`;
              return (
                <div key={preview.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
                  {/* Style Info */}
                  <div className="p-4 border-b border-slate-700/30">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <span>{preview.icon}</span>
                      {preview.name}
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">{preview.description}</p>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-900 p-4">
                    <div className="aspect-square max-w-md mx-auto rounded-lg overflow-hidden border border-slate-700/30">
                      <iframe
                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;overflow:hidden;display:flex;align-items:center;justify-content:center;}body>div{transform:scale(0.37);transform-origin:center center;}</style></head><body>${preview.html}</body></html>`}
                        className="w-full h-full border-0"
                        title={preview.name}
                        sandbox="allow-scripts"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setReactions(prev => ({
                        ...prev,
                        [previewId]: prev[previewId] === 'like' ? null : 'like',
                      }))}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                        reactions[previewId] === 'like'
                          ? 'bg-green-600/30 text-green-400 border border-green-500/30'
                          : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                      }`}
                    >
                      👍 Like
                    </button>
                    <button
                      onClick={() => setReactions(prev => ({
                        ...prev,
                        [previewId]: prev[previewId] === 'dislike' ? null : 'dislike',
                      }))}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                        reactions[previewId] === 'dislike'
                          ? 'bg-red-600/30 text-red-400 border border-red-500/30'
                          : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                      }`}
                    >
                      👎 Dislike
                    </button>
                    <button
                      onClick={() => copyToClipboard(preview.html, previewId)}
                      className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      📋 {copiedId === previewId ? 'Copied!' : 'Copy HTML'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bulk Rebrand */}
      {products.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <span>⚡</span> Bulk Rebrand
          </h3>
          <p className="text-sm text-slate-400 mb-4">Apply a single style to ALL your products</p>

          <div className="flex flex-wrap gap-3 mb-4">
            {REBRAND_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => setBulkStyle(bulkStyle === style.id ? null : style.id)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  bulkStyle === style.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800/40 text-slate-300 border border-slate-600/30 hover:bg-indigo-950/50 hover:text-slate-200 hover:border-indigo-500/20'
                }`}
              >
                <span>{style.icon}</span>
                {style.name}
              </button>
            ))}
          </div>

          {bulkStyle && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                {bulkPreviews.map((bp, i) => (
                  <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
                    <div className="aspect-square bg-gray-900 p-2">
                      <iframe
                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;overflow:hidden;display:flex;align-items:center;justify-content:center;}body>div{transform:scale(0.25);transform-origin:center center;}</style></head><body>${bp.html}</body></html>`}
                        className="w-full h-full border-0 rounded-lg"
                        title={bp.product.name}
                        sandbox="allow-scripts"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-200 truncate">{bp.product.name}</p>
                      <p className="text-xs text-green-400">${bp.product.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Export */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveAssets}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    '💾'
                  )}
                  Save All Assets
                </button>
                <button
                  onClick={() => {
                    const allHtml = bulkPreviews.map(bp =>
                      `<!-- ${bp.product.name} -->\n${bp.html}`
                    ).join('\n\n');
                    copyToClipboard(allHtml, 'bulk_all');
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  📋 {copiedId === 'bulk_all' ? 'Copied!' : 'Download All (HTML)'}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* AI Rebranding Placeholder */}
      <section className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
          <span>🤖</span> AI-Powered Image Rebranding
        </h3>
        <div className="bg-gray-900/50 border border-slate-700/30 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">🔮</div>
          <p className="text-gray-300 mb-2">Unlock AI-Powered Image Rebranding</p>
          <p className="text-sm text-slate-500 mb-4">
            Connect your Claude API key in settings to unlock intelligent image rebranding — automatically adjust colors, add brand elements, and generate lifestyle mockups using AI.
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Enter Claude API key..."
                className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  if (apiKey) {
                    localStorage.setItem('de_claude_api_key', apiKey);
                    alert('API key saved! AI rebranding features coming soon.');
                  }
                }}
                disabled={!apiKey}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
