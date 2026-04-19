import { useState, useCallback } from "react";

const PREFIX = "de_"; // digital empire namespace

export function useStorage(key, defaultValue) {
  const fullKey = PREFIX + key;

  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(fullKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback((newValue) => {
    setValue((prev) => {
      const resolved = typeof newValue === "function" ? newValue(prev) : newValue;
      try {
        localStorage.setItem(fullKey, JSON.stringify(resolved));
      } catch (e) {
        console.warn("Storage write failed:", e);
      }
      return resolved;
    });
  }, [fullKey]);

  const remove = useCallback(() => {
    localStorage.removeItem(fullKey);
    setValue(defaultValue);
  }, [fullKey, defaultValue]);

  return [value, set, remove];
}

// Merge user edits on top of seed data for a keyed collection
export function mergeEdits(seedArray, editsMap, idField = "store_id") {
  return seedArray.map((item) => {
    const edits = editsMap[item[idField]];
    return edits ? { ...item, ...edits } : item;
  });
}

// Date range multiplier — scales 7d metrics to approximate other windows
export function dateRangeMultiplier(range) {
  switch (range) {
    case "7d": return 1;
    case "30d": return 4.3;
    case "90d": return 12.9;
    case "all": return 52; // ~1 year
    default: return 1;
  }
}

export function dateRangeLabel(range) {
  switch (range) {
    case "7d": return "7d";
    case "30d": return "30d";
    case "90d": return "90d";
    case "all": return "All";
    default: return "7d";
  }
}

// Parse CSV string into array of objects
export function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    values.push(current.trim());
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, j) => { row[h] = values[j]; });
      rows.push(row);
    }
  }
  return rows;
}

// Export data as CSV
export function exportCSV(data, filename = "export.csv") {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
