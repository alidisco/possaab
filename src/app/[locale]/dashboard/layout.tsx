'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore, useUIStore } from '@/lib/store';
import Link from 'next/link';
import {
  LayoutDashboard, ShoppingCart, Package, Layers, Warehouse,
  Users, Truck, FileText, Receipt, DollarSign, RotateCcw,
  BarChart3, UserCog, Settings, Database, Barcode,
  Zap, LogOut, Globe, Bell, Search, Sun, Moon,
  PanelLeftClose, PanelLeftOpen, X, ChevronRight, Command,
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

  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated || !user) router.push(`/${locale}/login`);
  }, [isAuthenticated, user, router, locale]);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus command input when palette opens
  useEffect(() => {
    if (cmdOpen) setTimeout(() => cmdInputRef.current?.focus(), 50);
  }, [cmdOpen]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => { logout(); router.push(`/${locale}/login`); };

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    router.push(pathname.replace(`/${locale}`, `/${newLocale}`));
  };

  const isActive = (href: string) => {
    const full = `/${locale}${href}`;
    return href === '/dashboard' ? pathname === full : pathname.startsWith(full);
  };

  const isRTL = locale === 'ar';

  // Command palette items
  const allNavItems = navItems.filter(i => !('divider' in i)) as Array<{ key: string; icon: React.ElementType; href: string; adminOnly: boolean }>;
  const filteredCmds = cmdQuery
    ? allNavItems.filter(i => t(`nav.${i.key}`).toLowerCase().includes(cmdQuery.toLowerCase()))
    : allNavItems.slice(0, 8);

  // Current page label for header
  const currentNav = allNavItems.find(i => isActive(i.href));

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar flex flex-col h-full print:hidden shrink-0 ${sidebarCollapsed ? 'w-[64px]' : 'w-[248px]'}`}
        style={{ transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3.5 h-16 shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(139,92,246,0.22))',
              border: '1px solid rgba(96,165,250,0.3)',
              boxShadow: '0 0 16px rgba(59,130,246,0.18)',
            }}
          >
            <Zap size={16} style={{ color: '#93c5fd' }} />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in overflow-hidden min-w-0">
              <h1 className="text-sm font-bold gradient-text whitespace-nowrap leading-tight">Saab Electric</h1>
              <p className="text-[10px] whitespace-nowrap leading-tight" style={{ color: 'var(--sidebar-text)' }}>POS System</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item, idx) => {
            if ('divider' in item && item.divider) {
              return sidebarCollapsed ? (
                <div key={idx} className="my-1.5 mx-2.5" style={{ height: '1px', background: 'var(--sidebar-border)' }} />
              ) : (
                <div key={idx} className="px-4 pt-4 pb-1">
                  <span className="section-header" style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}>
                    {t(`nav.${item.label!.toLowerCase()}`)}
                  </span>
                </div>
              );
            }

            const ni = item as { key: string; icon: React.ElementType; href: string; adminOnly: boolean };
            if (ni.adminOnly && user.role !== 'admin') return null;
            const Icon = ni.icon;
            const active = isActive(ni.href);

            return (
              <Link
                key={ni.key}
                href={`/${locale}${ni.href}`}
                className={`sidebar-link ${active ? 'active' : ''}`}
                title={sidebarCollapsed ? t(`nav.${ni.key}`) : undefined}
                style={{ justifyContent: sidebarCollapsed ? 'center' : undefined }}
              >
                <Icon size={17} className="shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{t(`nav.${ni.key}`)}</span>}
                {active && !sidebarCollapsed && (
                  <span className="ms-auto w-1 h-1 rounded-full shrink-0" style={{
                    background: 'var(--color-primary-400)',
                    boxShadow: '0 0 6px var(--color-primary-400)',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <button
            onClick={toggleSidebar}
            className="sidebar-link w-full"
            style={{ justifyContent: sidebarCollapsed ? 'center' : undefined, margin: 0 }}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed
              ? (isRTL ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />)
              : (isRTL ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />)
            }
            {!sidebarCollapsed && <span className="text-[12.5px]">{t('common.collapse')}</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header
          className="flex items-center justify-between h-16 px-5 shrink-0 print:hidden"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {/* Left — page label + search */}
          <div className="flex items-center gap-4">
            {currentNav && (
              <div className="hidden lg:flex items-center gap-2 text-sm animate-fade-in">
                <span style={{ color: 'var(--text-tertiary)' }}>{t('nav.dashboard')}</span>
                <ChevronRight size={13} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t(`nav.${currentNav.key}`)}</span>
              </div>
            )}

            {/* Search trigger (command palette) */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex search-trigger"
            >
              <Search size={13} />
              <span className="flex-1">{t('common.search')}</span>
              <span className="flex items-center gap-0.5">
                <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 5, padding: '1px 5px', fontSize: 10, color: 'var(--text-tertiary)' }}>⌘</kbd>
                <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 5, padding: '1px 5px', fontSize: 10, color: 'var(--text-tertiary)' }}>K</kbd>
              </span>
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon hover-scale"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark'
                ? <Sun size={16} style={{ color: 'var(--text-secondary)' }} />
                : <Moon size={16} style={{ color: 'var(--text-secondary)' }} />
              }
            </button>

            <button className="btn btn-ghost btn-icon hover-bell-wiggle relative">
              <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-danger-500)', boxShadow: '0 0 0 2px var(--header-bg)' }} />
            </button>

            <button onClick={toggleLocale} className="btn btn-ghost btn-icon hover-scale" title="Switch language">
              <Globe size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>

            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(prev => !prev)}
                className="user-menu-btn"
              >
                <div className="hidden sm:block" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                  <p className="text-[12.5px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                  <p className="text-[10.5px] capitalize leading-tight" style={{ color: 'var(--text-tertiary)' }}>{user.role}</p>
                </div>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 glass-card p-1.5 animate-fade-up"
                  style={{ zIndex: 1000, minWidth: 180 }}
                >
                  <div className="px-3 py-2 mb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <p className="text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{user.role}</p>
                  </div>
                  <Link
                    href={`/${locale}/dashboard/settings`}
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={14} />
                    {t('nav.settings')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item dropdown-item-danger"
                  >
                    <LogOut size={14} />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 print:p-0" style={{ background: 'var(--bg-base)' }}>
          {children}
        </main>
      </div>

      {/* ── Command Palette ── */}
      {cmdOpen && (
        <div className="command-palette" onClick={() => setCmdOpen(false)}>
          <div className="command-palette-box" onClick={e => e.stopPropagation()}>
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <input
                ref={cmdInputRef}
                type="text"
                placeholder="Search pages..."
                value={cmdQuery}
                onChange={e => setCmdQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: 'var(--text-primary)', caretColor: 'var(--color-primary-400)', fontSize: 14 }}
              />
              <button onClick={() => setCmdOpen(false)} className="btn btn-ghost p-1 btn-icon" style={{ borderRadius: 6 }}>
                <X size={14} />
              </button>
            </div>

            {/* Results */}
            <div className="p-2 max-h-80 overflow-y-auto">
              {filteredCmds.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>No results</p>
              ) : filteredCmds.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.key}
                    href={`/${locale}${item.href}`}
                    onClick={() => setCmdOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${!active ? 'hover-bg-item' : ''}`}
                    style={{
                      background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                      color: active ? 'var(--color-primary-400)' : 'var(--text-secondary)',
                    }}
                  >
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t(`nav.${item.key}`)}</span>
                    {active && <span className="ms-auto badge badge-info text-[10px]">Current</span>}
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 flex items-center gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                <kbd style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>↑↓</kbd> navigate
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                <kbd style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>↵</kbd> open
              </span>
              <span className="text-[11px] ms-auto" style={{ color: 'var(--text-tertiary)' }}>
                <kbd style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>esc</kbd> close
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}