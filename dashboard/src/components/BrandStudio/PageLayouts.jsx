import { useState, useMemo } from 'react';
import { HOMEPAGE_LAYOUTS, PRODUCT_PAGE_LAYOUTS, generateHomepage, generateProductPage } from './layoutTemplates';

const API_BASE = '/api/brands';

const FEEDBACK_TAGS = ['Colors', 'Layout', 'Animation', 'Typography', 'Too busy', 'Too plain', 'Content flow'];

export default function PageLayouts({ brand, onBrandUpdate }) {
  const [generatedLayouts, setGeneratedLayouts] = useState({});
  const [generating, setGenerating] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState({});
  const [feedbackTags, setFeedbackTags] = useState({});
  const [feedbackNotes, setFeedbackNotes] = useState({});
  const [reactions, setReactions] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [layoutFilter, setLayoutFilter] = useState('all');
  const [previewExpanded, setPreviewExpanded] = useState(null);

  const colors = brand.colors || ['#6366f1', '#8b5cf6', '#f59e0b', '#1e1b4b', '#f3f4f6'];
  const products = (brand.images || []).map(img => ({
    name: img.name || 'Product',
    price: img.price || '29.99',
    image: img.data || img.url,
    description: img.description || 'Premium digital template',
  }));

  const primaryBanner = useMemo(() => {
    return (brand.banners || []).find(b => b.isPrimary || b.selected);
  }, [brand]);

  const savedLayouts = useMemo(() => {
    const layouts = brand.layouts || [];
    if (layoutFilter === 'all') return layouts;
    return layouts.filter(l => l.type === layoutFilter);
  }, [brand, layoutFilter]);

  const handleGenerateHomepage = async (layoutId) => {
    setGenerating(`home_${layoutId}`);
    try {
      const result = generateHomepage(layoutId, {
        brandName: brand.name,
        niche: brand.niche,
        colors,
        products,
        bannerHtml: primaryBanner?.previewHtml || primaryBanner?.combinedHtml || '',
        tagline: brand.description || `Premium ${brand.niche} solutions`,
      });

      const layout = {
        id: `layout_home_${layoutId}_${Date.now()}`,
        type: 'homepage',
        layoutId,
        layoutName: HOMEPAGE_LAYOUTS.find(l => l.id === layoutId)?.name || layoutId,
        html: result.html,
        liquidCode: result.liquidCode || result.liquid || '',
        timestamp: new Date().toISOString(),
      };

      setGeneratedLayouts(prev => ({ ...prev, [`home_${layoutId}`]: layout }));

      // Save to server
      try {
        await fetch(`${API_BASE}/${brand.id}/layouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout }),
        });
        onBrandUpdate();
      } catch (err) {
        console.error('Failed to save layout:', err);
      }
    } catch (err) {
      console.error('Failed to generate homepage:', err);
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateProductPage = async (layoutId) => {
    const product = selectedProduct || products[0];
    if (!product) return;

    setGenerating(`prod_${layoutId}`);
    try {
      const result = generateProductPage(layoutId, {
        brandName: brand.name,
        niche: brand.niche,
        colors,
        product,
        relatedProducts: products.filter(p => p !== product).slice(0, 4),
        tagline: brand.description || `Premium ${brand.niche} solutions`,
      });

      const layout = {
        id: `layout_prod_${layoutId}_${Date.now()}`,
        type: 'product',
        layoutId,
        layoutName: PRODUCT_PAGE_LAYOUTS.find(l => l.id === layoutId)?.name || layoutId,
        productName: product.name,
        html: result.html,
        liquidCode: result.liquidCode || result.liquid || '',
        timestamp: new Date().toISOString(),
      };

      setGeneratedLayouts(prev => ({ ...prev, [`prod_${layoutId}`]: layout }));

      try {
        await fetch(`${API_BASE}/${brand.id}/layouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout }),
        });
        onBrandUpdate();
      } catch (err) {
        console.error('Failed to save layout:', err);
      }
    } catch (err) {
      console.error('Failed to generate product page:', err);
    } finally {
      setGenerating(null);
    }
  };

  const handleSelectPrimary = async (layout) => {
    try {
      await fetch(`${API_BASE}/${brand.id}/layouts/${layout.id}/select`, {
        method: 'POST',
      });
      onBrandUpdate();
    } catch (err) {
      console.error('Failed to set primary layout:', err);
    }
  };

  const handleReaction = (layoutId, action) => {
    setReactions(prev => {
      if (prev[layoutId] === action) {
        const next = { ...prev };
        delete next[layoutId];
        setFeedbackOpen(fo => { const n = { ...fo }; delete n[layoutId]; return n; });
        return next;
      }
      return { ...prev, [layoutId]: action };
    });
    setFeedbackOpen(prev => ({ ...prev, [layoutId]: action }));
  };

  const handleFeedbackTagToggle = (layoutId, tag) => {
    setFeedbackTags(prev => {
      const current = prev[layoutId] || [];
      return {
        ...prev,
        [layoutId]: current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag],
      };
    });
  };

  const submitFeedback = async (layout) => {
    const action = reactions[layout.id];
    const tags = feedbackTags[layout.id] || [];
    const note = feedbackNotes[layout.id] || '';

    try {
      await fetch(`${API_BASE}/brain/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: brand.niche,
          bannerId: layout.id,
          styleName: layout.layoutName,
          action,
          tags,
          note,
        }),
      });
      setFeedbackOpen(prev => { const n = { ...prev }; delete n[layout.id]; return n; });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

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

  const renderLayoutCard = (layout, type, onGenerate) => {
    const key = `${type}_${layout.id}`;
    const generated = generatedLayouts[key];
    const isGenerating = generating === key;
    const isSelected = (brand.layouts || []).some(l => l.layoutId === layout.id && l.type === type && (l.isPrimary || l.selected));

    return (
      <div key={layout.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold text-white flex items-center gap-2">
              {layout.name}
              {isSelected && (
                <span className="text-xs bg-green-600/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </h4>
            <p className="text-sm text-slate-400 mt-1">{layout.description}</p>
          </div>
        </div>

        <button
          onClick={() => onGenerate(layout.id)}
          disabled={isGenerating}
          className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            <>🔧 Generate</>
          )}
        </button>

        {/* Generated Preview */}
        {generated && (
          <div className="mt-4 space-y-3">
            <div
              className="w-full rounded-lg overflow-hidden border border-slate-700/30 bg-white cursor-pointer"
              onClick={() => setPreviewExpanded(previewExpanded === generated.id ? null : generated.id)}
              style={{ minHeight: previewExpanded === generated.id ? '600px' : '300px' }}
            >
              <iframe
                srcDoc={generated.html}
                className="w-full border-0"
                style={{ height: previewExpanded === generated.id ? '600px' : '300px' }}
                title={generated.layoutName}
                sandbox="allow-scripts"
              />
            </div>
            <p className="text-xs text-slate-500 text-center">
              {previewExpanded === generated.id ? 'Click to collapse' : 'Click to expand preview'}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleReaction(generated.id, 'like')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                  reactions[generated.id] === 'like'
                    ? 'bg-green-600/30 text-green-400 border border-green-500/30'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                }`}
              >
                👍 Like
              </button>
              <button
                onClick={() => handleReaction(generated.id, 'dislike')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                  reactions[generated.id] === 'dislike'
                    ? 'bg-red-600/30 text-red-400 border border-red-500/30'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                }`}
              >
                👎 Dislike
              </button>
              <button
                onClick={() => copyToClipboard(generated.html, `html_${generated.id}`)}
                className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                📋 {copiedId === `html_${generated.id}` ? 'Copied!' : 'Copy HTML'}
              </button>
              {generated.liquidCode && (
                <button
                  onClick={() => copyToClipboard(generated.liquidCode, `liq_${generated.id}`)}
                  className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  📋 {copiedId === `liq_${generated.id}` ? 'Copied!' : 'Copy Liquid'}
                </button>
              )}
              <button
                onClick={() => handleSelectPrimary(generated)}
                className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                ⭐ Set Primary
              </button>
            </div>

            {/* Feedback Panel */}
            {feedbackOpen[generated.id] && (
              <div className="bg-gray-900/50 border border-slate-700/30 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-300 font-medium">
                  What did you {feedbackOpen[generated.id] === 'like' ? '👍 like' : '👎 dislike'}?
                </p>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TAGS.map(tag => {
                    const selected = (feedbackTags[generated.id] || []).includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleFeedbackTagToggle(generated.id, tag)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          selected
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-600/50 hover:border-slate-500'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{tag}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={feedbackNotes[generated.id] || ''}
                  onChange={e => setFeedbackNotes(prev => ({ ...prev, [generated.id]: e.target.value }))}
                  placeholder="Add a note (optional)..."
                  className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => submitFeedback(generated)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Homepage Layouts */}
      <section>
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <span>🏠</span> Homepage Layouts
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Full homepage designs for your Shopify store
          {primaryBanner && <span className="text-indigo-400"> — includes your selected banner</span>}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(HOMEPAGE_LAYOUTS || []).slice(0, 4).map(layout =>
            renderLayoutCard(layout, 'home', handleGenerateHomepage)
          )}
        </div>
      </section>

      {/* Product Page Layouts */}
      <section>
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <span>📦</span> Product Page Layouts
        </h3>

        {/* Product Selector */}
        {products.length > 0 ? (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Preview with product:</label>
            <select
              value={selectedProduct?.name || ''}
              onChange={e => {
                const prod = products.find(p => p.name === e.target.value);
                setSelectedProduct(prod || null);
              }}
              className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-indigo-500 max-w-md"
            >
              <option value="">Select a product...</option>
              {products.map((p, i) => (
                <option key={i} value={p.name}>{p.name} - ${p.price}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 mb-4 text-sm text-slate-400">
            📷 Upload product images in the Brands tab to preview product page layouts
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(PRODUCT_PAGE_LAYOUTS || []).slice(0, 4).map(layout =>
            renderLayoutCard(layout, 'prod', handleGenerateProductPage)
          )}
        </div>
      </section>

      {/* Saved Layouts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>💾</span> Saved Layouts
            <span className="text-sm font-normal text-slate-500">({savedLayouts.length})</span>
          </h3>
          <div className="flex gap-2">
            {['all', 'homepage', 'product'].map(filter => (
              <button
                key={filter}
                onClick={() => setLayoutFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  layoutFilter === filter
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800/40 text-slate-300 border border-slate-600/30 hover:bg-indigo-950/50 hover:text-slate-200 hover:border-indigo-500/20'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'homepage' ? '🏠 Homepage' : '📦 Product'}
              </button>
            ))}
          </div>
        </div>

        {savedLayouts.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <div className="text-5xl mb-3">📄</div>
            <p>No saved layouts yet. Generate some above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedLayouts.map(layout => (
              <div
                key={layout.id}
                className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden cursor-pointer hover:border-slate-600 transition-colors"
                onClick={() => setPreviewExpanded(previewExpanded === layout.id ? null : layout.id)}
              >
                <div className="h-48 bg-white overflow-hidden">
                  <iframe
                    srcDoc={layout.html}
                    className="w-full h-full border-0 pointer-events-none"
                    title={layout.layoutName}
                    sandbox="allow-scripts"
                    style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{layout.type === 'homepage' ? '🏠' : '📦'}</span>
                    <h4 className="text-sm font-medium text-white truncate">{layout.layoutName}</h4>
                    {(layout.isPrimary || layout.selected) && (
                      <span className="text-xs bg-green-600/20 text-green-400 px-1.5 py-0.5 rounded-full">Primary</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(layout.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
