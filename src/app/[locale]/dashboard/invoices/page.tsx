'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { FileText } from 'lucide-react';

interface Invoice {
  id: number; invoice_number: string; customer_name: string;
  company_name: string; cashier_name: string; payment_status: string;
  total_amount: number; paid_amount: number; remaining_amount: number;
  currency: string; created_at: string;
}

export default function InvoicesPage() {
  const t = useTranslations();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async (status?: string) => {
    try {
      let url = '/api/data?entity=invoices';
      if (status) url += `&status=${status}`;
      const res = await fetch(url);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch { } finally { setLoading(false); }
  };

  const handleFilter = (v: string) => { setFilter(v); fetchInvoices(v); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <FileText size={22} style={{ color: 'var(--color-primary-400)' }} />
          {t('invoices.title')}
        </h1>
        <p className="page-subtitle mt-1">View and manage all invoices</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'paid', 'partial', 'unpaid'].map((f) => (
          <button key={f} onClick={() => handleFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <FileText size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No invoices found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('invoices.invoiceNumber')}</th>
                <th>{t('pos.customer')}</th>
                <th>Cashier</th>
                <th>{t('common.total')}</th>
                <th>{t('invoices.paidAmount')}</th>
                <th>{t('invoices.remainingAmount')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.date')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono text-sm" style={{ color: 'var(--color-primary-400)' }}>{inv.invoice_number}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{inv.company_name || inv.customer_name || 'Walk-in'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{inv.cashier_name}</td>
                  <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(inv.total_amount)}</td>
                  <td style={{ color: 'var(--color-success-400)' }}>{formatCurrency(inv.paid_amount)}</td>
                  <td style={{
                    color: inv.remaining_amount > 0 ? 'var(--color-warning-400)' : 'var(--text-tertiary)',
                    fontWeight: inv.remaining_amount > 0 ? 600 : 400,
                  }}>
                    {formatCurrency(inv.remaining_amount)}
                  </td>
                  <td>
                    <span className={`badge ${inv.payment_status === 'paid' ? 'badge-success' : inv.payment_status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDateTime(inv.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}