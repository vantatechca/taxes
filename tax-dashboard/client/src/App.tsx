import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import TaxPeriodsPage from './pages/TaxPeriodsPage';
import ReportsPage from './pages/ReportsPage';
import AdvisorPage from './pages/AdvisorPage';
import SettingsPage from './pages/SettingsPage';
import NexusPage from './pages/NexusPage';
import IntercompanyPage from './pages/IntercompanyPage';
import PatternsPage from './pages/PatternsPage';
import ChecklistPage from './pages/ChecklistPage';
import CatchUpPage from './pages/CatchUpPage';
import SearchPage from './pages/SearchPage';
import FilingGuidePage from './pages/FilingGuidePage';
import FiscalistePage from './pages/FiscalistePage';
import AccountantPage from './pages/AccountantPage';

function AppRoutes() {
  const { token: session, loading, appUser } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex">
        {/* Sidebar skeleton */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col p-4 gap-3 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
          </div>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <div className="w-4 h-4 bg-slate-700 rounded animate-pulse" />
              <div className="h-3 bg-slate-700 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 20}px` }} />
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center px-6 gap-4">
            <div className="h-4 w-40 bg-slate-700 rounded animate-pulse" />
            <div className="ml-auto flex gap-3">
              <div className="h-8 w-28 bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-8 w-28 bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
                  <div className="h-7 w-32 bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
                <div className="h-4 w-40 bg-slate-700 rounded animate-pulse" />
                <div className="h-48 bg-slate-700/50 rounded-lg animate-pulse" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
                <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
                <div className="h-48 bg-slate-700/50 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Table rows */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
              <div className="h-4 w-36 bg-slate-700 rounded animate-pulse" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 py-2 border-t border-slate-700">
                  <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-700 rounded animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  // Show onboarding for first-time admins (check localStorage to not show again)
  const hasOnboarded = localStorage.getItem('tax_dashboard_onboarded');
  if (appUser?.role === 'admin' && !hasOnboarded && !onboardingComplete) {
    return (
      <OnboardingPage onComplete={() => {
        localStorage.setItem('tax_dashboard_onboarded', 'true');
        setOnboardingComplete(true);
      }} />
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/tax-periods" element={<TaxPeriodsPage />} />
        <Route path="/nexus" element={<NexusPage />} />
        <Route path="/intercompany" element={<IntercompanyPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/catch-up" element={<CatchUpPage />} />
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/patterns" element={<PatternsPage />} />
        <Route path="/advisor" element={<AdvisorPage />} />
        <Route path="/fiscaliste" element={<FiscalistePage />} />
        <Route path="/accountant" element={<AccountantPage />} />
        <Route path="/filing-guide" element={<FilingGuidePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/onboarding" element={<OnboardingPage onComplete={() => window.location.href = '/'} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
