import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useData } from "../context/DataContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { getContentMetrics, getNicheMetrics, NICHES } from "../data/seedData.js";
import { fmt, NICHE_COLORS } from "../utils/formatters.js";

function ContentLogForm({ onSubmit, stores }) {
  const [storeId, setStoreId] = useState("");
  const [type, setType] = useState("blog");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [author, setAuthor] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!storeId || !title) return;
    const store = stores.find((s) => s.store_id === storeId);
    onSubmit({
      store_id: storeId,
      store_name: store?.brand_name || "Unknown",
      store_city: store?.city || "",
      niche_id: store?.niche_id,
      type,
      title,
      url,
      published_by: author || "Team",
    });
    setTitle("");
    setUrl("");
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Log Content Published</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Store</label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500" required>
            <option value="">Select store...</option>
            {stores.filter((s) => s.status === "live").slice(0, 100).map((s) => (
              <option key={s.store_id} value={s.store_id}>{s.brand_name} — {s.city}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
            <option value="blog">Blog Post</option>
            <option value="gmb">GMB Post</option>
            <option value="product">Product Added</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Content title..." className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500" required />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">URL (optional)</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Published by</label>
          <select value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
            <option value="">Select...</option>
            <option value="Andrei">Andrei</option>
            <option value="Jerome">Jerome</option>
            <option value="Joanne">Joanne</option>
            <option value="Team A">Team A</option>
            <option value="Team B">Team B</option>
            <option value="Team C">Team C</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors w-full">
            Log Content
          </button>
        </div>
      </div>
    </form>
  );
}

function ContentCalendar() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString("en-CA", { weekday: "short" });
    const dateStr = d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
    const nicheIdx = i % NICHES.length;
    const niche = NICHES[nicheIdx];
    const blogsDue = 8 + Math.floor(Math.random() * 10); // simplified
    const team = ["Team A", "Team B", "Team C"][i % 3];
    days.push({ dayName, dateStr, niche, blogsDue, team });
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Content Calendar — Next 7 Days</h3>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => (
          <div key={i} className="bg-gray-700/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 font-medium">{d.dayName}</p>
            <p className="text-xs text-gray-500 mb-2">{d.dateStr}</p>
            <p className="text-xs text-white font-medium">{d.niche.emoji} {d.niche.name.split(" ")[0]}</p>
            <p className="text-xs text-indigo-400 mt-1">{d.blogsDue} blogs due</p>
            <p className="text-xs text-gray-500 mt-0.5">{d.team}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Content({ filters }) {
  const { stores, contentLogs, addContentLog, deleteContentLog } = useData();
  const { notify } = useNotifications();

  function handleAddContent(entry) {
    addContentLog(entry);
    notify(`Content logged: "${entry.title}"`, "success");
  }

  function handleDeleteContent(id) {
    deleteContentLog(id);
    notify("Content log removed", "info");
  }
  const contentMetrics = useMemo(() => getContentMetrics(), []);
  const nicheMetrics = useMemo(() => getNicheMetrics(), []);

  const totalPosts = contentMetrics.reduce((a, c) => a + c.blog_posts, 0);
  const totalProducts = contentMetrics.reduce((a, c) => a + c.products, 0);
  const storesNeedingContent = contentMetrics.filter((c) => c.blog_posts < 5).length;

  // Content by niche for chart
  const nichePostData = nicheMetrics.slice(0, 8).map((n, i) => ({
    name: n.emoji + " " + n.name.split(" ")[0],
    posts: n.blog_posts || 0,
    color: NICHE_COLORS[i],
  }));

  // Distribution buckets
  const postBuckets = [0, 0, 0, 0, 0];
  contentMetrics.forEach((c) => {
    if (c.blog_posts === 0) postBuckets[0]++;
    else if (c.blog_posts < 5) postBuckets[1]++;
    else if (c.blog_posts < 10) postBuckets[2]++;
    else if (c.blog_posts < 20) postBuckets[3]++;
    else postBuckets[4]++;
  });
  const bucketData = [
    { label: "0 posts", count: postBuckets[0], color: "#ef4444" },
    { label: "1-4", count: postBuckets[1], color: "#f59e0b" },
    { label: "5-9", count: postBuckets[2], color: "#6366f1" },
    { label: "10-19", count: postBuckets[3], color: "#22c55e" },
    { label: "20+", count: postBuckets[4], color: "#10b981" },
  ];

  // GMB scorecard
  const nicheAgg = nicheMetrics;
  const totalBlogsThisWeek = nicheAgg.reduce((a, n) => a + (n.blog_this_week || 0), 0);
  const totalBlogsTarget = NICHES.length * 100;
  const totalGmbThisWeek = nicheAgg.reduce((a, n) => a + (n.gmb_this_week || 0), 0);
  const totalGmbTarget = NICHES.length * 50;

  return (
    <div className="space-y-6">
      {/* Scorecard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Blogs This Week</p>
          <p className="text-2xl font-bold text-white">{totalBlogsThisWeek}</p>
          <div className="bg-gray-700 rounded-full h-1.5 mt-2"><div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (totalBlogsThisWeek / totalBlogsTarget) * 100)}%` }} /></div>
          <p className="text-xs text-gray-500 mt-1">{Math.round((totalBlogsThisWeek / totalBlogsTarget) * 100)}% of target ({totalBlogsTarget})</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">GMB Posts This Week</p>
          <p className="text-2xl font-bold text-white">{totalGmbThisWeek}</p>
          <div className="bg-gray-700 rounded-full h-1.5 mt-2"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${Math.min(100, (totalGmbThisWeek / totalGmbTarget) * 100)}%` }} /></div>
          <p className="text-xs text-gray-500 mt-1">{Math.round((totalGmbThisWeek / totalGmbTarget) * 100)}% of target ({totalGmbTarget})</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Need Content</p>
          <p className="text-2xl font-bold text-red-400">{storesNeedingContent}</p>
          <p className="text-xs text-gray-500">stores with &lt;5 posts</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Content Logged</p>
          <p className="text-2xl font-bold text-indigo-400">{contentLogs.length}</p>
          <p className="text-xs text-gray-500">manually tracked entries</p>
        </div>
      </div>

      {/* Content Log Form */}
      <ContentLogForm onSubmit={handleAddContent} stores={stores} />

      {/* Content Calendar */}
      <ContentCalendar />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Post Count Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bucketData}>
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px", color: "#e5e7eb" }} labelStyle={{ color: "#e5e7eb" }} itemStyle={{ color: "#e5e7eb" }} formatter={(val) => [val + " stores", "Count"]} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {bucketData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Blog Posts by Niche</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={nichePostData} layout="vertical" margin={{ left: 60 }}>
              <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} width={60} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px", color: "#e5e7eb" }} labelStyle={{ color: "#e5e7eb" }} itemStyle={{ color: "#e5e7eb" }} formatter={(val) => [val, "Posts"]} />
              <Bar dataKey="posts" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content pipeline by niche */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Content Pipeline by Niche</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700">
                <th className="pb-2 pr-4">Niche</th>
                <th className="pb-2 pr-4 text-right">Blogs/Wk</th>
                <th className="pb-2 pr-4 text-right">Target</th>
                <th className="pb-2 pr-4 text-right">Gap</th>
                <th className="pb-2 pr-4 text-right">GMB/Wk</th>
                <th className="pb-2 text-right">GMB Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40">
              {nicheAgg.map((n, i) => {
                const gap = (n.blog_this_week || 0) - n.blogTarget;
                return (
                  <tr key={n.id} className="hover:bg-gray-700/30">
                    <td className="py-2 pr-4 text-gray-300 text-xs">{n.emoji} {n.name}</td>
                    <td className="py-2 pr-4 text-right text-white text-xs font-medium">{n.blog_this_week || 0}</td>
                    <td className="py-2 pr-4 text-right text-gray-400 text-xs">{n.blogTarget}</td>
                    <td className="py-2 pr-4 text-right text-xs">
                      <span className={gap >= 0 ? "text-green-400" : "text-red-400"}>{gap >= 0 ? "+" : ""}{gap}</span>
                    </td>
                    <td className="py-2 pr-4 text-right text-white text-xs font-medium">{n.gmb_this_week || 0}</td>
                    <td className="py-2 text-right text-gray-400 text-xs">{n.gmbTarget}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent content logs */}
      {contentLogs.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Recent Content Logs</h3>
          <div className="space-y-2">
            {contentLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center justify-between bg-gray-700/30 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.type === "blog" ? "bg-indigo-900/50 text-indigo-300" : log.type === "gmb" ? "bg-green-900/50 text-green-300" : "bg-yellow-900/50 text-yellow-300"}`}>
                    {log.type}
                  </span>
                  <div>
                    <p className="text-xs text-white font-medium">{log.title}</p>
                    <p className="text-xs text-gray-500">{log.store_name} — {log.store_city} · by {log.published_by}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{new Date(log.logged_at).toLocaleDateString()}</span>
                  <button onClick={() => handleDeleteContent(log.id)} className="text-xs text-gray-600 hover:text-red-400 transition-colors">&times;</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content gaps */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Content Gaps — Priority List</h3>
          <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">{storesNeedingContent} stores</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700">
                <th className="pb-2 pr-4">Store</th>
                <th className="pb-2 pr-4">City</th>
                <th className="pb-2 pr-4">Niche</th>
                <th className="pb-2 pr-4 text-right">Posts</th>
                <th className="pb-2 pr-4 text-right">Products</th>
                <th className="pb-2 text-right">Rev 7d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40">
              {contentMetrics
                .filter((c) => c.blog_posts < 5)
                .sort((a, b) => b.rev_7d - a.rev_7d)
                .slice(0, 15)
                .map((c) => {
                  const nicheIdx = NICHES.findIndex((n) => n.id === c.niche_id);
                  const niche = NICHES[nicheIdx];
                  return (
                    <tr key={c.store_id} className="hover:bg-gray-700/30">
                      <td className="py-2 pr-4">
                        <p className="text-gray-200 text-xs font-medium">{c.brand_name}</p>
                        <p className="text-gray-500 text-xs">{c.domain}</p>
                      </td>
                      <td className="py-2 pr-4 text-gray-400 text-xs">{c.city}</td>
                      <td className="py-2 pr-4">
                        <span className="text-xs" style={{ color: NICHE_COLORS[nicheIdx] }}>{niche?.emoji} {niche?.name.split(" ")[0]}</span>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span className={`text-xs font-semibold ${c.blog_posts === 0 ? "text-red-400" : "text-yellow-400"}`}>{c.blog_posts}</span>
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-300 text-xs">{c.products}</td>
                      <td className="py-2 text-right text-white text-xs font-medium">{fmt.currency(c.rev_7d)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
