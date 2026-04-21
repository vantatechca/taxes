const TOKEN_KEY = 'tax_dashboard_token';
const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  // Handle blob responses (Excel exports, PDFs)
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('spreadsheetml') || contentType?.includes('octet-stream') || contentType?.includes('application/pdf')) {
    return res.blob() as any;
  }

  return res.json();
}

export const api = {
  // Companies
  getCompanies: () => request<any[]>('/companies'),
  getCompany: (id: string) => request<any>(`/companies/${id}`),
  updateCompany: (id: string, data: any) => request<any>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getCompanySummary: (id: string, year?: number) => request<any>(`/companies/${id}/summary?year=${year || new Date().getFullYear()}`),
  getBatchSummary: (year: number) => request<any[]>(`/companies/batch-summary?year=${year}`),
  createCompany: (data: any) => request<any>('/companies', { method: 'POST', body: JSON.stringify(data) }),
  deleteCompany: (id: string) => request<any>(`/companies/${id}`, { method: 'DELETE' }),

  // Bank Accounts
  getBankAccounts: (companyId?: string) => request<any[]>(`/bank-accounts${companyId ? `?company_id=${companyId}` : ''}`),
  createBankAccount: (data: any) => request<any>('/bank-accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateBankAccount: (id: string, data: any) => request<any>(`/bank-accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Statements
  getStatements: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/statements${qs}`);
  },
  uploadStatement: async (file: File, companyId: string, bankAccountId: string, periodStart?: string, periodEnd?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', companyId);
    formData.append('bank_account_id', bankAccountId);
    if (periodStart) formData.append('period_start', periodStart);
    if (periodEnd) formData.append('period_end', periodEnd);

    const headers = getAuthHeaders();
    const res = await fetch(`${API_BASE}/statements/upload`, {
      method: 'POST',
      headers, // No Content-Type — let browser set multipart boundary
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/transactions${qs}`);
  },
  getReviewQueue: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/transactions/review-queue${qs}`);
  },
  updateTransaction: (id: string, data: any) => request<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  bulkReview: (ids: string[]) => request<any>('/transactions/bulk-review', { method: 'POST', body: JSON.stringify({ transaction_ids: ids }) }),
  getIntercompany: (year?: number) => request<any[]>(`/transactions/intercompany?year=${year || new Date().getFullYear()}`),
  searchTransactions: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/transactions/search?${qs}`);
  },

  // Patterns
  getPatterns: (companyId?: string) => request<any[]>(`/patterns${companyId ? `?company_id=${companyId}` : ''}`),
  createPattern: (data: any) => request<any>('/patterns', { method: 'POST', body: JSON.stringify(data) }),
  updatePattern: (id: string, data: any) => request<any>('/patterns/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deletePattern: (id: string) => request<any>(`/patterns/${id}`, { method: 'DELETE' }),

  // Tax Periods
  getTaxPeriods: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/tax-periods${qs}`);
  },
  generateTaxPeriod: (data: any) => request<any>('/tax-periods/generate', { method: 'POST', body: JSON.stringify(data) }),
  fileTaxPeriod: (id: string) => request<any>(`/tax-periods/${id}/file`, { method: 'PUT' }),
  getUnfiledPeriods: () => request<any[]>('/tax-periods/unfiled'),

  // Reports
  getMonthlyReport: (companyId: string, year: number, month: number) =>
    request<any>(`/reports/monthly/${companyId}?year=${year}&month=${month}`),
  exportMonthlyReport: (companyId: string, year: number, month: number) =>
    request<Blob>(`/reports/export/monthly/${companyId}?year=${year}&month=${month}`),
  exportAccountantPackage: (year: number) =>
    request<Blob>(`/reports/export/accountant-package?year=${year}`),
  getAnnualReport: (companyId: string, year: number) =>
    request<any>(`/reports/annual/${companyId}?year=${year}`),

  // AI Accountant
  getAccountantScan: () => request<any>('/accountant/scan'),

  // AI Advisor
  askAdvisor: (question: string, companyId?: string, context?: any) =>
    request<{ answer: string }>('/advisor/ask', { method: 'POST', body: JSON.stringify({ question, company_id: companyId, context }) }),
  getAdvisorHistory: (companyId?: string) =>
    request<any[]>(`/advisor/history${companyId ? `?company_id=${companyId}` : ''}`),
  getQuickPrompts: () => request<any[]>('/advisor/quick-prompts'),

  // Users
  getCurrentUser: () => request<any>('/users/me'),
  getUsers: () => request<any[]>('/users'),
  updateUser: (id: string, data: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }),
  registerUser: (data: { email: string; password: string; name: string; role: string }) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  getAuditLog: () => request<any[]>('/users/audit-log'),

  // Categories (editable)
  getCategories: () => request<any[]>('/categories'),
  createCategory: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<any>(`/categories/${id}`, { method: 'DELETE' }),

  // Deadlines
  getDeadlines: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/deadlines${qs}`);
  },
  getUpcomingDeadlines: (days?: number) => request<any[]>(`/deadlines/upcoming?days=${days || 30}`),
  getOverdueDeadlines: () => request<any[]>('/deadlines/overdue'),
  createDeadline: (data: any) => request<any>('/deadlines', { method: 'POST', body: JSON.stringify(data) }),
  updateDeadline: (id: string, data: any) => request<any>(`/deadlines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeadline: (id: string) => request<any>(`/deadlines/${id}`, { method: 'DELETE' }),
  generateTpsTvqDeadlines: (year: number) => request<any>('/deadlines/generate-tps-tvq', { method: 'POST', body: JSON.stringify({ year }) }),

  // Invoices
  getInvoices: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/invoices${qs}`);
  },
  getVendorTotals: (year?: number) => request<any[]>(`/invoices/vendor-totals?year=${year || new Date().getFullYear()}`),
  createInvoice: (data: any) => request<any>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: any) => request<any>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) => request<any>(`/invoices/${id}`, { method: 'DELETE' }),

  // Checklists
  getChecklists: (year: number, month: number) => request<any[]>(`/checklists?year=${year}&month=${month}`),
  generateChecklists: (year: number, month: number) => request<any[]>('/checklists/generate', { method: 'POST', body: JSON.stringify({ year, month }) }),
  updateChecklist: (id: string, data: any) => request<any>(`/checklists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // US Nexus
  getNexusStatus: (companyId: string, year?: number) => request<any[]>(`/nexus/${companyId}?year=${year || new Date().getFullYear()}`),
  getAllNexus: (year?: number) => request<any[]>(`/nexus?year=${year || new Date().getFullYear()}`),
  updateNexus: (data: any) => request<any>('/nexus', { method: 'POST', body: JSON.stringify(data) }),
  getNexusThresholds: () => request<any[]>('/nexus/reference/thresholds'),

  // Master Tax Tracker
  downloadTracker: (year: number) => request<Blob>(`/tracker/generate?year=${year}`),

  // PDF Exports
  downloadTpsTvqPdf: (companyId: string, year: number, month: number) =>
    request<Blob>(`/pdf-exports/tps-tvq/${companyId}?year=${year}&month=${month}`),
  downloadCoverNotePdf: (companyId: string, year: number, month: number) =>
    request<Blob>(`/pdf-exports/cover-note/${companyId}?year=${year}&month=${month}`),

  // Cover Note PDF (consolidated)
  downloadCoverNoteDocx: (companyId: string, year: number, month: number) =>
    request<Blob>(`/pdf-exports/cover-note/${companyId}?year=${year}&month=${month}`),

  // SOP Document
  downloadSOP: () => request<Blob>('/sop/generate'),

  // Email Templates
  getEmailTemplates: () => request<any[]>('/email-templates'),
  getAccountantEmailTemplate: (companyId?: string, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    return request<any>(`/email-templates/accountant-package?${params}`);
  },
  getEscalationTemplate: (companyId?: string, issue?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    if (issue) params.set('issue', issue);
    if (severity) params.set('severity', severity);
    return request<any>(`/email-templates/escalation?${params}`);
  },
  getMissingStatementTemplate: (companyId?: string, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    return request<any>(`/email-templates/missing-statement?${params}`);
  },

  // Catch-Up Sprint Board
  getCatchUpBoard: (year?: number) => request<any>(`/catch-up?year=${year || new Date().getFullYear()}`),

  // AI Fiscaliste
  askFiscaliste: (payload: { message: string; channel: 'ca' | 'us'; history: any[]; companyContext: any; insights: string[] }) =>
    request<{ reply: string; insights?: string[] }>('/fiscaliste/chat', { method: 'POST', body: JSON.stringify(payload) }),
  getFiscalisteInsights: async (channel: 'ca' | 'us'): Promise<string[]> => {
    try {
      return await request<string[]>(`/fiscaliste/insights/${channel}`);
    } catch {
      return [];
    }
  },
};
