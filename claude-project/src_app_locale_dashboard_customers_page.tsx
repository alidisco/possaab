'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import { Users, Plus, Search, Edit, Trash2, X, Loader2, Building2 } from 'lucide-react';

interface Customer {
  id: number; type: string; company_name: string; name: string;
  phone: string; address: string; notes: string;
  credit_limit: number | null; balance: number; loyalty_points: number;
  created_at: string;
}

export default function CustomersPage() {
  const t = useTranslations();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'retail', company_name: '', name: '', phone: '', address: '', notes: '', credit_limit: '',
  });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async (q?: string, type?: string) => {
    try {
      let url = '/api/data?entity=customers';
      if (q) url += `&search=${encodeURIComponent(q)}`;
      if (type) url += `&type=${type}`;
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch { } finally { setLoading(false); }
  };

  const handleSearch = (v: string) => { setSearch(v); fetchCustomers(v, filter); };
  const handleFilter = (v: string) => { setFilter(v); fetchCustomers(search, v); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null };
      if (editCustomer) {
        await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'customers', id: editCustomer.id, data }) });
      } else {
        await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'customers', data }) });
      }
      fetchCustomers(search, filter);
      resetForm();
    } catch { } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer?')) return;
    await fetch(`/api/data?entity=customers&id=${id}`, { method: 'DELETE' });
    fetchCustomers(search, filter);
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setForm({ type: c.type, company_name: c.company_name || '', name: c.name || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '', credit_limit: c.credit_limit ? String(c.credit_limit) : '' });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false); setEditCustomer(null);
    setForm({ type: 'retail', company_name: '', name: '', phone: '', address: '', notes: '', credit_limit: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users size={22} style={{ color: 'var(--color-primary-400)' }} />
            {t('customers.title')}
          </h1>
          <p className="page-subtitle mt-1">Manage retail and wholesale customers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary" id="add-customer-btn">
          <Plus size={16} /> {t('customers.addCustomer')}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search customers…" className="input-field pl-9" />
        </div>
        <div className="flex gap-1">
          {['', 'retail', 'wholesale'].map((f) => (
            <button key={f} onClick={() => handleFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
              {f === '' ? t('common.all') : f === 'retail' ? t('customers.retail') : t('customers.wholesale')}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden animate-slide-up opacity-0 animate-stagger-2">
        {loading ? (
          <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <Users size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No customers found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('customers.customerType')}</th>
                <th>{t('common.phone')}</th>
                <th>{t('customers.balance')}</th>
                <th>{t('customers.creditLimit')}</th>
                <th>{t('customers.loyaltyPoints')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{
                        background: c.type === 'wholesale'
                          ? 'linear-gradient(135deg, var(--color-accent-600), var(--color-primary-600))'
                          : 'linear-gradient(135deg, var(--color-success-600), var(--color-primary-600))'
                      }}>
                        {(c.company_name || c.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{c.company_name || c.name}</p>
                        {c.company_name && c.name && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{c.name}</p>}
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${c.type === 'wholesale' ? 'badge-info' : 'badge-success'}`}>{c.type}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                  <td style={{ color: c.balance > 0 ? 'var(--color-warning-400)' : 'var(--text-secondary)', fontWeight: c.balance > 0 ? 600 : 400 }}>
                    {formatCurrency(c.balance)}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.credit_limit ? formatCurrency(c.credit_limit) : 'No limit'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.loyalty_points}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="btn btn-ghost p-2"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-ghost p-2" style={{ color: 'var(--color-danger-400)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay animate-fade-in">
          <div className="animate-scale-up w-full max-w-lg mx-4" style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: 28,
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editCustomer ? t('customers.editCustomer') : t('customers.addCustomer')}
              </h2>
              <button onClick={resetForm} className="btn btn-ghost p-2"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('customers.customerType')}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, type: 'retail' })} className={`btn btn-sm flex-1 ${form.type === 'retail' ? 'btn-success' : 'btn-secondary'}`}>
                    <Users size={14} /> {t('customers.retail')}
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, type: 'wholesale' })} className={`btn btn-sm flex-1 ${form.type === 'wholesale' ? 'btn-primary' : 'btn-secondary'}`}>
                    <Building2 size={14} /> {t('customers.wholesale')}
                  </button>
                </div>
              </div>
              {form.type === 'wholesale' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('customers.companyName')}</label>
                  <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="input-field" required />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('common.name')}</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('common.phone')}</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('common.address')}</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
              </div>
              {form.type === 'wholesale' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('customers.creditLimit')} ($)</label>
                  <input type="number" step="0.01" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} className="input-field" placeholder="Leave empty for no limit" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('common.notes')}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {editCustomer ? 'Update' : 'Create'} Customer
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}