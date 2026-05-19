'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Layers, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';

interface Category { id: number; name_en: string; name_ar: string; parent_id: number | null; }

export default function CategoriesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name_en: '', name_ar: '', parent_id: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const r = await fetch('/api/data?entity=categories'); const d = await r.json(); setItems(d.categories || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const data = { ...form, parent_id: form.parent_id ? parseInt(form.parent_id) : null };
    try {
      if (edit) await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'categories', id: edit.id, data }) });
      else await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'categories', data }) });
      load(); reset();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try { await fetch(`/api/data?entity=categories&id=${id}`, { method: 'DELETE' }); load(); } catch (e) { console.error(e); }
  };

  const openEdit = (c: Category) => {
    setEdit(c); setForm({ name_en: c.name_en, name_ar: c.name_ar || '', parent_id: c.parent_id ? String(c.parent_id) : '' }); setShowForm(true);
  };

  const reset = () => { setShowForm(false); setEdit(null); setForm({ name_en: '', name_ar: '', parent_id: '' }); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Layers size={22} style={{ color: 'var(--color-primary-400)' }} />
            {t('nav.categories')}
          </h1>
          <p className="page-subtitle mt-1">Organize products into categories</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary"><Plus size={16} /> Add Category</button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="skeleton h-40 w-full" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <Layers size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No categories found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>English Name</th><th>Arabic Name</th><th>{t('common.actions')}</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.name_en}</td>
                  <td dir="rtl" style={{ color: 'var(--text-secondary)' }}>{c.name_ar || '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="btn btn-ghost p-2"><Edit size={14} /></button>
                      <button onClick={() => del(c.id)} className="btn btn-ghost p-2" style={{ color: 'var(--color-danger-400)' }}><Trash2 size={14} /></button>
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
          <div className="animate-scale-up w-full max-w-md mx-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{edit ? 'Edit' : 'Add'} Category</h2>
              <button onClick={reset} className="btn btn-ghost p-2"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>English Name *</label>
                <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="input-field" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Arabic Name</label>
                <input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="input-field" dir="rtl" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving && <Loader2 size={16} className="animate-spin" />} {edit ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={reset} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}