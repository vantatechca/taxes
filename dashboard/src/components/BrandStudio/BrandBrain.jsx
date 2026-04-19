import { useState, useEffect, useCallback, useMemo } from 'react';
import { BANNER_STYLES, getRandomStyles, generateBanner } from './bannerTemplates';

const API_BASE = '/api/brands';

const NICHES = [
  'Wedding Planning', 'Startup Kits', 'Resume & Career', 'Personal Finance',
  'Meal Planning', 'Fitness & Workout', 'Home Organization', 'Parenting & Baby',
  'Event Planning', 'Social Media', 'Pet Care', 'Real Estate',
];

const BRAIN_TABS = [
  { id: 'dna', label: 'Style DNA', icon: '🧬' },
  { id: 'feedback', label: 'Feedback History', icon: '📝' },
  { id: 'prompts', label: 'Suggestions', icon: '💬' },
  { id: 'niches', label: 'Niche Profiles', icon: '🗂️' },
  { id: 'teach', label: 'Teach Me', icon: '🎓' },
];

const PROMPT_CATEGORIES = ['colors', 'layout', 'animation', 'general'];

export default function BrandBrain({ brand, brands }) {
  const [activeTab, setActiveTab] = useState('dna');
  const [preferences, setPreferences] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [promptsList, setPromptsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('all');

  // Teaching state
  const [teachPair, setTeachPair] = useState(null);
  const [teachSliders, setTeachSliders] = useState({
    animationLevel: 50,
    colorWarmth: 50,
    layoutComplexity: 50,
  });
  const [teachText, setTeachText] = useState('');

  // Prompt form
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('general');
  const [savingPrompt, setSavingPrompt] = useState(false);

  const currentNiche = brand?.niche || '';

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/brain/preferences`);
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
        // Cache locally
        try {
          localStorage.setItem('de_brand_preferences', JSON.stringify(data));
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
      // Try from cache
      try {
        const cached = localStorage.getItem('de_brand_preferences');
        if (cached) setPreferences(JSON.parse(cached));
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/brain/preferences`);
      if (res.ok) {
        const data = await res.json();
        const allFeedback = data.feedback || data.allFeedback || [];
        setFeedbackList(allFeedback);
        try {
          localStorage.setItem('de_brand_feedback', JSON.stringify(allFeedback));
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      try {
        const cached = localStorage.getItem('de_brand_feedback');
        if (cached) setFeedbackList(JSON.parse(cached));
      } catch { /* ignore */ }
    }
  }, []);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/brain/prompts`);
      if (res.ok) {
        const data = await res.json();
        setPromptsList(data.prompts || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
    fetchFeedback();
    fetchPrompts();
  }, [fetchPreferences, fetchFeedback, fetchPrompts]);

  // Computed preference stats for current niche
  const nichePrefs = useMemo(() => {
    if (!preferences || !currentNiche) return null;
    const nicheFb = feedbackList.filter(f => f.niche === currentNiche);
    const likes = nicheFb.filter(f => f.action === 'like');
    const dislikes = nicheFb.filter(f => f.action === 'dislike');

    // Analyze tag frequencies
    const likedTags = {};
    const dislikedTags = {};
    likes.forEach(f => (f.tags || []).forEach(t => { likedTags[t] = (likedTags[t] || 0) + 1; }));
    dislikes.forEach(f => (f.tags || []).forEach(t => { dislikedTags[t] = (dislikedTags[t] || 0) + 1; }));

    // Calculate preference axes
    const animationLike = (likedTags['Animation'] || 0);
    const animationDislike = (dislikedTags['Animation'] || 0) + (dislikedTags['Too busy'] || 0);
    const colorLike = (likedTags['Colors'] || 0);
    const colorDislike = (dislikedTags['Colors'] || 0) + (dislikedTags['Too plain'] || 0);
    const layoutLike = (likedTags['Layout'] || 0);
    const layoutDislike = (dislikedTags['Layout'] || 0);
    const typoLike = (likedTags['Typography'] || 0);
    const typoDislike = (dislikedTags['Typography'] || 0);

    const calcAxis = (like, dislike) => {
      const total = like + dislike;
      if (total === 0) return 50;
      return Math.round((like / total) * 100);
    };

    // Style category distribution (for donut chart)
    const styleDist = {};
    likes.forEach(f => {
      const name = f.styleName || 'Unknown';
      styleDist[name] = (styleDist[name] || 0) + 1;
    });

    return {
      totalFeedback: nicheFb.length,
      likes: likes.length,
      dislikes: dislikes.length,
      animation: calcAxis(animationLike, animationDislike),
      colorIntensity: calcAxis(colorLike, colorDislike),
      layoutDensity: calcAxis(layoutLike, layoutDislike),
      typography: calcAxis(typoLike, typoDislike),
      likedTags,
      dislikedTags,
      styleDist,
    };
  }, [preferences, feedbackList, currentNiche]);

  // Niche profiles for all niches
  const nicheProfiles = useMemo(() => {
    return NICHES.map(niche => {
      const nicheBrands = (brands || []).filter(b => b.niche === niche);
      const nicheFb = feedbackList.filter(f => f.niche === niche);
      const likes = nicheFb.filter(f => f.action === 'like');
      const dislikes = nicheFb.filter(f => f.action === 'dislike');

      const likedStyles = {};
      likes.forEach(f => {
        const name = f.styleName || 'Unknown';
        likedStyles[name] = (likedStyles[name] || 0) + 1;
      });

      const dislikedElements = {};
      dislikes.forEach(f => {
        (f.tags || []).forEach(t => { dislikedElements[t] = (dislikedElements[t] || 0) + 1; });
      });

      return {
        niche,
        brandCount: nicheBrands.length,
        feedbackCount: nicheFb.length,
        likeCount: likes.length,
        dislikeCount: dislikes.length,
        topLiked: Object.entries(likedStyles).sort((a, b) => b[1] - a[1]).slice(0, 3),
        topDisliked: Object.entries(dislikedElements).sort((a, b) => b[1] - a[1]).slice(0, 3),
      };
    });
  }, [brands, feedbackList]);

  const filteredFeedback = useMemo(() => {
    let list = feedbackList;
    if (currentNiche) {
      list = list.filter(f => f.niche === currentNiche);
    }
    if (feedbackFilter === 'likes') {
      list = list.filter(f => f.action === 'like');
    } else if (feedbackFilter === 'dislikes') {
      list = list.filter(f => f.action === 'dislike');
    }
    return list.sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0));
  }, [feedbackList, currentNiche, feedbackFilter]);

  const nichePrompts = useMemo(() => {
    if (!currentNiche) return promptsList;
    return promptsList.filter(p => p.niche === currentNiche);
  }, [promptsList, currentNiche]);

  const handleDeleteFeedback = async (id) => {
    try {
      await fetch(`${API_BASE}/brain/feedback/${id}`, { method: 'DELETE' });
      setFeedbackList(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    }
  };

  const handleAddPrompt = async () => {
    if (!newPromptText.trim() || !currentNiche) return;
    setSavingPrompt(true);
    try {
      const res = await fetch(`${API_BASE}/brain/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: currentNiche,
          text: newPromptText,
          category: newPromptCategory,
        }),
      });
      if (res.ok) {
        setNewPromptText('');
        fetchPrompts();
      }
    } catch (err) {
      console.error('Failed to save prompt:', err);
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleDeletePrompt = async (id) => {
    try {
      await fetch(`${API_BASE}/brain/prompt/${id}`, { method: 'DELETE' });
      setPromptsList(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const handleResetPreferences = async () => {
    if (!confirm(`Reset all preferences for "${currentNiche}"? This will clear all feedback for this niche.`)) return;
    // Delete all feedback for this niche
    const nicheFb = feedbackList.filter(f => f.niche === currentNiche);
    for (const fb of nicheFb) {
      try {
        await fetch(`${API_BASE}/brain/feedback/${fb.id}`, { method: 'DELETE' });
      } catch { /* ignore */ }
    }
    setFeedbackList(prev => prev.filter(f => f.niche !== currentNiche));
    fetchPreferences();
  };

  // Teaching: generate a pair of banners to compare
  const generateTeachPair = useCallback(() => {
    if (!brand) return;
    const styles = getRandomStyles(2);
    const colors = brand.colors || ['#6366f1', '#8b5cf6', '#f59e0b', '#1e1b4b', '#f3f4f6'];
    const images = (brand.images || []).map(img => img.data || img.url);

    const pair = styles.map(style => {
      const result = generateBanner(style.id, {
        brandName: brand.name,
        niche: brand.niche,
        colors,
        productImages: images,
        products: (brand.images || []).map(img => ({
          name: img.name || 'Product',
          price: img.price || '29.99',
          image: img.data || img.url,
        })),
        tagline: brand.description || `Premium ${brand.niche} templates`,
      });
      return {
        id: `teach_${Date.now()}_${style.id}`,
        styleId: style.id,
        styleName: style.name,
        html: result.previewHtml || result.html,
      };
    });

    setTeachPair(pair);
  }, [brand]);

  const handleTeachChoice = async (chosen, other) => {
    try {
      // Save like for chosen, dislike for other
      await fetch(`${API_BASE}/brain/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: currentNiche,
          bannerId: chosen.id,
          styleName: chosen.styleName,
          action: 'like',
          tags: ['Teaching'],
          note: `Preferred over ${other.styleName}`,
        }),
      });
      await fetch(`${API_BASE}/brain/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: currentNiche,
          bannerId: other.id,
          styleName: other.styleName,
          action: 'dislike',
          tags: ['Teaching'],
          note: `Lost to ${chosen.styleName}`,
        }),
      });
    } catch (err) {
      console.error('Failed to save teaching choice:', err);
    }
    // Generate new pair
    generateTeachPair();
  };

  const handleTeachSlidersSave = async () => {
    try {
      await fetch(`${API_BASE}/brain/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: currentNiche,
          text: `Preferred attributes: Animation Level ${teachSliders.animationLevel}%, Color Warmth ${teachSliders.colorWarmth}%, Layout Complexity ${teachSliders.layoutComplexity}%`,
          category: 'general',
        }),
      });
    } catch (err) {
      console.error('Failed to save slider preferences:', err);
    }
  };

  const handleTeachTextSubmit = async () => {
    if (!teachText.trim()) return;
    try {
      await fetch(`${API_BASE}/brain/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: currentNiche,
          text: teachText,
          category: 'general',
        }),
      });
      setTeachText('');
    } catch (err) {
      console.error('Failed to save teach text:', err);
    }
  };

  // Donut chart SVG renderer
  const renderDonutChart = (data) => {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return (
        <div className="text-center text-slate-500 py-4">
          <p className="text-sm">No data yet</p>
        </div>
      );
    }

    const total = entries.reduce((sum, [, v]) => sum + v, 0);
    const chartColors = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#f97316', '#ec4899'];
    let currentAngle = 0;

    const arcs = entries.map(([name, value], i) => {
      const percentage = value / total;
      const startAngle = currentAngle;
      const endAngle = currentAngle + percentage * 360;
      currentAngle = endAngle;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      const r = 40;
      const cx = 50, cy = 50;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = percentage > 0.5 ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return { name, value, percentage, d, color: chartColors[i % chartColors.length] };
    });

    return (
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
          {arcs.map((arc, i) => (
            <path key={i} d={arc.d} fill={arc.color} stroke="#1f2937" strokeWidth="0.5" />
          ))}
          <circle cx="50" cy="50" r="22" fill="#111827" />
          <text x="50" y="48" textAnchor="middle" fill="#e5e7eb" fontSize="10" fontWeight="bold">{total}</text>
          <text x="50" y="58" textAnchor="middle" fill="#9ca3af" fontSize="5">likes</text>
        </svg>
        <div className="space-y-1">
          {arcs.map((arc, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: arc.color }} />
              <span className="text-gray-300 truncate max-w-[140px]">{arc.name}</span>
              <span className="text-slate-500">{Math.round(arc.percentage * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPreferenceBar = (label, value, leftLabel, rightLabel) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-slate-500 text-xs">{value}%</span>
      </div>
      <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border border-slate-600"
          style={{ left: `calc(${value}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );

  const [expandedNiche, setExpandedNiche] = useState(null);

  if (loading && !preferences) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🧠</span> Brand Brain
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          {currentNiche
            ? `Learning your preferences for "${currentNiche}" and all other niches independently`
            : 'Select a brand to see niche-specific preferences, or explore all niche profiles'}
        </p>
      </div>

      {/* Brain Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {BRAIN_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800/40 text-slate-300 border border-slate-600/30 hover:bg-indigo-950/50 hover:text-slate-200 hover:border-indigo-500/20'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {/* ========== Style DNA ========== */}
        {activeTab === 'dna' && (
          <div className="space-y-6">
            {!currentNiche ? (
              <div className="text-center text-slate-500 py-12">
                <div className="text-5xl mb-3">🧬</div>
                <p>Select a brand to see its niche Style DNA</p>
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{nichePrefs?.totalFeedback || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Total Feedback</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{nichePrefs?.likes || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Likes</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{nichePrefs?.dislikes || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Dislikes</div>
                  </div>
                </div>

                {/* Preference Axes */}
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6 space-y-5">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    📊 Preference Breakdown
                  </h4>
                  {nichePrefs ? (
                    <>
                      {renderPreferenceBar('Animation Level', nichePrefs.animation, 'Subtle', 'Bold')}
                      {renderPreferenceBar('Color Intensity', nichePrefs.colorIntensity, 'Muted', 'Vibrant')}
                      {renderPreferenceBar('Layout Density', nichePrefs.layoutDensity, 'Spacious', 'Packed')}
                      {renderPreferenceBar('Typography Style', nichePrefs.typography, 'Serif', 'Sans-serif')}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">No feedback data yet. Like/dislike banners to build your Style DNA!</p>
                  )}
                </div>

                {/* Donut Chart */}
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
                  <h4 className="font-semibold text-white flex items-center gap-2 mb-4">
                    🎨 Liked Style Distribution
                  </h4>
                  {renderDonutChart(nichePrefs?.styleDist || {})}
                </div>

                {/* Reset */}
                <button
                  onClick={handleResetPreferences}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  🔄 Reset Niche Preferences
                </button>
              </>
            )}
          </div>
        )}

        {/* ========== Feedback History ========== */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">
                {currentNiche ? `Feedback for ${currentNiche}` : 'All Feedback'}
              </h4>
              <div className="flex gap-2">
                {['all', 'likes', 'dislikes'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setFeedbackFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      feedbackFilter === filter
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800/40 text-slate-300 border border-slate-600/30 hover:bg-indigo-950/50 hover:text-slate-200 hover:border-indigo-500/20'
                    }`}
                  >
                    {filter === 'all' ? '📋 All' : filter === 'likes' ? '👍 Likes' : '👎 Dislikes'}
                  </button>
                ))}
              </div>
            </div>

            {filteredFeedback.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <div className="text-5xl mb-3">📝</div>
                <p>No feedback yet. Like/dislike banners and layouts to build history!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFeedback.map(fb => (
                  <div key={fb.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xl ${fb.action === 'like' ? '' : ''}`}>
                          {fb.action === 'like' ? '👍' : '👎'}
                        </span>
                        <div>
                          <h5 className="text-sm font-medium text-white">{fb.styleName || 'Banner'}</h5>
                          <p className="text-xs text-slate-500">
                            {fb.niche} &bull; {new Date(fb.timestamp || fb.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFeedback(fb.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Tags */}
                    {(fb.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {fb.tags.map((tag, i) => (
                          <span key={i} className="bg-gray-900/50 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700/50">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {fb.note && (
                      <p className="text-sm text-slate-400 mt-2 italic">"{fb.note}"</p>
                    )}

                    {/* What AI learned */}
                    <div className="mt-3 bg-gray-900/30 rounded-lg p-2.5 text-xs text-slate-500">
                      🧠 AI learned: {fb.action === 'like' ? 'Prefers' : 'Dislikes'}{' '}
                      {(fb.tags || []).length > 0
                        ? `${fb.tags.join(', ').toLowerCase()} in this style`
                        : 'this banner style overall'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== Suggestions & Prompts ========== */}
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            {/* Add new suggestion */}
            {currentNiche && (
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  ✨ Add New Suggestion
                </h4>
                <div className="flex gap-2 mb-2">
                  {PROMPT_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewPromptCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors ${
                        newPromptCategory === cat
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800/40 text-slate-300 border border-slate-600/30 hover:bg-indigo-950/50 hover:text-slate-200 hover:border-indigo-500/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newPromptText}
                    onChange={e => setNewPromptText(e.target.value)}
                    placeholder={`Describe your preference for ${currentNiche}...`}
                    rows={2}
                    className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <button
                    onClick={handleAddPrompt}
                    disabled={!newPromptText.trim() || savingPrompt}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 self-end flex items-center gap-2"
                  >
                    {savingPrompt ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      '💬'
                    )}
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Prompts list */}
            <h4 className="font-semibold text-white">
              {currentNiche ? `Suggestions for ${currentNiche}` : 'All Suggestions'}
            </h4>

            {nichePrompts.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <div className="text-5xl mb-3">💬</div>
                <p>No suggestions yet. Add one above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nichePrompts.map(prompt => (
                  <div key={prompt.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-indigo-600/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full capitalize">
                          {prompt.category || 'general'}
                        </span>
                        <span className="text-xs text-slate-500">{prompt.niche}</span>
                      </div>
                      <p className="text-sm text-gray-200">{prompt.text}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(prompt.timestamp || prompt.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors text-sm flex-shrink-0 ml-3"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== Niche Profiles ========== */}
        {activeTab === 'niches' && (
          <div className="space-y-3">
            <h4 className="font-semibold text-white mb-4">All Niche Profiles</h4>
            {nicheProfiles.map(profile => {
              const isExpanded = expandedNiche === profile.niche;
              const hasData = profile.feedbackCount > 0;
              return (
                <div
                  key={profile.niche}
                  className={`bg-slate-800/40 border rounded-xl overflow-hidden transition-colors ${
                    profile.niche === currentNiche ? 'border-indigo-500/50' : 'border-slate-700/30'
                  }`}
                >
                  <button
                    onClick={() => setExpandedNiche(isExpanded ? null : profile.niche)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <h5 className="font-medium text-white">{profile.niche}</h5>
                      {profile.niche === currentNiche && (
                        <span className="text-xs bg-indigo-600/20 text-indigo-300 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>🏢 {profile.brandCount} brands</span>
                      <span>📝 {profile.feedbackCount} feedback</span>
                      <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-slate-700/30 space-y-3">
                      {!hasData ? (
                        <p className="text-sm text-slate-500 py-3">No feedback data for this niche yet.</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="bg-gray-900/30 rounded-lg p-3">
                              <div className="text-green-400 font-bold text-lg">{profile.likeCount}</div>
                              <div className="text-xs text-slate-500">Likes</div>
                            </div>
                            <div className="bg-gray-900/30 rounded-lg p-3">
                              <div className="text-red-400 font-bold text-lg">{profile.dislikeCount}</div>
                              <div className="text-xs text-slate-500">Dislikes</div>
                            </div>
                          </div>

                          {profile.topLiked.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-400 font-medium mb-1">👍 Top Liked Styles</p>
                              <div className="flex flex-wrap gap-2">
                                {profile.topLiked.map(([name, count], i) => (
                                  <span key={i} className="bg-green-600/10 text-green-400 text-xs px-2 py-1 rounded-lg border border-green-500/20">
                                    {name} ({count})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {profile.topDisliked.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-400 font-medium mb-1">👎 Top Disliked Elements</p>
                              <div className="flex flex-wrap gap-2">
                                {profile.topDisliked.map(([name, count], i) => (
                                  <span key={i} className="bg-red-600/10 text-red-400 text-xs px-2 py-1 rounded-lg border border-red-500/20">
                                    {name} ({count})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ========== Teach Me ========== */}
        {activeTab === 'teach' && (
          <div className="space-y-6">
            {!currentNiche ? (
              <div className="text-center text-slate-500 py-12">
                <div className="text-5xl mb-3">🎓</div>
                <p>Select a brand to start teaching the AI</p>
              </div>
            ) : (
              <>
                {/* A/B Comparison */}
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
                  <h4 className="font-semibold text-white flex items-center gap-2 mb-4">
                    🔀 Which Do You Prefer?
                  </h4>
                  <p className="text-sm text-slate-400 mb-4">
                    Click on the banner you prefer. The AI will learn from your choices.
                  </p>

                  {!teachPair ? (
                    <button
                      onClick={generateTeachPair}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg transition-colors"
                    >
                      🎲 Generate Comparison Pair
                    </button>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teachPair.map((banner, idx) => (
                          <button
                            key={banner.id}
                            onClick={() => handleTeachChoice(banner, teachPair[1 - idx])}
                            className="group bg-gray-900/50 border border-slate-700/30 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all"
                          >
                            <div className="aspect-video w-full bg-gray-900">
                              <iframe
                                srcDoc={banner.html}
                                className="w-full h-full border-0 pointer-events-none"
                                title={banner.styleName}
                                sandbox="allow-scripts"
                              />
                            </div>
                            <div className="p-3 text-left">
                              <p className="text-sm font-medium text-gray-200">{banner.styleName}</p>
                              <p className="text-xs text-slate-500 group-hover:text-indigo-400 mt-1">Click to prefer this style</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={generateTeachPair}
                        className="mt-4 bg-slate-700 hover:bg-slate-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        🔄 Skip & Generate New Pair
                      </button>
                    </>
                  )}
                </div>

                {/* Attribute Sliders */}
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6 space-y-5">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    🎚️ Quick Attribute Preferences
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Animation Level</span>
                        <span className="text-slate-500 text-xs">{teachSliders.animationLevel}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={teachSliders.animationLevel}
                        onChange={e => setTeachSliders(prev => ({ ...prev, animationLevel: Number(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>None</span>
                        <span>Extreme</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Color Warmth</span>
                        <span className="text-slate-500 text-xs">{teachSliders.colorWarmth}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={teachSliders.colorWarmth}
                        onChange={e => setTeachSliders(prev => ({ ...prev, colorWarmth: Number(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Cool</span>
                        <span>Warm</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Layout Complexity</span>
                        <span className="text-slate-500 text-xs">{teachSliders.layoutComplexity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={teachSliders.layoutComplexity}
                        onChange={e => setTeachSliders(prev => ({ ...prev, layoutComplexity: Number(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Simple</span>
                        <span>Complex</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleTeachSlidersSave}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    💾 Save Preferences
                  </button>
                </div>

                {/* Free Text Teaching */}
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
                  <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                    ✍️ Describe Your Ideal Banner
                  </h4>
                  <p className="text-sm text-slate-400 mb-3">
                    Tell the AI in your own words what you want for {currentNiche} banners
                  </p>
                  <div className="flex gap-3">
                    <textarea
                      value={teachText}
                      onChange={e => setTeachText(e.target.value)}
                      placeholder={`e.g., "I want clean, modern banners with subtle fade animations and pastel ${currentNiche.toLowerCase()} colors..."`}
                      rows={3}
                      className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <button
                      onClick={handleTeachTextSubmit}
                      disabled={!teachText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 self-end"
                    >
                      🧠 Teach
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
