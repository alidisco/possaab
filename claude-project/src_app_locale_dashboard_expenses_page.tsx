'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, Plus, Trash2, X, Loader2 } from 'lucide-react';

interface Expense { id: number; title: string; amount: number; category: string; notes: string; expense_date: string; }
const CATS = ['rent', 'electricity', 'salaries', 'transportation', 'misc'];

export default function ExpensesPage() {
  const t = useTranslations();
  const user = useAuthStore(s => s.user);
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'misc', notes: '', expense_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { load(); }, []);
  const load = async () => { const r = await fetch('/api/data?entity=expenses'); const d = await r.json(); setItems(d.expenses || []); setLoading(false); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'expenses', data: { ...form, amount: parseFloat(form.amount), created_by: user?.id } })
    });
    load(); setShowForm(false); setForm({ title: '', amount: '', category: 'misc', notes: '', expense_date: new Date().toISOString().split('T')[0] }); setSaving(false);
  };

  const del = async (id: number) => { if (!confirm('Delete?')) return; await fetch(`/api/data?entity=expenses&id=${id}`, { method: 'DELETE' }); load(); };
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <DollarSign size={22} style={{ color: 'var(--color-primary-400)' }} />
            {t('expenses.title')}
          </h1>
          <p className="page-subtitle mt-1">Track and manage business expenses</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary"><Plus size={16} /> {t('expenses.addExpense')}</button>
      </div>

      <div className="glass-card p-4 stat-orange">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Expenses</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="skeleton h-40 w-full" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <DollarSign size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No expenses recorded</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th></th></tr></thead>
            <tbody>{items.map(e => (
              <tr key={e.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{e.title}</td>
                <td><span className="badge badge-info capitalize">{e.category}</span></td>
                <td className="font-semibold" style={{ color: 'var(--color-danger-400)' }}>{formatCurrency(e.amount)}</td>
                <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(e.expense_date)}</td>
                <td><button onClick={() => del(e.id)} className="btn btn-ghost p-2" style={{ color: 'var(--color-danger-400)' }}><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay animate-fade-in">
          <div className="animate-scale-up w-full max-w-md mx-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add Expense</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost p-2"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required autoFocus /></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Amount ($) *</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">{CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Date</label><input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} /></div>
              <button type="submit" disabled={saving} className="btn btn-primary w-full">{saving && <Loader2 size={16} className="animate-spin" />} Add Expense</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}