import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { NICHES, CITIES } from "../data/seedData.js";

const PROVINCES = [...new Set(CITIES.map((c) => c.province))].sort();

export default function AddStoreModal({ onClose }) {
  const { addStore } = useData();
  const { notify } = useNotifications();
  const [form, setForm] = useState({
    niche_id: "1",
    city: CITIES[0].name,
    brand_name: "",
    domain: "",
    status: "pending",
    gmb_status: "none",
    products_count: 0,
    blog_posts_count: 0,
  });

  const selectedCity = CITIES.find((c) => c.name === form.city);
  const selectedNiche = NICHES.find((n) => n.id === parseInt(form.niche_id));

  function autoDomain() {
    if (!selectedNiche || !form.city) return "";
    const slug = selectedNiche.slug.split("-")[0];
    const citySlug = form.city.toLowerCase().replace(/[^a-z]/g, "");
    return `${slug}${citySlug}.ca`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const nicheId = parseInt(form.niche_id);
    const niche = NICHES.find((n) => n.id === nicheId);
    const city = CITIES.find((c) => c.name === form.city);

    const store = {
      store_id: `user-${Date.now()}`,
      niche_id: nicheId,
      niche: niche.slug,
      niche_name: niche.name,
      city: form.city,
      province: city?.province || "ON",
      domain: form.domain || autoDomain(),
      brand_name: form.brand_name || niche.brand,
      status: form.status,
      gmb_status: form.gmb_status,
      days_live: 0,
      products_count: parseInt(form.products_count) || 0,
      blog_posts_count: parseInt(form.blog_posts_count) || 0,
      rev_7d: 0,
      orders_7d: 0,
      aov: 0,
      refund_rate: 0,
      organic_sessions_30d: 0,
      last_order_days_ago: 0,
      shopify_flagged: false,
    };

    addStore(store);
    notify(`Store "${store.brand_name}" created successfully!`, "success");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Add New Store</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Niche</label>
              <select value={form.niche_id} onChange={(e) => setForm({ ...form, niche_id: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                {NICHES.map((n) => <option key={n.id} value={n.id}>{n.emoji} {n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">City</label>
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}, {c.province}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Brand Name</label>
              <input type="text" value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} placeholder={selectedNiche?.brand || "Brand"} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Domain</label>
              <input type="text" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder={autoDomain()} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                <option value="pending">Pending</option>
                <option value="live">Live</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">GMB Status</label>
              <select value={form.gmb_status} onChange={(e) => setForm({ ...form, gmb_status: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                <option value="none">None</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Products</label>
              <input type="number" min="0" value={form.products_count} onChange={(e) => setForm({ ...form, products_count: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Blog Posts</label>
              <input type="number" min="0" value={form.blog_posts_count} onChange={(e) => setForm({ ...form, blog_posts_count: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Preview</p>
            <p className="text-sm text-white font-medium">{form.brand_name || selectedNiche?.brand} — {selectedNiche?.emoji} {selectedNiche?.name}</p>
            <p className="text-xs text-gray-400">{form.domain || autoDomain()} · {form.city}, {selectedCity?.province}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">Create Store</button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
