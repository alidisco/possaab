'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, Search, Plus, X, AlertCircle } from 'lucide-react';

export default function ReturnsPage() {
  const t = useTranslations();
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [searchInvoice, setSearchInvoice] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RotateCcw size={22} style={{ color: 'var(--color-primary-400)' }} />
            {t('nav.returns')}
          </h1>
          <p className="page-subtitle mt-1">Process invoice returns and refunds</p>
        </div>
        <button onClick={() => setShowNewReturn(true)} className="btn btn-primary">
          <Plus size={16} /> New Return
        </button>
      </div>

      <div className="glass-card p-10 text-center" style={{ color: 'var(--text-tertiary)' }}>
        <RotateCcw size={44} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">Invoice returns and refund history. Scan or enter an invoice number to start a return.</p>
        <button onClick={() => setShowNewReturn(true)} className="btn btn-primary btn-sm mt-4">
          Start a Return
        </button>
      </div>

      {showNewReturn && (
        <div className="modal-overlay animate-fade-in">
          <div className="animate-scale-up w-full max-w-lg mx-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Process Return</h2>
              <button onClick={() => { setShowNewReturn(false); setSearchInvoice(''); }} className="btn btn-ghost p-2"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Enter Invoice Number (e.g. INV-2026-xxxxx)"
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="input-field pl-9"
                />
              </div>

              <div
                className="p-6 rounded-xl flex flex-col items-center justify-center min-h-32 text-center"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
              >
                <AlertCircle size={22} className="mb-2" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Search for an active invoice by number to populate items eligible for return.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setShowNewReturn(false); setSearchInvoice(''); }} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}