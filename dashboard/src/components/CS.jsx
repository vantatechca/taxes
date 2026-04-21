import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useData } from "../context/DataContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { getCSMetrics } from "../data/seedData.js";
import { fmt } from "../utils/formatters.js";

const TICKET_COLORS = {
  refund: "#ef4444",
  shipping: "#f59e0b",
  product: "#6366f1",
  other: "#6b7280",
};

const PRIORITY_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

function NewTicketForm({ stores, onSubmit, onCancel }) {
  const [form, setForm] = useState({ store_id: "", type: "refund", priority: "medium", order_value: "", note: "" });

  function handleSubmit(e) {
    e.preventDefault();
    const store = stores.find((s) => s.store_id === form.store_id);
    if (!store) return;
    onSubmit({
      store_id: store.store_id,
      store_name: store.brand_name,
      domain: store.domain,
      city: store.city,
      type: form.type,
      priority: form.priority,
      order_value: parseFloat(form.order_value) || 0,
      days_open: 0,
      note: form.note,
    });
    setForm({ store_id: "", type: "refund", priority: "medium", order_value: "", note: "" });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-indigo-500/30 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">New Ticket</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Store</label>
          <select value={form.store_id} onChange={(e) => setForm({ ...form, store_id: e.target.value })} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
            <option value="">Select store...</option>
            {stores.filter((s) => s.status === "live").slice(0, 100).map((s) => (
              <option key={s.store_id} value={s.store_id}>{s.brand_name} — {s.city}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
            <option value="refund">Refund</option>
            <option value="shipping">Shipping</option>
            <option value="product">Product</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Order Value ($)</label>
          <input type="number" step="0.01" value={form.order_value} onChange={(e) => setForm({ ...form, order_value: e.target.value })} placeholder="0.00" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-400 block mb-1">Note</label>
          <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Brief description..." className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">Create Ticket</button>
        <button type="button" onClick={onCancel} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function TicketRow({ ticket, onResolve, isUserTicket }) {
  const priorityColor = PRIORITY_COLORS[ticket.priority] || "#6b7280";
  return (
    <tr className="hover:bg-gray-700/30 transition-colors border-b border-gray-700/40 last:border-0">
      <td className="px-4 py-2.5">
        <p className="text-xs text-gray-200 font-medium">{ticket.store_name}</p>
        <p className="text-xs text-gray-500">{ticket.city}</p>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: TICKET_COLORS[ticket.type] + "33", color: TICKET_COLORS[ticket.type] }}>
          {ticket.type}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-xs font-medium" style={{ color: priorityColor }}>● {ticket.priority}</span>
      </td>
      <td className="px-4 py-2.5 text-right text-xs text-gray-400">{ticket.days_open}d open</td>
      <td className="px-4 py-2.5 text-right text-xs text-white font-medium">{fmt.currency(ticket.order_value)}</td>
      <td className="px-4 py-2.5 text-right">
        {ticket.status === "resolved" ? (
          <span className="text-xs text-green-400 font-medium">Resolved</span>
        ) : onResolve ? (
          <button onClick={() => onResolve(ticket.id)} className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors">Resolve</button>
        ) : (
          <span className="text-xs text-yellow-400">Open</span>
        )}
      </td>
    </tr>
  );
}

export default function CS() {
  const { stores, csTickets, addTicket, resolveTicket } = useData();
  const { notify } = useNotifications();
  const mockEnabled = import.meta.env.VITE_MOCK_DATA === "true";
  const seedMetrics = useMemo(() => mockEnabled ? getCSMetrics() : {
    tickets: [], refund_value: 0, avg_response_hours: 0, resolution_rate: 0,
    sla_compliance: 0, csat_score: 0, escalations: 0, chargebacks: 0,
    resolved_today: 0, new_today: 0, ticket_types: {}, priority_breakdown: {},
    top_refund_stores: [],
  }, [mockEnabled]);
  const [showForm, setShowForm] = useState(false);
  const [ticketFilter, setTicketFilter] = useState("all"); // all, open, resolved

  // Merge seed tickets + user tickets
  const allTickets = useMemo(() => {
    const seed = mockEnabled
      ? seedMetrics.tickets.map((t, i) => ({ ...t, id: `seed_${i}`, source: "seed", status: "open" }))
      : [];
    const user = csTickets.map((t) => ({ ...t, source: "user" }));
    return [...user, ...seed];
  }, [seedMetrics.tickets, csTickets, mockEnabled]);

  const openTickets = allTickets.filter((t) => t.status !== "resolved");
  const resolvedTickets = allTickets.filter((t) => t.status === "resolved");

  const filteredTickets = ticketFilter === "open" ? openTickets : ticketFilter === "resolved" ? resolvedTickets : allTickets;

  // Recompute KPIs to include user tickets
  const totalOpenTickets = openTickets.length;
  const userOpenRefundValue = csTickets.filter((t) => t.status === "open" && t.type === "refund").reduce((a, t) => a + (t.order_value || 0), 0);
  const totalRefundValue = seedMetrics.refund_value + userOpenRefundValue;
  const avgResponseTime = seedMetrics.avg_response_hours;
  const resolutionRate = allTickets.length > 0 ? resolvedTickets.length / allTickets.length : seedMetrics.resolution_rate;

  // Ticket type distribution including user tickets
  const typeData = useMemo(() => {
    const counts = { ...seedMetrics.ticket_types };
    csTickets.filter((t) => t.status === "open").forEach((t) => {
      counts[t.type] = (counts[t.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      name: type,
      value: count,
      color: TICKET_COLORS[type] || "#6b7280",
    }));
  }, [seedMetrics.ticket_types, csTickets]);

  const priorityData = useMemo(() => {
    const counts = { ...seedMetrics.priority_breakdown };
    csTickets.filter((t) => t.status === "open").forEach((t) => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([p, count]) => ({
      name: p,
      count,
      color: PRIORITY_COLORS[p] || "#6b7280",
    }));
  }, [seedMetrics.priority_breakdown, csTickets]);

  const storeRefunds = seedMetrics.top_refund_stores.slice(0, 10);

  function handleCreateTicket(ticket) {
    addTicket(ticket);
    setShowForm(false);
    notify(`Ticket created for ${ticket.store_name}`, "success");
  }

  function handleResolveTicket(ticketId) {
    resolveTicket(ticketId);
    notify("Ticket resolved!", "success");
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Open Tickets</p>
          <p className="text-2xl font-bold text-white">{totalOpenTickets}</p>
          <p className="text-xs text-gray-500">{seedMetrics.new_today} new today</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Refund Exposure</p>
          <p className="text-2xl font-bold text-red-400">{fmt.currency(totalRefundValue)}</p>
          <p className="text-xs text-gray-500">pending 7d</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Avg Response</p>
          <p className="text-2xl font-bold text-white">{avgResponseTime}h</p>
          <p className="text-xs text-gray-500">SLA target: 24h</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Resolution Rate</p>
          <p className={`text-2xl font-bold ${resolutionRate >= 0.9 ? "text-green-400" : resolutionRate >= 0.75 ? "text-yellow-400" : "text-red-400"}`}>
            {fmt.pct(resolutionRate)}
          </p>
          {resolvedTickets.length > 0 && <p className="text-xs text-green-500">{resolvedTickets.length} resolved</p>}
        </div>
      </div>

      {/* New Ticket button / form */}
      {showForm ? (
        <NewTicketForm stores={stores} onSubmit={handleCreateTicket} onCancel={() => setShowForm(false)} />
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">+ New Ticket</button>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Ticket Types</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px", color: "#e5e7eb" }} labelStyle={{ color: "#e5e7eb" }} itemStyle={{ color: "#e5e7eb" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1">
            {typeData.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-gray-400 capitalize">{t.name}</span>
                </div>
                <span className="text-white font-medium">{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={priorityData}>
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px", color: "#e5e7eb" }} labelStyle={{ color: "#e5e7eb" }} itemStyle={{ color: "#e5e7eb" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {priorityData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 capitalize">{p.name} priority</span>
                <span className="font-medium" style={{ color: p.color }}>{p.count} tickets</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">CS Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Resolution Rate</span>
                <span className="text-white">{fmt.pct(resolutionRate)}</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${resolutionRate * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">SLA Compliance</span>
                <span className="text-white">{fmt.pct(seedMetrics.sla_compliance)}</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${seedMetrics.sla_compliance >= 0.9 ? "bg-green-500" : "bg-yellow-500"}`} style={{ width: `${seedMetrics.sla_compliance * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">CSAT Score</span>
                <span className="text-white">{seedMetrics.csat_score}/5.0</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(seedMetrics.csat_score / 5) * 100}%` }} />
              </div>
            </div>
            <div className="border-t border-gray-700 pt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Escalations (7d)</span>
                <span className="text-red-400 font-medium">{seedMetrics.escalations}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Chargebacks (7d)</span>
                <span className="text-red-400 font-medium">{seedMetrics.chargebacks}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Resolved today</span>
                <span className="text-green-400 font-medium">{seedMetrics.resolved_today + resolvedTickets.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top refund stores */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Highest Refund Stores — Needs Attention</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700">
                <th className="pb-2 pr-4">Store</th>
                <th className="pb-2 pr-4">City</th>
                <th className="pb-2 pr-4 text-right">Refund Rate</th>
                <th className="pb-2 pr-4 text-right">Refund Value</th>
                <th className="pb-2 pr-4 text-right">Orders 7d</th>
                <th className="pb-2 text-right">Rev 7d</th>
              </tr>
            </thead>
            <tbody>
              {storeRefunds.map((s) => (
                <tr key={s.store_id} className="hover:bg-gray-700/30 transition-colors border-b border-gray-700/40 last:border-0">
                  <td className="py-2.5 pr-4">
                    <p className="text-xs text-gray-200 font-medium">{s.brand_name}</p>
                    <p className="text-xs text-gray-500">{s.domain}</p>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-gray-400">{s.city}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="text-xs font-bold text-red-400">{fmt.pct(s.refund_rate)}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-right text-xs text-red-300">{fmt.currency(s.refund_value)}</td>
                  <td className="py-2.5 pr-4 text-right text-xs text-gray-300">{s.orders_7d}</td>
                  <td className="py-2.5 text-right text-xs text-white font-medium">{fmt.currency(s.rev_7d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tickets table with filter */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Tickets ({filteredTickets.length})</h3>
            <p className="text-xs text-gray-500">User-created tickets can be resolved</p>
          </div>
          <div className="flex gap-2">
            {["all", "open", "resolved"].map((f) => (
              <button key={f} onClick={() => setTicketFilter(f)} className={`px-3 py-1 text-xs rounded-lg transition-colors capitalize ${ticketFilter === f ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>
                {f} {f === "open" ? `(${openTickets.length})` : f === "resolved" ? `(${resolvedTickets.length})` : ""}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700">
                <th className="px-4 pb-2 pr-4">Store</th>
                <th className="px-4 pb-2 pr-4">Type</th>
                <th className="px-4 pb-2 pr-4">Priority</th>
                <th className="px-4 pb-2 text-right">Age</th>
                <th className="px-4 pb-2 text-right">Value</th>
                <th className="px-4 pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t, i) => (
                <TicketRow
                  key={t.id || i}
                  ticket={t}
                  isUserTicket={t.source === "user"}
                  onResolve={t.source === "user" && t.status !== "resolved" ? handleResolveTicket : null}
                />
              ))}
              {filteredTickets.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No tickets match this filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
