import { useState, useCallback, useRef } from 'react';
import { NICHE_COLOR_PALETTES, suggestColors } from './bannerTemplates';

const NICHES = [
  'Wedding Planning', 'Startup Kits', 'Resume & Career', 'Personal Finance',
  'Meal Planning', 'Fitness & Workout', 'Home Organization', 'Parenting & Baby',
  'Event Planning', 'Social Media', 'Pet Care', 'Real Estate',
];

const API_BASE = '/api/brands';

export default function BrandManager({ brands, setBrands, selectedBrand, setSelectedBrand, onBrandUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    niche: '',
    description: '',
    colors: ['#6366f1', '#8b5cf6', '#f59e0b', '#1e1b4b', '#f3f4f6'],
  });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const COLOR_LABELS = ['Primary', 'Secondary', 'Accent', 'Background', 'Text'];

  const colorsToArray = (c) => {
    if (Array.isArray(c)) return c.slice(0, 5);
    if (c && typeof c === 'object') return [c.primary, c.secondary, c.accent, c.bg, c.text].filter(Boolean);
    return ['#6366f1', '#8b5cf6', '#f59e0b', '#1e1b4b', '#f3f4f6'];
  };

  const handleNicheChange = (niche) => {
    setFormData(prev => {
      const suggested = suggestColors ? suggestColors(niche) : (NICHE_COLOR_PALETTES?.[niche] || null);
      return { ...prev, niche, colors: suggested ? colorsToArray(suggested) : prev.colors };
    });
  };

  const handleColorChange = (index, color) => {
    setFormData(prev => {
      const newColors = [...prev.colors];
      newColors[index] = color;
      return { ...prev, colors: newColors };
    });
  };

  const resetForm = () => {
    setFormData({ name: '', niche: '', description: '', colors: ['#6366f1', '#8b5cf6', '#f59e0b', '#1e1b4b', '#f3f4f6'] });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.niche) return;
    setSaving(true);
    try {
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          colors: {
            primary: formData.colors[0] || '#6366f1',
            secondary: formData.colors[1] || '#8b5cf6',
            accent: formData.colors[2] || '#f59e0b',
            bg: formData.colors[3] || '#1e1b4b',
            text: formData.colors[4] || '#f3f4f6',
          },
        }),
      });
      if (res.ok) {
        onBrandUpdate();
        resetForm();
      }
    } catch (err) {
      console.error('Failed to save brand:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (brand) => {
    setFormData({
      name: brand.name,
      niche: brand.niche,
      description: brand.description || '',
      colors: colorsToArray(brand.colors),
    });
    setEditingId(brand.id);
    setShowForm(true);
  };

  const handleDelete = async (brandId) => {
    if (!confirm('Delete this brand and all its assets?')) return;
    try {
      await fetch(`${API_BASE}/${brandId}`, { method: 'DELETE' });
      if (selectedBrand?.id === brandId) setSelectedBrand(null);
      onBrandUpdate();
    } catch (err) {
      console.error('Failed to delete brand:', err);
    }
  };

  const processFiles = useCallback(async (files) => {
    if (!selectedBrand) return;
    const validFiles = Array.from(files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );
    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const images = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      images.push({ name: file.name.replace(/\.[^.]+$/, ''), data });
      setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
    }

    try {
      const res = await fetch(`${API_BASE}/${selectedBrand.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      if (res.ok) {
        onBrandUpdate();
      }
    } catch (err) {
      console.error('Failed to upload images:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [selectedBrand, onBrandUpdate]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDeleteImage = async (imageId) => {
    if (!selectedBrand) return;
    try {
      await fetch(`${API_BASE}/${selectedBrand.id}/images/${imageId}`, { method: 'DELETE' });
      onBrandUpdate();
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleProductEdit = async (imageId, field, value) => {
    if (!selectedBrand) return;
    // Optimistic update: we just update locally, real save happens on blur/enter
    setEditingProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleProductSave = async (image) => {
    if (!selectedBrand || !editingProduct) return;
    try {
      await fetch(`${API_BASE}/${selectedBrand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateImage: { id: image.id, ...editingProduct },
        }),
      });
      setEditingProduct(null);
      onBrandUpdate();
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Brand Form */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl">
        <button
          onClick={() => { if (!showForm) { resetForm(); setShowForm(true); } else { resetForm(); }}}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>✨</span>
            {editingId ? 'Edit Brand' : 'Create New Brand'}
          </h3>
          <span className={`text-slate-400 transition-transform ${showForm ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 border-t border-slate-700/30 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brand Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Awesome Brand"
                  className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Niche Dropdown */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Niche</label>
                <select
                  value={formData.niche}
                  onChange={e => handleNicheChange(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">Select a niche...</option>
                  {NICHES.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your brand's style, audience, and goals..."
                rows={3}
                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Color Palette</label>
              <div className="flex flex-wrap gap-4">
                {formData.colors.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <input
                      type="color"
                      value={color}
                      onChange={e => handleColorChange(i, e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-600"
                    />
                    <span className="text-xs text-slate-500">{COLOR_LABELS[i]}</span>
                  </div>
                ))}
              </div>
              {formData.niche && (
                <p className="text-xs text-slate-500 mt-2">
                  💡 Auto-suggested for {formData.niche} — customize above
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                {editingId ? 'Update Brand' : 'Create Brand'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Brand Cards Grid */}
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <span>📁</span> Your Brands
          <span className="text-sm font-normal text-slate-500">({brands.length})</span>
        </h3>

        {brands.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <div className="text-5xl mb-3">🏢</div>
            <p>No brands yet. Create your first brand above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map(brand => {
              const isSelected = selectedBrand?.id === brand.id;
              const imageCount = (brand.images || []).length;
              const bannerCount = (brand.banners || []).length;
              return (
                <div
                  key={brand.id}
                  className={`bg-slate-800/40 border rounded-xl p-5 transition-all ${
                    isSelected
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-700/30 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white text-lg">{brand.name}</h4>
                      <span className="inline-block bg-indigo-600/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full mt-1">
                        {brand.niche}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-xs bg-green-600/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Color palette preview */}
                  <div className="flex gap-1.5 mb-3">
                    {Object.values(brand.colors || {}).slice(0, 5).map((c, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-slate-600"
                        style={{ backgroundColor: c }}
                        title={COLOR_LABELS[i]}
                      />
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-xs text-slate-500 mb-4">
                    <span>📷 {imageCount} product{imageCount !== 1 ? 's' : ''}</span>
                    <span>🎨 {bannerCount} banner{bannerCount !== 1 ? 's' : ''}</span>
                  </div>

                  {brand.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{brand.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedBrand(isSelected ? null : brand)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                    <button
                      onClick={() => handleEdit(brand)}
                      className="bg-slate-700 hover:bg-slate-600 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Upload Section */}
      {selectedBrand && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <span>📷</span> Product Images — {selectedBrand.name}
          </h3>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-6 ${
              dragOver
                ? 'border-indigo-500 bg-indigo-600/10'
                : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={e => processFiles(e.target.files)}
              className="hidden"
            />
            <div className="text-4xl mb-2">{dragOver ? '📥' : '📤'}</div>
            <p className="text-gray-300 font-medium">
              {uploading ? 'Uploading...' : 'Drop product images here or click to browse'}
            </p>
            <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP accepted</p>

            {uploading && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{uploadProgress}%</p>
              </div>
            )}
          </div>

          {/* Product Grid */}
          {(selectedBrand.images || []).length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <p>No product images yet. Upload some above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(selectedBrand.images || []).map(img => {
                const isEditing = editingProduct && editingProduct.id === img.id;
                return (
                  <div key={img.id} className="bg-gray-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
                    {/* Image Thumbnail */}
                    <div className="aspect-square bg-gray-800 relative overflow-hidden">
                      <img
                        src={img.data || img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors"
                      >
                        ×
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-3 space-y-2">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editingProduct.name ?? img.name}
                            onChange={e => handleProductEdit(img.id, 'name', e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-600/50 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                            placeholder="Product name"
                          />
                          <input
                            type="text"
                            value={editingProduct.description ?? img.description ?? ''}
                            onChange={e => handleProductEdit(img.id, 'description', e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-600/50 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                            placeholder="Description"
                          />
                          <input
                            type="number"
                            value={editingProduct.price ?? img.price ?? ''}
                            onChange={e => handleProductEdit(img.id, 'price', e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-600/50 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                            placeholder="Price"
                            step="0.01"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProductSave(img)}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2 py-1 rounded transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingProduct(null)}
                              className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs px-2 py-1 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-200 truncate">{img.name || 'Untitled'}</p>
                          {img.description && (
                            <p className="text-xs text-slate-500 truncate">{img.description}</p>
                          )}
                          {img.price && (
                            <p className="text-sm text-green-400 font-medium">${Number(img.price).toFixed(2)}</p>
                          )}
                          <button
                            onClick={() => setEditingProduct({ id: img.id, name: img.name, description: img.description || '', price: img.price || '' })}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs px-2 py-1 rounded transition-colors"
                          >
                            ✏️ Edit Details
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
