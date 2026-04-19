export const fmt = {
  currency: (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v).toLocaleString()}`,
  currencyFull: (v) => `$${Math.round(v).toLocaleString()}`,
  pct: (v) => `${(v * 100).toFixed(1)}%`,
  pctChange: (v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`,
  num: (v) => v.toLocaleString(),
  score: (v) => Math.round(v),
};

export const STATUS_COLORS = {
  live: "bg-green-500",
  pending: "bg-yellow-500",
  paused: "bg-gray-400",
  flagged: "bg-red-500",
  dead: "bg-gray-600",
};

export const STATUS_TEXT = {
  live: "text-green-400",
  pending: "text-yellow-400",
  paused: "text-gray-400",
  flagged: "text-red-400",
  dead: "text-gray-500",
};

export const GMB_COLORS = {
  active: "text-green-400",
  pending: "text-yellow-400",
  suspended: "text-red-400",
  none: "text-gray-500",
};

export const ALERT_STYLES = {
  critical: { bg: "bg-red-900/40 border-red-500/50", text: "text-red-300", dot: "bg-red-500", icon: "🔴" },
  warning: { bg: "bg-yellow-900/40 border-yellow-500/50", text: "text-yellow-300", dot: "bg-yellow-500", icon: "🟡" },
  info: { bg: "bg-blue-900/40 border-blue-500/50", text: "text-blue-300", dot: "bg-blue-500", icon: "🟢" },
};

export const NICHE_COLORS = [
  "#D4A574", "#3498DB", "#27AE60", "#F39C12", "#E74C3C",
  "#9B59B6", "#1ABC9C", "#E67E22", "#E91E63", "#00BCD4",
  "#8BC34A", "#607D8B",
];
