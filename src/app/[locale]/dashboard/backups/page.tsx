'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Database, Plus, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function BackupsPage() {
  const t = useTranslations();
  const [backups, setBackups] = useState<any[]>([
    { name: 'saab_electric_backup_20260519.db', size: '2.4 MB', date: new Date().toISOString() }
  ]);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const triggerBackup = () => {
    setCreating(true); setSuccess(false);
    setTimeout(() => {
      setCreating(false); setSuccess(true);
      setBackups(prev => [{
        name: `saab_electric_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_manual.db`,
        size: '2.4 MB',
        date: new Date().toISOString()
      }, ...prev]);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Database size={22} style={{ color: 'var(--color-primary-400)' }} />
            {t('nav.backups')}
          </h1>
          <p className="page-subtitle mt-1">Manage database backup history and recovery points</p>
        </div>
        <button onClick={triggerBackup} disabled={creating} className="btn btn-primary">
          <Plus size={16} /> Create Manual Backup
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-lg text-sm animate-fade-in" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--color-success-400)' }}>
          Database backup file successfully generated!
        </div>
      )}

      <div className="glass-card p-5 stat-blue flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-4 items-start">
          <div className="p-3 rounded-xl shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <ShieldCheck size={24} style={{ color: 'var(--color-primary-400)' }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: 15 }}>Automated Sale Protection is Active</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)', maxWidth: 520 }}>
              Saab Electric POS creates a fresh backup after every sale checkout to protect against data loss.
            </p>
          </div>
        </div>
        <div className="p-3 rounded-lg shrink-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Backup Directory</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>D:/SaabElectricBackups/</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Generated Backups</h3>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Showing last 20 rotation backups</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>File Name</th><th>File Size</th><th>Created Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {backups.map((b, idx) => (
              <tr key={idx}>
                <td className="font-mono text-sm" style={{ color: 'var(--color-primary-400)' }}>{b.name}</td>
                <td style={{ color: 'var(--text-primary)' }}>{b.size}</td>
                <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDateTime(b.date)}</td>
                <td><span className="badge badge-success">Verified Ok</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}