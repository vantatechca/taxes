export function validateYear(val: any): number | null {
  const n = Number(val);
  if (!Number.isInteger(n) || n < 2020 || n > 2099) return null;
  return n;
}
export function validateMonth(val: any): number | null {
  const n = Number(val);
  if (!Number.isInteger(n) || n < 1 || n > 12) return null;
  return n;
}
export function validatePagination(page: any, limit: any): { page: number; limit: number } {
  let p = Math.max(1, Number(page) || 1);
  let l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l };
}
