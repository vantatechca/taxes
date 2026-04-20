import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { fmt, STATUS_COLORS, STATUS_TEXT, GMB_COLORS, NICHE_COLORS } from "../utils/formatters.js";
import { NICHES } from "../data/seedData.js";

const CHECKLIST_ITEMS = [
  { key: "domain", label: "Domain registered" },
  { key: "shopify_live", label: "Shopify store live" },
  { key: "products_uploaded", label: "Products uploaded" },
  { key: "payments_active", label: "Payment processing active" },
  { key: "gmb_active", label: "GMB profile active" },
  { key: "blogs_published", label: "Blog posts published" },
  { key: "email_sequences", label: "Email sequences configured" },
  { key: "cs_setup", label: "CS channels set up" },
  { key: "gsc_verified", label: "GSC verified" },
];

function EditableField({ label, value, type = "text", onSave, options }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function save() {
    const parsed = type === "number" ? parseFloat(draft) || 0 : draft;
    onSave(parsed);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
        {options ? (
          <select value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500" autoFocus onKeyDown={(e) => e.key === "Enter" && save()} />
        )}
        <button onClick={save} className="text-xs text-green-400 hover:text-green-300">Save</button>
        <button onClick={() => { setEditing(false); setDraft(value); }} className="text-xs text-gray-500 hover:text-gray-400">Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditing(true)}>
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-xs text-white font-medium">{type === "number" ? (label.toLowerCase().includes("rev") || label.toLowerCase().includes("aov") ? fmt.currencyFull(value) : value) : value}</span>
      <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
    </div>
  );
}

export default function StoreDetail({ store, onClose }) {
  const { updateStore, updateChecklist, getChecklist, addNote, storeNotes } = useData();
  const { notify } = useNotifications();
  const [noteText, setNoteText] = useState("");
  const [activeSection, setActiveSection] = useState("details");

  const checklist = getChecklist(store.store_id);
  const notes = storeNotes[store.store_id] || [];
  const niche = NICHES.find((n) => n.id === store.niche_id);
  const nicheIdx = NICHES.findIndex((n) => n.id === store.niche_id);

  function handleUpdate(field, value) {
    updateStore(store.store_id, { [field]: value });
    notify("Store updated", "success");
  }

  function handleAddNote() {
    if (!noteText.trim()) return;
    addNote(store.store_id, noteText.trim());
    setNoteText("");
    notify("Note added", "success");
  }

  function handleChecklist(key, value) {
    updateChecklist(store.store_id, key, value);
    notify(`Checklist item ${value ? "completed" : "unchecked"}`, "info");
  }

  const sections = ["details", "checklist", "notes"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: NICHE_COLORS[nicheIdx] }}>{niche?.emoji}</span>
              <h2 className="text-lg font-bold text-white">{store.brand_name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[store.status]?.replace("bg-", "bg-opacity-20 bg-")} ${STATUS_TEXT[store.status]}`}>
                {store.status}
              </span>
              {store.shopify_flagged && <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">Flagged</span>}
            </div>
            <p className="text-xs text-gray-500">{store.domain} · {store.city}, {store.province}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>

        {/* Tab nav */}
        <div className="border-b border-gray-800 px-6 flex gap-4 shrink-0">
          {sections.map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} className={`py-2.5 text-xs font-medium capitalize border-b-2 transition-colors ${activeSection === s ? "border-indigo-500 text-indigo-300" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeSection === "details" && (
            <div className="space-y-6">
              {/* Key metrics (read-only summary) */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Rev 7d</p>
                  <p className="text-sm font-bold text-white">{fmt.currency(store.rev_7d)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="text-sm font-bold text-white">{store.orders_7d}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">AOV</p>
                  <p className="text-sm font-bold text-white">{fmt.currencyFull(store.aov)}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Refund</p>
                  <p className="text-sm font-bold text-white">{fmt.pct(store.refund_rate)}</p>
                </div>
              </div>

              {/* Editable fields */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Store Info (click to edit)</h3>
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2.5">
                  <EditableField label="Brand Name" value={store.brand_name} onSave={(v) => handleUpdate("brand_name", v)} />
                  <EditableField label="Domain" value={store.domain} onSave={(v) => handleUpdate("domain", v)} />
                  <EditableField label="City" value={store.city} onSave={(v) => handleUpdate("city", v)} />
                  <EditableField label="Status" value={store.status} options={["live", "pending", "paused", "flagged", "dead"]} onSave={(v) => handleUpdate("status", v)} />
                  <EditableField label="GMB Status" value={store.gmb_status} options={["active", "pending", "suspended", "none"]} onSave={(v) => handleUpdate("gmb_status", v)} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Metrics (click to edit)</h3>
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2.5">
                  <EditableField label="Revenue (7d)" value={store.rev_7d} type="number" onSave={(v) => handleUpdate("rev_7d", v)} />
                  <EditableField label="Orders (7d)" value={store.orders_7d} type="number" onSave={(v) => handleUpdate("orders_7d", v)} />
                  <EditableField label="AOV" value={store.aov} type="number" onSave={(v) => handleUpdate("aov", v)} />
                  <EditableField label="Refund Rate" value={store.refund_rate} type="number" onSave={(v) => handleUpdate("refund_rate", v)} />
                  <EditableField label="Blog Posts" value={store.blog_posts_count} type="number" onSave={(v) => handleUpdate("blog_posts_count", v)} />
                  <EditableField label="Products" value={store.products_count} type="number" onSave={(v) => handleUpdate("products_count", v)} />
                  <EditableField label="Organic Sessions" value={store.organic_sessions_30d} type="number" onSave={(v) => handleUpdate("organic_sessions_30d", v)} />
                  <EditableField label="Days Live" value={store.days_live} type="number" onSave={(v) => handleUpdate("days_live", v)} />
                </div>
              </div>
            </div>
          )}

          {activeSection === "checklist" && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 mb-3">Track launch progress for this store. Checklist state persists locally.</p>
              {CHECKLIST_ITEMS.map((item) => (
                <label key={item.key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist[item.key] || false}
                    onChange={(e) => handleChecklist(item.key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <span className={`text-sm ${checklist[item.key] ? "text-green-400 line-through" : "text-gray-300"}`}>
                    {item.label}
                  </span>
                </label>
              ))}
              <div className="mt-4 pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500">
                  {Object.values(checklist).filter(Boolean).length} / {CHECKLIST_ITEMS.length} completed
                </p>
                <div className="bg-gray-700 rounded-full h-2 mt-1.5">
                  <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${(Object.values(checklist).filter(Boolean).length / CHECKLIST_ITEMS.length) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {activeSection === "notes" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a note about this store..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button onClick={handleAddNote} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                  Add
                </button>
              </div>
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No notes yet</p>
              ) : (
                <div className="space-y-2">
                  {notes.slice().reverse().map((note, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-lg px-4 py-3">
                      <p className="text-sm text-gray-300">{note.text}</p>
                      <p className="text-xs text-gray-600 mt-1">{new Date(note.date).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button onClick={() => handleUpdate("status", store.status === "paused" ? "live" : "paused")} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
              {store.status === "paused" ? "Resume" : "Pause"}
            </button>
            <button onClick={() => handleUpdate("status", "dead")} className="px-3 py-1.5 text-xs bg-red-900/50 hover:bg-red-900/80 text-red-400 rounded-lg transition-colors">
              Kill Store
            </button>
          </div>
          <button onClick={onClose} className="px-4 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
