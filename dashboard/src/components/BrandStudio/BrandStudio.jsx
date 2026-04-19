import { useState, useEffect, useCallback } from 'react';
import BrandManager from './BrandManager.jsx';
import BannerGenerator from './BannerGenerator.jsx';
import PageLayouts from './PageLayouts.jsx';
import ProductAssets from './ProductAssets.jsx';
import BrandBrain from './BrandBrain.jsx';

const SUB_TABS = [
  { id: 'brands', label: 'Brands', icon: '🏢' },
  { id: 'banners', label: 'Banners', icon: '🎨' },
  { id: 'pages', label: 'Pages', icon: '📄' },
  { id: 'assets', label: 'Assets', icon: '🖼️' },
  { id: 'brain', label: 'Brain', icon: '🧠' },
];

const API_BASE = '/api/brands';

export default function BrandStudio() {
  const [activeTab, setActiveTab] = useState('brands');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || data || []);
        // If a brand was selected, refresh its data
        if (selectedBrand) {
          const updated = (data.brands || data || []).find(b => b.id === selectedBrand.id);
          if (updated) setSelectedBrand(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBrand]);

  useEffect(() => {
    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBrandUpdate = useCallback(() => {
    fetchBrands();
  }, [fetchBrands]);

  const requiresBrand = ['banners', 'pages', 'assets'];

  function renderActiveTab() {
    if (requiresBrand.includes(activeTab) && !selectedBrand) {
      return (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            No Brand Selected
          </h3>
          <p className="text-slate-500 mb-6">
            Select or create a brand first to use this feature
          </p>
          <button
            onClick={() => setActiveTab('brands')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg transition-colors"
          >
            Go to Brands
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'brands':
        return (
          <BrandManager
            brands={brands}
            setBrands={setBrands}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            onBrandUpdate={handleBrandUpdate}
          />
        );
      case 'banners':
        return (
          <BannerGenerator
            brand={selectedBrand}
            onBrandUpdate={handleBrandUpdate}
          />
        );
      case 'pages':
        return (
          <PageLayouts
            brand={selectedBrand}
            onBrandUpdate={handleBrandUpdate}
          />
        );
      case 'assets':
        return (
          <ProductAssets
            brand={selectedBrand}
            onBrandUpdate={handleBrandUpdate}
          />
        );
      case 'brain':
        return (
          <BrandBrain
            brand={selectedBrand}
            brands={brands}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🎨</span> Brand Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-powered branding engine for your Shopify stores
          </p>
        </div>
        {selectedBrand && (
          <div className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/30 rounded-xl px-4 py-2">
            <div className="flex gap-1">
              {Object.values(selectedBrand.colors || {}).slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-slate-600"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div>
              <span className="text-indigo-300 font-medium text-sm">{selectedBrand.name}</span>
              <span className="text-slate-500 text-xs ml-2">{selectedBrand.niche}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SUB_TABS.map((tab) => {
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

      {/* Loading state */}
      {loading && activeTab === 'brands' ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        renderActiveTab()
      )}
    </div>
  );
}
