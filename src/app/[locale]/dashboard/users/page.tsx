'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { UserCog, Plus, X, Loader2 } from 'lucide-react';

interface User { id: number; name: string; email: string; role: 'admin' | 'cashier'; is_active: number; created_at: string; }

export default function UsersPage() {
  const t = useTranslations();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await fetch('/api/data?entity=users'); const data = await res.json(); setUsers(data.users || []); }
    catch { } finally { setLoading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'users', data: form }) }); load(); resetForm(); }
    catch { } finally { setSaving(false); }
  };

  const resetForm = () => { setShowForm(false); setForm({ name: '', email: '', password: '', role: 'cashier' }); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserCog size={22} style={{ color: 'var(--color-primary-400)' }} />
            {t('nav.users')}
          </h1>
          <p className="page-subtitle mt-1">Manage cashiers and system administrators</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary"><Plus size={16} /> Create User</button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="skeleton h-40 w-full" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.email')}</th>
                <th>{t('common.role')}</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{
                        background: u.role === 'admin'
                          ? 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))'
                          : 'linear-gradient(135deg, var(--color-success-600), var(--color-primary-700))'
                      }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-info' : 'badge-success'}`}>{u.role}</span></td>
                  <td>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-success-400)' }}>
                      <span className="status-dot online" /> Active
                    </span>
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
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create New User</h2>
              <button onClick={resetForm} className="btn btn-ghost p-2"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Full Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Email Address *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Secure Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required /></div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>System Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                  <option value="cashier">Cashier</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">{saving && <Loader2 size={16} className="animate-spin" />} Create User</button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}