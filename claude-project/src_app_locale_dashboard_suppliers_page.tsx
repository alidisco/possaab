'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import { Truck, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';

interface Supplier { id: number; name: string; phone: string; address: string; notes: string; balance: number; }

export default function SuppliersPage() {
  const t = useTranslations();
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });

  useEffect(() => { load(); }, []);
  const load = async () => { const r = await fetch('/api/data?entity=suppliers'); const d = await r.json(); setItems(d.suppliers || []); setLoading(false); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (edit) await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'suppliers', id: edit.id, data: form }) });
    else await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'suppliers', data: form }) });
    load(); reset(); setSaving(false);
  };

  const del = async (id: number) => { if (!confirm('Delete?')) return; await fetch(`/api/data?entity=suppliers&id=${id}`, { method: 'DELETE' }); load(); };
  const openEdit = (s: Supplier) => { setEdit(s); setForm({ name: s.name, phone: s.phone || '', address: s.address || '', notes: s.notes || '' }); setShowForm(true); };
  const reset = () => { setShowForm(false); setEdit(null); setForm({ name: '', phone: '', address: '', notes: '' }); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Truck size={22} style={{ color: 'var(--color-primary-400)' }} />
            {t('suppliers.title')}
          </h1>
          <p className="page-subtitle mt-1">Manage your product suppliers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary"><Plus size={16} /> {t('suppliers.addSupplier')}</button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="skeleton h-40 w-full" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <Truck size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No suppliers yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Phone</th><th>Address</th><th>Balance</th><th></th></tr></thead>
            <tbody>{items.map(s => (
              <tr key={s.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{s.phone || '—'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{s.address || '—'}</td>
                <td style={{ color: s.balance > 0 ? 'var(--color-warning-400)' : 'var(--text-secondary)', fontWeight: s.balance > 0 ? 600 : 400 }}>
                  {formatCurrency(s.balance)}
                </td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="btn btn-ghost p-2"><Edit size={14} /></button>
                    <button onClick={() => del(s.id)} className="btn btn-ghost p-2" style={{ color: 'var(--color-danger-400)' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay animate-fade-in">
          <div className="animate-scale-up w-full max-w-md mx-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{edit ? 'Edit' : 'Add'} Supplier</h2>
              <button onClick={reset} className="btn btn-ghost p-2"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required autoFocus /></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} /></div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">{saving && <Loader2 size={16} className="animate-spin" />} {edit ? 'Update' : 'Create'}</button>
                <button type="button" onClick={reset} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}