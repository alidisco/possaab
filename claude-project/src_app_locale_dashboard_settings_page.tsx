'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, Save, Loader2, DollarSign, Globe, ShieldAlert } from 'lucide-react';
import { useSettingsStore } from '@/lib/store';

export default function SettingsPage() {
  const t = useTranslations();
  const settingsStore = useSettingsStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    exchange_rate: '89500', store_name: 'Saab Electric', store_phone: '', store_address: '',
    receipt_footer: 'Thank you for shopping at Saab Electric!', lan_mode: 'server', lan_port: '3456', server_ip: '',
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/data?entity=settings');
      const data = await res.json();
      if (data.settings) {
        setForm({
          exchange_rate: data.settings.exchange_rate || '89500', store_name: data.settings.store_name || 'Saab Electric',
          store_phone: data.settings.store_phone || '', store_address: data.settings.store_address || '',
          receipt_footer: data.settings.receipt_footer || 'Thank you for shopping at Saab Electric!',
          lan_mode: data.settings.lan_mode || 'server', lan_port: data.settings.lan_port || '3456', server_ip: data.settings.server_ip || '',
        });
        settingsStore.setSettings({ exchangeRate: parseFloat(data.settings.exchange_rate) || 89500, storeName: data.settings.store_name || 'Saab Electric', storePhone: data.settings.store_phone || '', storeAddress: data.settings.store_address || '', receiptFooter: data.settings.receipt_footer || '', lanMode: data.settings.lan_mode || 'server', lanPort: data.settings.lan_port || '3456', serverIp: data.settings.server_ip || '' });
      }
    } catch { } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setSuccess(false);
    try {
      await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'settings', data: form }) });
      settingsStore.setSettings({ exchangeRate: parseFloat(form.exchange_rate) || 89500, storeName: form.store_name, storePhone: form.store_phone, storeAddress: form.store_address, receiptFooter: form.receipt_footer, lanMode: form.lan_mode as 'server' | 'client', lanPort: form.lan_port, serverIp: form.server_ip });
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-6"><div className="skeleton h-12 w-1/4" /><div className="skeleton h-64 w-full" /></div>
  );

  const fieldLabel = (label: string) => (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Settings size={22} style={{ color: 'var(--color-primary-400)' }} />
          {t('settings.title')}
        </h1>
        <p className="page-subtitle mt-1">Configure store details, currency, and LAN sync</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {success && (
          <div className="p-3 rounded-lg text-sm animate-fade-in" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--color-success-400)' }}>
            Settings updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: 15 }}>
              <Globe size={17} style={{ color: 'var(--color-primary-400)' }} /> General Configuration
            </h3>
            <div className="space-y-3">
              <div>{fieldLabel('Store Name')}<input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>{fieldLabel('Store Phone')}<input value={form.store_phone} onChange={(e) => setForm({ ...form, store_phone: e.target.value })} className="input-field" /></div>
                <div>
                  {fieldLabel('LBP Exchange Rate *')}
                  <div className="relative">
                    <input type="number" value={form.exchange_rate} onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })} className="input-field pl-8" required />
                    <DollarSign size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              </div>
              <div>{fieldLabel('Store Address')}<input value={form.store_address} onChange={(e) => setForm({ ...form, store_address: e.target.value })} className="input-field" /></div>
              <div>{fieldLabel('Receipt Footer')}<input value={form.receipt_footer} onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })} className="input-field" /></div>
            </div>
          </div>

          {/* LAN */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: 15 }}>
              <ShieldAlert size={17} style={{ color: 'var(--color-warning-400)' }} /> LAN Sync Settings
            </h3>
            <div className="space-y-4">
              <div>
                {fieldLabel('System LAN Mode')}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm({ ...form, lan_mode: 'server' })} className={`btn btn-sm ${form.lan_mode === 'server' ? 'btn-primary' : 'btn-secondary'}`}>Main (Server)</button>
                  <button type="button" onClick={() => setForm({ ...form, lan_mode: 'client' })} className={`btn btn-sm ${form.lan_mode === 'client' ? 'btn-primary' : 'btn-secondary'}`}>POS Terminal</button>
                </div>
              </div>
              {form.lan_mode === 'client' && (
                <div>{fieldLabel('Server IP Address')}<input value={form.server_ip} onChange={(e) => setForm({ ...form, server_ip: e.target.value })} placeholder="e.g. 192.168.1.5" className="input-field" required /></div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>{fieldLabel('Server Local Port')}<input value={form.lan_port} onChange={(e) => setForm({ ...form, lan_port: e.target.value })} className="input-field" required /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
          <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
            {saving ? <><Loader2 size={17} className="animate-spin" /> Saving…</> : <><Save size={17} /> Save Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
}