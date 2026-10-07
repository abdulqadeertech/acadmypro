import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getPersonAvatar } from '../lib/defaultAvatars';
import { ToastContainer } from './ui';
import {
  Menu, X, Wifi, WifiOff, LogOut, ChevronDown, ChevronRight, Bell, RefreshCw, Sun, Moon,
  Users, GraduationCap, BookOpen, Wallet, Settings, BarChart3, Search,
  Calendar, FileText, MessageSquare, Shield, ClipboardList,
  Home, UserPlus, ClipboardCheck, Clock, MapPin, DollarSign,
  Package, Star, CreditCard, Award, FileCheck, User, Printer, Tags, Sparkles, Mail, FileBadge, MessageCircle, ContactRound, LibraryBig, Calculator
} from 'lucide-react';

const navGroups = [
  { label: 'Dashboard', icon: Home, items: [{ label: 'Overview', to: '/', icon: Home }] },
  { label: 'Academics', icon: BookOpen, items: [
    { label: 'Classes & Batches', to: '/classes', icon: BookOpen, permission: 'classes.view' },
    { label: 'Subjects', to: '/subjects', icon: FileText, permission: 'classes.view' },
    { label: 'Teacher Subjects', to: '/teacher-subjects', icon: GraduationCap, permission: 'users.view' },
    { label: 'Timetable', to: '/timetable', icon: Clock, permission: 'timetable.view' },
  ] },
  { label: 'Students', icon: Users, items: [
    { label: 'All Students', to: '/students', icon: Users, permission: 'students.view' },
    { label: 'Student Information', to: '/student-information', icon: LibraryBig, permission: 'students.view' },
    { label: 'Certificates', to: '/certificates', icon: FileBadge, permission: 'documents.view' },
  ] },
  { label: 'Admissions', icon: UserPlus, items: [
    { label: 'Admissions', to: '/admissions', icon: UserPlus, permission: 'admissions.view' },
    { label: 'Front Office', to: '/front-office', icon: ContactRound, permission: 'admissions.view' },
  ] },
  { label: 'Parents / Guardians', icon: UserPlus, items: [{ label: 'All Parents', to: '/parents', icon: UserPlus, permission: 'parents.view' }] },
  { label: 'Attendance', icon: ClipboardCheck, items: [
    { label: 'Student Attendance', to: '/attendance', icon: ClipboardCheck, permission: 'attendance.view' },
    { label: 'Teacher & Staff Attendance', to: '/teacher-attendance', icon: ClipboardCheck, permission: 'teacher_attendance.view' },
  ] },
  { label: 'Exams & Results', icon: FileCheck, items: [
    { label: 'Exams', to: '/exams', icon: FileCheck, permission: 'exams.view' },
    { label: 'Report Cards', to: '/report-cards', icon: Award, permission: 'results.view' },
  ] },
  { label: 'Finance', icon: Wallet, items: [
    { label: 'Fee Invoices', to: '/fees', icon: DollarSign, permission: 'fees.view' },
    { label: 'Payments', to: '/payments', icon: CreditCard, permission: 'payments.view' },
    { label: 'Expenses', to: '/expenses', icon: Wallet, permission: 'expenses.view' },
    { label: 'Fee Structures', to: '/fee-structures', icon: ClipboardList, permission: 'fees.view' },
    { label: 'Payroll Management', to: '/payroll-management', icon: Calculator, permission: 'payroll.view' },
    { label: 'Scholarships', to: '/scholarships', icon: Award, permission: 'scholarships.view' },
  ] },
  { label: 'Staff & HR', icon: GraduationCap, items: [
    { label: 'Teachers', to: '/teachers', icon: GraduationCap, permission: 'teachers.view' },
    { label: 'Leave Management', to: '/leave-requests', icon: ClipboardList, permission: 'leave.view' },
    { label: 'Staff Documents', to: '/documents', icon: FileText, permission: 'documents.view' },
  ] },
  { label: 'Operations', icon: Package, items: [
    { label: 'Rooms', to: '/rooms', icon: MapPin, permission: 'rooms.view' },
    { label: 'Events', to: '/events', icon: Star, permission: 'events.view' },
    { label: 'Inventory & Assets', to: '/inventory', icon: Package, permission: 'inventory.view' },
  ] },
  { label: 'Communication', icon: MessageSquare, items: [
    { label: 'Notifications', to: '/notifications', icon: Bell, permission: 'notifications.view' },
    { label: 'SMS Communication', to: '/sms-communication', icon: MessageCircle, permission: 'messages.send' },
    { label: 'Messages', to: '/messages', icon: MessageSquare, permission: 'messages.view' },
  ] },
  { label: 'Reports & Analytics', icon: BarChart3, items: [{ label: 'Reports', to: '/reports', icon: BarChart3, permission: 'reports.view' }] },
  { label: 'Users & Roles', icon: Shield, items: [{ label: 'Users & Roles', to: '/users', icon: Shield, permission: 'users.view' }] },
  { label: 'Branches', icon: MapPin, items: [{ label: 'All Branches', to: '/branches', icon: MapPin, permission: 'users.view' }] },
  { label: 'Backup & Restore', icon: Settings, items: [{ label: 'Backup & Restore', to: '/backup', icon: Settings, permission: 'backup.create' }] },
  { label: 'Audit Logs', icon: FileText, items: [{ label: 'Audit Logs', to: '/audit-logs', icon: FileText, permission: 'audit.view' }] },
  { label: 'My Account', icon: User, items: [
    { label: 'My Portal', to: '/portal', icon: User, permission: 'portal.view' },
    { label: 'Sync Center', to: '/sync', icon: RefreshCw, permission: null },
  ] },
  { label: 'Settings', icon: Settings, items: [
    { label: 'Settings', to: '/settings', icon: Settings, permission: 'settings.view' },
    { label: 'Subscription & Billing', to: '/pricing', icon: Tags, permission: 'settings.view' },
  ] },
  { label: 'Help & Support', icon: Mail, items: [
    { label: 'Contact Support', to: '/contact', icon: Mail, permission: 'settings.view' },
    { label: 'About AcademyPro', to: '/features', icon: Sparkles, permission: 'settings.view' },
  ] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem('academypro_nav_groups') || '{}'); } catch { return {}; }
  });
  const { user, logout, can } = useAuth();
  const { language, isUrdu, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const nav = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); nav('/login'); };

  const visibleGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || can(item.permission)),
  })).filter(group => group.items.length > 0);

  const toggleGroup = label => setExpandedGroups(current => {
    const next = { ...current, [label]: !current[label] };
    localStorage.setItem('academypro_nav_groups', JSON.stringify(next));
    return next;
  });

  return (
    <div className="app-shell min-h-screen flex bg-slate-50">
      <ToastContainer />

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`app-sidebar fixed inset-y-0 left-0 z-50 bg-[#0c1628] text-white transition-all flex flex-col
        ${mobileOpen ? 'w-72 translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-[4.75rem]'}`}>

        {/* Logo */}
        <div className="h-20 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 grid place-items-center font-black text-lg shrink-0">A</div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="font-extrabold text-xl truncate">AcademyPro</div>
              <div className="text-[10px] text-slate-400">ACADEMY MANAGEMENT</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar">
          {visibleGroups.map(group => {
            const GroupIcon = group.icon;
            const hasActiveChild = group.items.some(item => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
            const isExpanded = group.label === 'Dashboard' || expandedGroups[group.label] || hasActiveChild;
            return (
              <div key={group.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => group.items.length === 1 ? nav(group.items[0].to) : toggleGroup(group.label)}
                  className={`mx-1 mb-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-left text-sm transition ${hasActiveChild ? 'border-indigo-300 bg-indigo-950 text-white' : 'border-transparent text-slate-300 hover:bg-slate-800'}`}
                  title={t(group.label)}
                  aria-expanded={isExpanded}
                >
                  <GroupIcon size={18} className="shrink-0" />
                  {sidebarOpen && <><span className="min-w-0 flex-1 truncate">{t(group.label)}</span>{group.items.length > 1 && (isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />)}</>}
                </button>
                {sidebarOpen && isExpanded && group.items.length > 1 && (
                  <div className="ml-5 border-l border-white/10 pl-2">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      return <NavLink key={item.to} end={item.to === '/'} to={item.to} className={({ isActive }) => `mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-xs transition ${isActive ? 'bg-indigo-900 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`} title={t(item.label)}><Icon size={15} className="shrink-0" /><span className="truncate">{t(item.label)}</span></NavLink>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-white/10 text-xs text-slate-500 shrink-0">
            AcademyPro v2.0
          </div>
        )}
      </aside>

      {/* Main */}
      <main className={`flex-1 min-w-0 transition-all ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[4.75rem]'}`}>
        {/* Header */}
        <header className="app-header min-h-16 bg-white border-b sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-2 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => window.innerWidth >= 1024 ? setSidebarOpen(!sidebarOpen) : setMobileOpen(!mobileOpen)}
              className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="app-search hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 lg:w-72">
              <Search size={16} />
              <input
                aria-label="Search AcademyPro"
                placeholder="Search AcademyPro"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
                onKeyDown={event => {
                  if (event.key === 'Enter' && event.currentTarget.value.trim()) nav(`/students?search=${encodeURIComponent(event.currentTarget.value.trim())}`);
                }}
              />
              <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 lg:inline">/</kbd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs font-semibold" aria-label="Language">
              <button type="button" onClick={() => setLanguage('en')} className={`px-2.5 py-1.5 rounded-md transition ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>EN</button>
              <button type="button" onClick={() => setLanguage('ur')} className={`px-2.5 py-1.5 rounded-md transition ${isUrdu ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>اردو</button>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Online status */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              {isOnline ? t('Online') : t('Offline')}
            </div>

            <button
              type="button"
              onClick={() => nav('/notifications')}
              className="relative hidden h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:grid"
              title={t('Notifications')}
              aria-label={t('Notifications')}
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => nav('/settings')}
              className="hidden h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:grid"
              title={t('Settings')}
              aria-label={t('Settings')}
            >
              <Settings size={18} />
            </button>

            <button
              onClick={() => window.print()}
              className="header-print-button p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              title={t('Print this section or save as PDF')}
              aria-label={t('Print this section or save as PDF')}
            >
              <Printer size={18} />
            </button>

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-blue-100 ring-1 ring-blue-200">
                <img src={user?.photo_url || getPersonAvatar(user)} alt={user?.name || 'User'} className="h-full w-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold leading-tight">{user?.name || 'Admin'}</div>
                <div className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title={t('Logout')} aria-label={t('Logout')}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="app-content p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
