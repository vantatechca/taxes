import { useState, useCallback, useMemo } from 'react';
import { BANNER_STYLES, generateBanner, getRandomStyles } from './bannerTemplates';

const API_BASE = '/api/brands';

const FEEDBACK_TAGS = ['Colors', 'Layout', 'Animation', 'Typography', 'Too busy', 'Too plain', 'Product placement'];

export default function BannerGenerator({ brand, onBrandUpdate }) {
  const [banners, setBanners] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [usedStyles, setUsedStyles] = useState([]);
  const [feedbackOpen, setFeedbackOpen] = useState({}); // { bannerId: 'like' | 'dislike' }
  const [feedbackTags, setFeedbackTags] = useState({}); // { bannerId: string[] }
  const [feedbackNotes, setFeedbackNotes] = useState({}); // { bannerId: string }
  const [codeOpen, setCodeOpen] = useState({}); // { bannerId: boolean }
  const [reactions, setReactions] = useState({}); // { bannerId: 'like' | 'dislike' }
  const [copiedId, setCopiedId] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  const primaryBanner = useMemo(() => {
    return (brand.banners || []).find(b => b.isPrimary || b.selected);
  }, [brand]);

  const generateBanners = useCallback(async (excludeStyles = []) => {
    setGenerating(true);
    try {
      const styles = getRandomStyles(6, excludeStyles);
      const colors = brand.colors || ['#6366f1', '#8b5cf6', '#f59e0b', '#1e1b4b', '#f3f4f6'];
      const images = (brand.images || []).map(img => img.data || img.url);
      const products = (brand.images || []).map(img => ({
        name: img.name || 'Product',
        price: img.price || '29.99',
        image: img.data || img.url,
      }));

      const generated = styles.map(style => {
        const result = generateBanner(style.id, {
          brandName: brand.name,
          niche: brand.niche,
          colors,
          productImages: images,
          products,
          tagline: brand.description || `Premium ${brand.niche} templates`,
        });
        return {
          id: `banner_${Date.now()}_${style.id}`,
          styleId: style.id,
          styleName: style.name,
          styleDescription: style.description,
          previewHtml: result.previewHtml || result.html,
          combinedHtml: result.combinedHtml || result.html,
          liquidCode: result.liquidCode || result.liquid || '',
          timestamp: new Date().toISOString(),
        };
      });

      setBanners(generated);
      setUsedStyles(prev => [...prev, ...styles.map(s => s.id)]);

      // Save to server
      try {
        await fetch(`${API_BASE}/${brand.id}/banners`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ banners: generated }),
        });
        onBrandUpdate();
      } catch (err) {
        console.error('Failed to save banners:', err);
      }
    } catch (err) {
      console.error('Failed to generate banners:', err);
    } finally {
      setGenerating(false);
    }
  }, [brand, onBrandUpdate]);

  const handleReaction = (bannerId, action) => {
    setReactions(prev => {
      const current = prev[bannerId];
      if (current === action) {
        // Toggle off
        const next = { ...prev };
        delete next[bannerId];
        setFeedbackOpen(fo => { const n = { ...fo }; delete n[bannerId]; return n; });
        return next;
      }
      return { ...prev, [bannerId]: action };
    });
    setFeedbackOpen(prev => ({ ...prev, [bannerId]: action }));
  };

  const handleFeedbackTagToggle = (bannerId, tag) => {
    setFeedbackTags(prev => {
      const current = prev[bannerId] || [];
      if (current.includes(tag)) {
        return { ...prev, [bannerId]: current.filter(t => t !== tag) };
      }
      return { ...prev, [bannerId]: [...current, tag] };
    });
  };

  const submitFeedback = async (banner) => {
    const action = reactions[banner.id];
    const tags = feedbackTags[banner.id] || [];
    const note = feedbackNotes[banner.id] || '';

    try {
      await fetch(`${API_BASE}/brain/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: brand.niche,
          bannerId: banner.id,
          styleName: banner.styleName,
          action,
          tags,
          note,
        }),
      });

      // Also update banner on server
      try {
        await fetch(`${API_BASE}/${brand.id}/banners/${banner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback: { action, tags, note } }),
        });
      } catch (e) { /* ignore */ }

      // Close feedback panel
      setFeedbackOpen(prev => { const n = { ...prev }; delete n[banner.id]; return n; });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleSelectPrimary = async (banner) => {
    try {
      await fetch(`${API_BASE}/${brand.id}/banners/${banner.id}/select`, {
        method: 'POST',
      });
      onBrandUpdate();
    } catch (err) {
      console.error('Failed to set primary:', err);
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const submitPrompt = async () => {
    if (!promptText.trim()) return;
    setSavingPrompt(true);
    try {
      await fetch(`${API_BASE}/brain/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: brand.niche,
          text: promptText,
          category: 'general',
        }),
      });
      setPromptText('');
    } catch (err) {
      console.error('Failed to save prompt:', err);
    } finally {
      setSavingPrompt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Brand Info Bar */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 flex flex-wrap items-center gap-6">
        <div>
          <h3 className="text-white font-semibold">{brand.name}</h3>
          <span className="text-xs text-indigo-300">{brand.niche}</span>
        </div>
        <div className="flex gap-1.5">
          {Object.values(brand.colors || {}).slice(0, 5).map((c, i) => (
            <div key={i} className="w-5 h-5 rounded-full border border-slate-600" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="text-sm text-slate-400">
          📷 {(brand.images || []).length} products
        </div>
        <div className="text-sm text-slate-400">
          🎨 {(brand.banners || []).length} banners saved
        </div>
      </div>

      {/* Primary Banner */}
      {primaryBanner && (
        <div className="bg-slate-800/40 border border-indigo-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-indigo-600/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30">
              ⭐ Current Banner
            </span>
            <span className="text-sm text-slate-400">{primaryBanner.styleName}</span>
          </div>
          <div className="aspect-video w-full max-w-2xl rounded-lg overflow-hidden border border-slate-700/30">
            <iframe
              srcDoc={primaryBanner.previewHtml || primaryBanner.combinedHtml}
              className="w-full h-full border-0"
              title="Primary banner"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex gap-3">
        <button
          onClick={() => generateBanners([])}
          disabled={generating}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            <>🎨 Generate 6 Banners</>
          )}
        </button>

        {banners.length > 0 && (
          <button
            onClick={() => generateBanners(usedStyles)}
            disabled={generating}
            className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            🔄 Generate More
          </button>
        )}
      </div>

      {/* Generating Animation */}
      {generating && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-3 rounded-full border-4 border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <p className="text-gray-300 font-medium">Creating 6 unique banner styles...</p>
            <p className="text-sm text-slate-500 mt-1">Using {brand.niche} color palette</p>
          </div>
        </div>
      )}

      {/* Banner Grid */}
      {!generating && banners.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {banners.map(banner => (
            <div key={banner.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
              {/* Banner Preview */}
              <div className="aspect-video w-full relative bg-gray-900">
                <iframe
                  srcDoc={banner.previewHtml}
                  className="w-full h-full border-0"
                  title={banner.styleName}
                  sandbox="allow-scripts"
                />
              </div>

              {/* Banner Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-white">{banner.styleName}</h4>
                  <p className="text-sm text-slate-400">{banner.styleDescription}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleReaction(banner.id, 'like')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                      reactions[banner.id] === 'like'
                        ? 'bg-green-600/30 text-green-400 border border-green-500/30'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                    }`}
                  >
                    👍 Like
                  </button>
                  <button
                    onClick={() => handleReaction(banner.id, 'dislike')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                      reactions[banner.id] === 'dislike'
                        ? 'bg-red-600/30 text-red-400 border border-red-500/30'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                    }`}
                  >
                    👎 Dislike
                  </button>
                  <button
                    onClick={() => copyToClipboard(banner.combinedHtml, `html_${banner.id}`)}
                    className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    📋 {copiedId === `html_${banner.id}` ? 'Copied!' : 'Copy HTML'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(banner.liquidCode, `liq_${banner.id}`)}
                    className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    📋 {copiedId === `liq_${banner.id}` ? 'Copied!' : 'Copy Liquid'}
                  </button>
                  <button
                    onClick={() => handleSelectPrimary(banner)}
                    className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    ⭐ Select as Primary
                  </button>
                  <button
                    onClick={() => setCodeOpen(prev => ({ ...prev, [banner.id]: !prev[banner.id] }))}
                    className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    👁️ {codeOpen[banner.id] ? 'Hide' : 'View'} Code
                  </button>
                </div>

                {/* Feedback Panel */}
                {feedbackOpen[banner.id] && (
                  <div className="bg-gray-900/50 border border-slate-700/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-gray-300 font-medium">
                      What did you {feedbackOpen[banner.id] === 'like' ? '👍 like' : '👎 dislike'}?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {FEEDBACK_TAGS.map(tag => {
                        const selected = (feedbackTags[banner.id] || []).includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => handleFeedbackTagToggle(banner.id, tag)}
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
                      value={feedbackNotes[banner.id] || ''}
                      onChange={e => setFeedbackNotes(prev => ({ ...prev, [banner.id]: e.target.value }))}
                      placeholder="Add a note (optional)..."
                      className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => submitFeedback(banner)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      Submit Feedback
                    </button>
                  </div>
                )}

                {/* Code Panel */}
                {codeOpen[banner.id] && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 font-medium">HTML</span>
                        <button
                          onClick={() => copyToClipboard(banner.combinedHtml, `code_html_${banner.id}`)}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          {copiedId === `code_html_${banner.id}` ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="bg-gray-900 border border-slate-700/30 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                        {banner.combinedHtml}
                      </pre>
                    </div>
                    {banner.liquidCode && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500 font-medium">Shopify Liquid</span>
                          <button
                            onClick={() => copyToClipboard(banner.liquidCode, `code_liq_${banner.id}`)}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            {copiedId === `code_liq_${banner.id}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre className="bg-gray-900 border border-slate-700/30 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                          {banner.liquidCode}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!generating && banners.length === 0 && (
        <div className="text-center text-slate-500 py-12">
          <div className="text-5xl mb-3">🎨</div>
          <p className="text-lg">Ready to create banner magic</p>
          <p className="text-sm mt-1">Click "Generate 6 Banners" to get started</p>
        </div>
      )}

      {/* Prompt Area */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          🧠 Tell the AI what you want...
        </h4>
        <div className="flex gap-3">
          <textarea
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            placeholder="e.g., I want more minimalist banners with subtle animations, softer colors..."
            rows={2}
            className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <button
            onClick={submitPrompt}
            disabled={!promptText.trim() || savingPrompt}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 self-end flex items-center gap-2"
          >
            {savingPrompt ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              '💬'
            )}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
