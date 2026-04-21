// Mock Supabase client for demo mode — returns realistic data without a real database
import {
  DEMO_COMPANIES, DEMO_BANK_ACCOUNTS, DEMO_TRANSACTIONS, DEMO_STATEMENTS,
  DEMO_INVOICES, DEMO_DEADLINES, DEMO_USER, DEMO_PATTERNS, DEMO_CHECKLISTS,
} from './mockData';

type TableName = string;

const TABLES: Record<string, any[]> = {
  companies: DEMO_COMPANIES,
  bank_accounts: DEMO_BANK_ACCOUNTS,
  transactions: DEMO_TRANSACTIONS,
  statements: DEMO_STATEMENTS,
  invoices: DEMO_INVOICES,
  filing_deadlines: DEMO_DEADLINES,
  users: [DEMO_USER],
  transaction_patterns: DEMO_PATTERNS,
  monthly_checklists: DEMO_CHECKLISTS,
  custom_categories: [],
  us_state_sales: [],
  onboarding: [],
  ai_advisory_log: [],
  audit_log: [],
};

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

class MockQueryBuilder {
  private table: string;
  private data: any[];
  private filters: Array<(item: any) => boolean> = [];
  private orderKey: string | null = null;
  private orderAsc = true;
  private limitCount: number | null = null;
  private isSingle = false;
  private isCount = false;
  private isHead = false;
  private selectFields: string = '*';

  constructor(table: string) {
    this.table = table;
    this.data = clone(TABLES[table] || []);
  }

  select(fields: string = '*', opts?: { count?: string; head?: boolean }) {
    this.selectFields = fields;
    if (opts?.count) this.isCount = true;
    if (opts?.head) this.isHead = true;
    return this;
  }

  insert(rows: any | any[]) {
    const arr = Array.isArray(rows) ? rows : [rows];
    for (const row of arr) {
      if (!row.id) row.id = crypto.randomUUID();
      row.created_at = row.created_at || new Date().toISOString();
      TABLES[this.table] = TABLES[this.table] || [];
      TABLES[this.table].push(row);
    }
    this.data = clone(arr);
    return this;
  }

  update(updates: any) {
    // Apply updates to matched rows in the actual table
    this._updates = updates;
    return this;
  }
  private _updates: any = null;

  delete() {
    this._isDelete = true;
    return this;
  }
  private _isDelete = false;

  upsert(rows: any | any[]) {
    return this.insert(rows);
  }

  eq(field: string, value: any) {
    this.filters.push(item => {
      const parts = field.split('.');
      let val = item;
      for (const p of parts) val = val?.[p];
      return val === value;
    });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push(item => item[field] !== value);
    return this;
  }

  gt(field: string, value: any) {
    this.filters.push(item => item[field] > value);
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push(item => item[field] >= value);
    return this;
  }

  lt(field: string, value: any) {
    this.filters.push(item => item[field] < value);
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push(item => item[field] <= value);
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push(item => values.includes(item[field]));
    return this;
  }

  is(field: string, value: any) {
    this.filters.push(item => item[field] === value);
    return this;
  }

  ilike(field: string, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this.filters.push(item => regex.test(String(item[field] || '')));
    return this;
  }

  like(field: string, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, '.*'));
    this.filters.push(item => regex.test(String(item[field] || '')));
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderKey = field;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this._rangeFrom = from;
    this.limitCount = to - from + 1;
    return this;
  }
  private _rangeFrom: number = 0;

  single() {
    this.isSingle = true;
    return this._resolve();
  }

  then(resolve: (value: any) => void, reject?: (err: any) => void) {
    try {
      resolve(this._resolve());
    } catch (e) {
      if (reject) reject(e);
    }
  }

  private _resolve(): any {
    let results = clone(this.data);

    // Apply filters
    for (const filter of this.filters) {
      results = results.filter(filter);
    }

    // Apply updates if this is an update query
    if (this._updates) {
      for (const item of results) {
        Object.assign(item, this._updates);
        // Update in the actual table too
        const tableData = TABLES[this.table] || [];
        const idx = tableData.findIndex((r: any) => r.id === item.id);
        if (idx >= 0) Object.assign(tableData[idx], this._updates);
      }
    }

    // Apply delete
    if (this._isDelete) {
      const idsToDelete = new Set(results.map((r: any) => r.id));
      TABLES[this.table] = (TABLES[this.table] || []).filter((r: any) => !idsToDelete.has(r.id));
      return { data: null, error: null };
    }

    // Sort
    if (this.orderKey) {
      const key = this.orderKey;
      const asc = this.orderAsc;
      results.sort((a: any, b: any) => {
        const va = a[key], vb = b[key];
        if (va < vb) return asc ? -1 : 1;
        if (va > vb) return asc ? 1 : -1;
        return 0;
      });
    }

    // Count before limiting (for { count: 'exact' })
    const totalCount = results.length;

    if (this.isCount && this.isHead) {
      return { count: totalCount, data: null, error: null };
    }

    // Range / Limit
    if (this._rangeFrom > 0 || this.limitCount) {
      const start = this._rangeFrom || 0;
      const end = this.limitCount ? start + this.limitCount : undefined;
      results = results.slice(start, end);
    }

    if (this.isSingle) {
      return { data: results[0] || null, error: results[0] ? null : { message: 'Not found' } };
    }

    return { data: results, error: null, count: this.isCount ? totalCount : undefined };
  }
}

class MockStorageClient {
  from(_bucket: string) {
    return {
      upload: async (_path: string, _file: any) => ({ data: { path: 'demo/file.pdf' }, error: null }),
      getPublicUrl: (_path: string) => ({ data: { publicUrl: 'https://demo.local/file.pdf' } }),
    };
  }
}

class MockAuthClient {
  async getUser(_token: string) {
    return {
      data: {
        user: {
          id: 'demo-auth-id',
          email: 'admin@taxdashboard.local',
        },
      },
      error: null,
    };
  }
}

export class MockSupabaseClient {
  auth = new MockAuthClient();
  storage = new MockStorageClient();

  from(table: TableName) {
    return new MockQueryBuilder(table);
  }
}

export const mockSupabaseAdmin = new MockSupabaseClient();
export const mockSupabasePublic = new MockSupabaseClient();
