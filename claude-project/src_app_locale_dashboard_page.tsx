'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import {
  DollarSign, ShoppingCart, Package, AlertTriangle,
  TrendingUp, ArrowUpRight, ArrowDownRight, Clock,
  Plus, BarChart3, FileText, Zap, ChevronRight
} from 'lucide-react';

interface DashboardData {
  todaySales: { count: number; total: number };
  totalProducts: number;
  lowStock: number;
  pendingPayments: { count: number; total: number };
  recentSales: Array<{
    id: number;
    invoice_number: string;
    total_amount: number;
    payment_status: string;
    cashier_name: string;
    customer_name: string | null;
    company_name: string | null;
    created_at: string;
  }>;
  totalRevenue: number;
  lowStockItems: Array<{
    id: number;
    product_name: string;
    variant_name: string;
    stock_quantity: number;
    min_stock: number;
    barcode: string;
  }>;
}

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/data?entity=dashboard');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="skeleton h-4 w-24 mb-3" />
              <div className="skeleton h-8 w-32 mb-2" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6">
            <div className="skeleton h-6 w-40 mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full mb-2" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: t('dashboard.todaySales'),
      value: formatCurrency(data?.todaySales?.total || 0),
      subtitle: `${data?.todaySales?.count || 0} transactions`,
      icon: ShoppingCart,
      color: 'stat-blue',
      iconBg: 'rgba(59,130,246,0.12)',
      iconColor: 'var(--color-primary-400)',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: t('dashboard.totalRevenue'),
      value: formatCurrency(data?.totalRevenue || 0),
      subtitle: 'All time',
      icon: DollarSign,
      color: 'stat-green',
      iconBg: 'rgba(34,197,94,0.12)',
      iconColor: 'var(--color-success-400)',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: t('dashboard.totalProducts'),
      value: String(data?.totalProducts || 0),
      subtitle: 'Active products',
      icon: Package,
      color: 'stat-purple',
      iconBg: 'rgba(139,92,246,0.12)',
      iconColor: 'var(--color-accent-400)',
    },
    {
      title: t('dashboard.lowStock'),
      value: String(data?.lowStock || 0),
      subtitle: 'Need restocking',
      icon: AlertTriangle,
      color: data?.lowStock && data.lowStock > 0 ? 'stat-red' : 'stat-orange',
      iconBg: data?.lowStock && data.lowStock > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
      iconColor: data?.lowStock && data.lowStock > 0 ? 'var(--color-danger-400)' : 'var(--color-warning-400)',
      alert: (data?.lowStock || 0) > 0,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            {t('dashboard.welcome')}, {user?.name} 👋
          </h1>
          <p className="page-subtitle mt-1">
            Here&apos;s what&apos;s happening with your store today
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/dashboard/pos`} className="btn btn-primary" id="quick-new-sale">
            <Plus size={16} />
            {t('dashboard.newSale')}
          </Link>
          <Link href={`/${locale}/dashboard/products`} className="btn btn-secondary" id="quick-add-product">
            <Package size={16} />
            {t('dashboard.addProduct')}
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`glass-card glass-card-hover p-5 animate-slide-up opacity-0 ${stat.color}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.title}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {stat.trend && (
                      <span
                        className="flex items-center text-xs font-semibold"
                        style={{ color: stat.trendUp ? 'var(--color-success-400)' : 'var(--color-danger-400)' }}
                      >
                        {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {stat.trend}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.subtitle}</span>
                  </div>
                </div>
                <div
                  className="p-2.5 rounded-xl shrink-0"
                  style={{ background: stat.iconBg }}
                >
                  <Icon size={20} style={{ color: stat.iconColor }} />
                </div>
              </div>
              {stat.alert && (
                <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-danger-400)' }}>
                  <span className="status-dot offline" style={{ width: 6, height: 6 }} />
                  Items need attention
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pending payments banner */}
      {data?.pendingPayments && data.pendingPayments.count > 0 && (
        <div
          className="glass-card stat-orange flex items-center justify-between p-4 gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Clock size={18} style={{ color: 'var(--color-warning-400)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.pendingPayments')}: {data.pendingPayments.count} invoices
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Outstanding: {formatCurrency(data.pendingPayments.total)}
              </p>
            </div>
          </div>
          <Link href={`/${locale}/dashboard/invoices`} className="btn btn-sm btn-secondary shrink-0">
            View <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="lg:col-span-2 glass-card overflow-hidden animate-slide-up opacity-0 animate-stagger-2">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2.5">
              <TrendingUp size={17} style={{ color: 'var(--color-primary-400)' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: 15 }}>
                {t('dashboard.recentSales')}
              </h2>
            </div>
            <Link
              href={`/${locale}/dashboard/invoices`}
              className="text-sm flex items-center gap-1"
              style={{ color: 'var(--color-primary-400)' }}
            >
              View all <ChevronRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {data?.recentSales && data.recentSales.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('invoices.invoiceNumber')}</th>
                    <th>{t('pos.customer')}</th>
                    <th>{t('common.amount')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td
                        className="font-mono text-sm"
                        style={{ color: 'var(--color-primary-400)' }}
                      >
                        {sale.invoice_number}
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>
                        {sale.company_name || sale.customer_name || 'Walk-in'}
                      </td>
                      <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td>
                        <span className={`badge ${sale.payment_status === 'paid' ? 'badge-success' :
                          sale.payment_status === 'partial' ? 'badge-warning' : 'badge-danger'
                          }`}>
                          {sale.payment_status}
                        </span>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDateTime(sale.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No sales yet today</p>
                <Link href={`/${locale}/dashboard/pos`} className="btn btn-primary btn-sm mt-3 inline-flex">
                  <Plus size={14} />
                  Make your first sale
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="glass-card p-4 animate-slide-up opacity-0 animate-stagger-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <Zap size={13} style={{ color: 'var(--color-warning-400)' }} />
              {t('dashboard.quickActions')}
            </h3>
            <div className="space-y-1">
              {[
                { href: '/dashboard/pos', icon: ShoppingCart, label: t('dashboard.newSale'), iconBg: 'rgba(59,130,246,0.1)', iconColor: 'var(--color-primary-400)' },
                { href: '/dashboard/products', icon: Package, label: t('dashboard.addProduct'), iconBg: 'rgba(139,92,246,0.1)', iconColor: 'var(--color-accent-400)' },
                { href: '/dashboard/reports', icon: BarChart3, label: t('dashboard.viewReports'), iconBg: 'rgba(34,197,94,0.1)', iconColor: 'var(--color-success-400)' },
                { href: '/dashboard/invoices', icon: FileText, label: t('invoices.title'), iconBg: 'rgba(245,158,11,0.1)', iconColor: 'var(--color-warning-400)' },
              ].map(({ href, icon: Icon, label, iconBg, iconColor }) => (
                <Link
                  key={href}
                  href={`/${locale}${href}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg group transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="p-2 rounded-lg shrink-0" style={{ background: iconBg }}>
                    <Icon size={14} style={{ color: iconColor }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                  <ChevronRight size={13} className="ms-auto" style={{ color: 'var(--text-tertiary)' }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Low Stock */}
          <div className="glass-card overflow-hidden animate-slide-up opacity-0 animate-stagger-4">
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <AlertTriangle size={14} style={{ color: 'var(--color-warning-400)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.lowStock')}
              </h3>
              {data?.lowStockItems && data.lowStockItems.length > 0 && (
                <span className="badge badge-warning ms-auto">{data.lowStockItems.length}</span>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {data?.lowStockItems && data.lowStockItems.length > 0 ? (
                <div>
                  {data.lowStockItems.map((item, i) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 transition-colors"
                      style={{
                        borderBottom: i < data.lowStockItems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.product_name}
                      </p>
                      {item.variant_name && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.variant_name}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-mono" style={{ color: 'var(--color-danger-400)' }}>
                          {item.stock_quantity} / {item.min_stock} min
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  <Package size={24} className="mx-auto mb-2 opacity-30" />
                  All items well stocked
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}