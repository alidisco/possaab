'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore, useUIStore } from '@/lib/store';
import Link from 'next/link';
import {
  LayoutDashboard, ShoppingCart, Package, Layers, Warehouse,
  Users, Truck, FileText, Receipt, DollarSign, RotateCcw,
  BarChart3, UserCog, Settings, Database, Barcode,
  ChevronLeft, ChevronRight, Zap, LogOut, Globe, Menu,
  Bell, Search, Sun, Moon, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/dashboard', adminOnly: false },
  { key: 'pos', icon: ShoppingCart, href: '/dashboard/pos', adminOnly: false },
  { divider: true, label: 'Management' },
  { key: 'products', icon: Package, href: '/dashboard/products', adminOnly: false },
  { key: 'categories', icon: Layers, href: '/dashboard/categories', adminOnly: true },
  { key: 'inventory', icon: Warehouse, href: '/dashboard/inventory', adminOnly: false },
  { key: 'customers', icon: Users, href: '/dashboard/customers', adminOnly: false },
  { key: 'suppliers', icon: Truck, href: '/dashboard/suppliers', adminOnly: true },
  { divider: true, label: 'Transactions' },
  { key: 'invoices', icon: FileText, href: '/dashboard/invoices', adminOnly: false },
  { key: 'purchases', icon: Receipt, href: '/dashboard/purchases', adminOnly: true },
  { key: 'expenses', icon: DollarSign, href: '/dashboard/expenses', adminOnly: true },
  { key: 'returns', icon: RotateCcw, href: '/dashboard/returns', adminOnly: false },
  { divider: true, label: 'System' },
  { key: 'reports', icon: BarChart3, href: '/dashboard/reports', adminOnly: true },
  { key: 'barcodes', icon: Barcode, href: '/dashboard/barcodes', adminOnly: true },
  { key: 'users', icon: UserCog, href: '/dashboard/users', adminOnly: true },
  { key: 'settings', icon: Settings, href: '/dashboard/settings', adminOnly: true },
  { key: 'backups', icon: Database, href: '/dashboard/backups', adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useUIStore();

  // Apply theme class on mount & whenever theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, user, router, locale]);

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/login`);
  };

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === '/dashboard') return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  const isRTL = locale === 'ar';

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
      {/* ── Sidebar ── */}
      <aside
        className={`sidebar flex flex-col h-full print:hidden ${sidebarCollapsed ? 'w-[68px]' : 'w-[252px]'}`}
        style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 h-16 shrink-0"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25))',
              border: '1px solid rgba(59,130,246,0.35)',
              boxShadow: '0 0 16px rgba(59,130,246,0.2)',
            }}
          >
            <Zap size={18} style={{ color: '#60a5fa' }} />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1 className="text-sm font-bold gradient-text whitespace-nowrap">Saab Electric</h1>
              <p className="text-[10px] whitespace-nowrap" style={{ color: 'var(--sidebar-text)', opacity: 0.7 }}>
                POS System
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
          {navItems.map((item, index) => {
            if ('divider' in item && item.divider) {
              if (sidebarCollapsed) {
                return (
                  <div
                    key={index}
                    className="my-2 mx-3"
                    style={{ height: '1px', background: 'var(--sidebar-border)' }}
                  />
                );
              }
              return (
                <div key={index} className="px-5 pt-5 pb-1">
                  <span className="section-header" style={{ color: 'var(--sidebar-text)', opacity: 0.55 }}>
                    {t(`nav.${item.label.toLowerCase()}`)}
                  </span>
                </div>
              );
            }

            const navItem = item as { key: string; icon: React.ElementType; href: string; adminOnly: boolean };
            if (navItem.adminOnly && user.role !== 'admin') return null;

            const Icon = navItem.icon;
            const active = isActive(navItem.href);

            return (
              <Link
                key={navItem.key}
                href={`/${locale}${navItem.href}`}
                className={`sidebar-link ${active ? 'active' : ''}`}
                title={sidebarCollapsed ? t(`nav.${navItem.key}`) : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{t(`nav.${navItem.key}`)}</span>
                )}
                {active && !sidebarCollapsed && (
                  <span
                    className="ms-auto w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: 'var(--color-primary-400)', boxShadow: '0 0 6px var(--color-primary-400)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: collapse toggle */}
        <div
          className="p-3 shrink-0"
          style={{ borderTop: '1px solid var(--sidebar-border)' }}
        >
          <button
            onClick={toggleSidebar}
            className="sidebar-link w-full"
            style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
            id="sidebar-toggle"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              isRTL ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />
            ) : (
              isRTL ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />
            )}
            {!sidebarCollapsed && (
              <span className="text-[13px]">{t('common.collapse')}</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>

        {/* Top bar */}
        <header
          className="flex items-center justify-between h-16 px-5 shrink-0 print:hidden"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden btn btn-ghost p-2"
              style={{ borderRadius: 8 }}
            >
              <Menu size={19} />
            </button>

            {/* Search */}
            <div
              className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-lg w-72"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border-default)',
              }}
            >
              <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder={t('common.search')}
                className="bg-transparent border-none outline-none text-sm w-full"
                style={{
                  color: 'var(--text-primary)',
                  caretColor: 'var(--color-primary-400)',
                  fontSize: '13.5px',
                }}
                id="global-search"
              />
              <kbd
                className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'inherit',
                }}
              >
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-45"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ position: 'relative' }}
            >
              {theme === 'dark' ? (
                <Sun size={17} style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <Moon size={17} style={{ color: 'var(--text-secondary)' }} />
              )}
            </button>

            {/* Notifications */}
            <button
              className="btn btn-ghost p-2 rounded-lg relative hover-bell-wiggle transition-all duration-300 hover:scale-110"
              id="notifications-btn"
            >
              <Bell size={17} style={{ color: 'var(--text-secondary)' }} />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--color-danger-500)', boxShadow: '0 0 0 2px var(--header-bg)' }}
              />
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="btn btn-ghost p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:-rotate-12"
              id="header-language-toggle"
              title="Switch language"
            >
              <Globe size={17} style={{ color: 'var(--text-secondary)' }} />
            </button>

            {/* Divider */}
            <div
              className="w-px h-6 mx-1"
              style={{ background: 'var(--border-subtle)' }}
            />

            {/* User section */}
            <div className="flex items-center gap-2.5 ps-1">
              <div className="hidden sm:block" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {user.name}
                </p>
                <p className="text-[11px] capitalize leading-tight" style={{ color: 'var(--text-tertiary)' }}>
                  {user.role}
                </p>
              </div>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 select-none transition-all duration-300 hover:scale-110 hover:rotate-6 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="btn btn-ghost p-2 rounded-lg transition-all duration-300 hover:scale-110"
                id="logout-btn"
                title={t('auth.logout')}
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger-400)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-6 print:p-0"
          style={{ background: 'var(--bg-base)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}