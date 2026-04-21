import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import {
  LayoutDashboard, Upload, ClipboardList, Calendar, FileText,
  Bot, Settings, LogOut, Menu, X, ChevronRight, Zap, ArrowLeftRight,
  MapPin, ClipboardCheck, Sun, Moon, Bell, Flame, Search, BookOpen,
  Brain, Shield
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'reviewer', 'viewer'] },
  { path: '/upload', label: 'Upload Statement', icon: Upload, roles: ['admin', 'reviewer'] },
  { path: '/review', label: 'Review Queue', icon: ClipboardList, roles: ['admin', 'reviewer'] },
  { path: '/search', label: 'Search', icon: Search, roles: ['admin', 'reviewer', 'viewer'] },
  { path: '/tax-periods', label: 'Tax Periods', icon: Calendar, roles: ['admin', 'reviewer', 'viewer'] },
  { path: '/nexus', label: 'US Sales Tax', icon: MapPin, roles: ['admin', 'reviewer', 'viewer'] },
  { path: '/intercompany', label: 'Intercompany', icon: ArrowLeftRight, roles: ['admin', 'reviewer', 'viewer'] },
  { path: '/reports', label: 'Reports & Exports', icon: FileText, roles: ['admin', 'reviewer', 'viewer'] },
  { path: '/catch-up', label: 'Catch-Up Board', icon: Flame, roles: ['admin', 'reviewer'] },
  { path: '/checklist', label: 'Monthly Close', icon: ClipboardCheck, roles: ['admin', 'reviewer'] },
  { path: '/filing-guide', label: 'Filing Guide', icon: BookOpen, roles: ['admin', 'reviewer', 'viewer'] },
  { path: '/patterns', label: 'Patterns', icon: Zap, roles: ['admin', 'reviewer'] },
  { path: '/advisor', label: 'AI Advisor', icon: Bot, roles: ['admin', 'reviewer', 'viewer'] },
  { path: '/fiscaliste', label: 'AI Fiscaliste', icon: Brain, roles: ['admin'] },
  { path: '/accountant', label: 'AI Accountant', icon: Shield, roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { appUser, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deadlineCounts, setDeadlineCounts] = useState({ upcoming: 0, overdue: 0 });
  const [notifOpen, setNotifOpen] = useState(false);
  const [overdueDeadlines, setOverdueDeadlines] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch deadline counts for sidebar badges
  useEffect(() => {
    async function loadDeadlines() {
      try {
        const [upcoming, overdue] = await Promise.all([
          api.getUpcomingDeadlines(30).catch(() => []),
          api.getOverdueDeadlines().catch(() => []),
        ]);
        const upcomingArr = Array.isArray(upcoming) ? upcoming : [];
        const overdueArr = Array.isArray(overdue) ? overdue : [];
        setDeadlineCounts({
          upcoming: upcomingArr.length,
          overdue: overdueArr.length,
        });
        setUpcomingDeadlines(upcomingArr);
        setOverdueDeadlines(overdueArr);
      } catch { /* silent */ }
    }
    loadDeadlines();
    const interval = setInterval(loadDeadlines, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [notifOpen]);

  const totalDeadlineAlerts = deadlineCounts.upcoming + deadlineCounts.overdue;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 flex flex-col
        transform transition-transform lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
            <span className="text-lg font-semibold text-white">Tax Dashboard</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Deadline notification banner with dropdown */}
        {totalDeadlineAlerts > 0 && (
          <div className="mx-3 mt-3 mb-1 relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Bell size={14} />
              <span>
                {deadlineCounts.overdue > 0 && <span className="font-bold">{deadlineCounts.overdue} overdue</span>}
                {deadlineCounts.overdue > 0 && deadlineCounts.upcoming > 0 && ' · '}
                {deadlineCounts.upcoming > 0 && <span>{deadlineCounts.upcoming} upcoming</span>}
              </span>
            </button>
            {notifOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="p-3">
                  {overdueDeadlines.length > 0 && (
                    <>
                      <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">Overdue</h4>
                      {overdueDeadlines.slice(0, 5).map((d: any) => (
                        <div key={d.id} className="py-1.5 text-sm text-slate-300 flex justify-between">
                          <span>{d.company_name} — {d.period_label}</span>
                          <span className="text-red-400 text-xs">{d.days_overdue}d overdue</span>
                        </div>
                      ))}
                    </>
                  )}
                  {upcomingDeadlines.length > 0 && (
                    <>
                      <h4 className="text-xs font-semibold text-yellow-400 uppercase mb-2 mt-3">Upcoming</h4>
                      {upcomingDeadlines.slice(0, 5).map((d: any) => (
                        <div key={d.id} className="py-1.5 text-sm text-slate-300 flex justify-between">
                          <span>{d.company_name} — {d.period_label}</span>
                          <span className="text-yellow-400 text-xs">in {d.days_until}d</span>
                        </div>
                      ))}
                    </>
                  )}
                  <Link to="/tax-periods" className="block text-center text-xs text-blue-400 mt-3 hover:underline" onClick={() => { setNotifOpen(false); setSidebarOpen(false); }}>View All Deadlines →</Link>
                </div>
              </div>
            )}
          </div>
        )}

        <nav className="p-3 space-y-1 overflow-y-auto flex-1 pb-20">
          {NAV_ITEMS.filter(item => item.roles.includes(appUser?.role || 'viewer')).map(item => {
            const isActive = location.pathname === item.path;
            const isCatchUp = item.path === '/catch-up';
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {/* Badge for Tax Periods */}
                {item.path === '/tax-periods' && deadlineCounts.overdue > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">{deadlineCounts.overdue}</span>
                )}
                {/* Badge for Catch-Up */}
                {isCatchUp && deadlineCounts.overdue > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full">{deadlineCounts.overdue}</span>
                )}
                {isActive && !item.path.includes('tax-periods') && !isCatchUp && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {appUser?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{appUser?.name || 'User'}</p>
              <p className="text-xs text-slate-400 capitalize">{appUser?.role || 'loading'}</p>
            </div>
            <button onClick={signOut} className="text-slate-400 hover:text-red-400 transition-colors" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center">
            <button className="text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <span className="ml-3 text-lg font-semibold text-white">Tax Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            {totalDeadlineAlerts > 0 && (
              <Link to="/tax-periods" className="relative text-slate-400 hover:text-white">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">{totalDeadlineAlerts}</span>
              </Link>
            )}
            <button onClick={toggleTheme} className="text-slate-400 hover:text-white">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
