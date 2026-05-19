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
  Zap, LogOut, Globe, Bell, Sun, Moon,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/dashboard', adminOnly: false },
  { key: 'pos',       icon: ShoppingCart,    href: '/dashboard/pos', adminOnly: false },
  { divider: true, label: 'Management' },
  { key: 'products',   icon: Package,   href: '/dashboard/products',   adminOnly: false },
  { key: 'categories', icon: Layers,    href: '/dashboard/categories', adminOnly: true  },
  { key: 'inventory',  icon: Warehouse, href: '/dashboard/inventory',  adminOnly: false },
  { key: 'customers',  icon: Users,     href: '/dashboard/customers',  adminOnly: false },
  { key: 'suppliers',  icon: Truck,     href: '/dashboard/suppliers',  adminOnly: true  },
  { divider: true, label: 'Transactions' },
  { key: 'invoices',  icon: FileText,   href: '/dashboard/invoices',  adminOnly: false },
  { key: 'purchases', icon: Receipt,    href: '/dashboard/purchases', adminOnly: true  },
  { key: 'expenses',  icon: DollarSign, href: '/dashboard/expenses',  adminOnly: true  },
  { key: 'returns',   icon: RotateCcw,  href: '/dashboard/returns',   adminOnly: false },
  { divider: true, label: 'System' },
  { key: 'reports',  icon: BarChart3, href: '/dashboard/reports',  adminOnly: true },
  { key: 'barcodes', icon: Barcode,   href: '/dashboard/barcodes', adminOnly: true },
  { key: 'users',    icon: UserCog,   href: '/dashboard/users',    adminOnly: true },
  { key: 'settings', icon: Settings,  href: '/dashboard/settings', adminOnly: true },
  { key: 'backups',  icon: Database,  href: '/dashboard/backups',  adminOnly: true },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useUIStore();

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !user) router.push(`/${locale}/login`);
  }, [isAuthenticated, user, router, locale]);

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => { logout(); router.push(`/${locale}/login`); };

  const toggleLocale = () => {
    const nl = locale === 'en' ? 'ar' : 'en';
    router.push(pathname.replace(`/${locale}`, `/${nl}`));
  };

  const isActive = (href: string) => {
    const fp = `/${locale}${href}`;
    return href === '/dashboard' ? pathname === fp : pathname.startsWith(fp);
  };

  const isRTL = locale === 'ar';
  const W = sidebarCollapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* ── SIDEBAR ── */}
      <aside
        className="sidebar print:hidden"
        style={{
          width: W, minWidth: W,
          display: 'flex', flexDirection: 'column', height: '100%',
          transition: 'width 0.22s ease, min-width 0.22s ease',
          overflow: 'hidden', flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 14px', borderBottom: '1px solid var(--sidebar-border)', flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(59,130,246,0.35),rgba(139,92,246,0.35))',
            border: '1px solid rgba(59,130,246,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="#60a5fa" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in" style={{ overflow: 'hidden' }}>
              <div className="gradient-text" style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                Saab Electric
              </div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-text)', opacity: 0.65, whiteSpace: 'nowrap' }}>
                POS System
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {navItems.map((item, i) => {
            if ('divider' in item && item.divider) {
              if (sidebarCollapsed) {
                return <div key={i} style={{ height: 1, background: 'var(--sidebar-border)', margin: '8px 10px' }} />;
              }
              return (
                <div key={i} style={{
                  padding: '14px 16px 4px',
                  fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  color: 'var(--sidebar-text)', opacity: 0.5,
                }}>
                  {t(`nav.${item.label!.toLowerCase()}`)}
                </div>
              );
            }

            const nav = item as { key: string; icon: React.ElementType; href: string; adminOnly: boolean };
            if (nav.adminOnly && user.role !== 'admin') return null;
            const Icon = nav.icon;
            const active = isActive(nav.href);

            return (
              <Link
                key={nav.key}
                href={`/${locale}${nav.href}`}
                className={`sidebar-link${active ? ' active' : ''}`}
                title={sidebarCollapsed ? t(`nav.${nav.key}`) : undefined}
                style={{ justifyContent: sidebarCollapsed ? 'center' : undefined }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t(`nav.${nav.key}`)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: 8, borderTop: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
          <button
            onClick={toggleSidebar}
            className="sidebar-link"
            style={{ width: '100%', justifyContent: 'center', gap: sidebarCollapsed ? 0 : 8 }}
          >
            {sidebarCollapsed
              ? (isRTL ? <ChevronRight size={15} /> : <ChevronLeft size={15} />)
              : (isRTL ? <ChevronLeft size={15} /> : <ChevronRight size={15} />)
            }
            {!sidebarCollapsed && (
              <span style={{ fontSize: 12.5 }}>{t('common.collapse')}</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <header
          className="print:hidden"
          style={{
            height: 60, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', gap: 12,
            background: 'var(--header-bg)',
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 12px', borderRadius: 8,
            background: 'var(--input-bg)',
            border: '1px solid var(--border-default)',
            flex: 1, maxWidth: 280,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder={t('common.search')}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13.5, color: 'var(--text-primary)', width: '100%', fontFamily: 'inherit',
              }}
            />
            <kbd style={{
              fontSize: 10, color: 'var(--text-tertiary)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              padding: '1px 5px', borderRadius: 4, fontFamily: 'inherit', flexShrink: 0,
            }}>⌘K</kbd>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost"
              style={{ padding: 7, borderRadius: 8 }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications */}
            <button className="btn btn-ghost" style={{ padding: 7, borderRadius: 8, position: 'relative' }}>
              <Bell size={17} />
              <span style={{
                position: 'absolute', top: 7, right: 7,
                width: 6, height: 6, borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 0 2px var(--header-bg)',
              }} />
            </button>

            {/* Language */}
            <button onClick={toggleLocale} className="btn btn-ghost" style={{ padding: 7, borderRadius: 8 }}>
              <Globe size={17} />
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 22, background: 'var(--border-subtle)', margin: '0 8px' }} />

            {/* User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                  {user.role}
                </div>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
                boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{ padding: 7, borderRadius: 8 }}
                title={t('auth.logout')}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-base)' }}
          className="print:p-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}