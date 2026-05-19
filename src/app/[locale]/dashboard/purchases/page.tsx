'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import { Receipt, Plus, Search, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function PurchasesPage() {
  const t = useTranslations();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poItems, setPoItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchVariant, setSearchVariant] = useState('');
  const [variantResults, setVariantResults] = useState<any[]>([]);

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/data?entity=suppliers');
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch { }
  };

  const searchItems = async (q: string) => {
    setSearchVariant(q);
    if (!q) { setVariantResults([]); return; }
    try {
      const res = await fetch(`/api/data?entity=variants&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setVariantResults(data.variants || []);
    } catch { }
  };

  const addPoItem = (v: any) => {
    setPoItems((prev) => {
      if (prev.find((item) => item.variant_id === v.id)) return prev;
      return [...prev, { variant_id: v.id, name: v.product_name, variant_name: v.variant_name, quantity: 1, unit_cost: v.cost_price || 0, subtotal: v.cost_price || 0 }];
    });
    setSearchVariant(''); setVariantResults([]);
  };

  const removePoItem = (variantId: number) => setPoItems((prev) => prev.filter((i) => i.variant_id !== variantId));

  const updateItemQty = (variantId: number, qty: number) =>
    setPoItems((prev) => prev.map((i) => i.variant_id === variantId ? { ...i, quantity: Math.max(1, qty), subtotal: Math.max(1, qty) * i.unit_cost } : i));

  const updateItemCost = (variantId: number, cost: number) =>
    setPoItems((prev) => prev.map((i) => i.variant_id === variantId ? { ...i, unit_cost: Math.max(0, cost), subtotal: i.quantity * Math.max(0, cost) } : i));

  const calculateTotal = () => poItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || poItems.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'purchase_orders', data: { supplier_id: parseInt(selectedSupplier), total_amount: calculateTotal(), status: 'received', notes: 'Manual Purchase Order Log', items: poItems, created_by: user?.id } })
      });
      setShowForm(false); setSelectedSupplier(''); setPoItems([]);
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Receipt size={22} style={{ color: 'var(--color-primary-400)' }} />
            {t('nav.purchases')}
          </h1>
          <p className="page-subtitle mt-1">Record purchases from suppliers and replenish inventory</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary"><Plus size={16} /> Record Purchase</button>
      </div>

      <div className="glass-card p-10 text-center animate-slide-up opacity-0 animate-stagger-1" style={{ color: 'var(--text-tertiary)' }}>
        <Receipt size={44} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">Purchase Orders allow you to add stock by linking purchases with suppliers.</p>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm mt-4">Record Supplier Invoice</button>
      </div>

      {showForm && (
        <div className="modal-overlay animate-fade-in">
          <div className="animate-scale-up w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Record Purchase from Supplier</h2>
              <button onClick={() => { setShowForm(false); setPoItems([]); }} className="btn btn-ghost p-2"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Select Supplier *</label>
                <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="input-field" required>
                  <option value="">Choose Supplier</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Search Products to Purchase</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                  <input type="text" value={searchVariant} onChange={(e) => searchItems(e.target.value)} placeholder="Search by name, SKU or scan barcode…" className="input-field pl-9" />
                </div>
                {variantResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)', maxHeight: 200, overflowY: 'auto' }}>
                    {variantResults.map((v) => (
                      <button key={v.id} type="button" onClick={() => addPoItem(v)} className="w-full flex items-center justify-between p-3 text-left text-sm transition-colors"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.product_name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{v.variant_name}</p>
                        </div>
                        <span className="font-bold" style={{ color: 'var(--color-primary-400)' }}>{formatCurrency(v.cost_price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {poItems.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                  <table className="data-table text-xs">
                    <thead><tr><th>Product</th><th>Cost Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
                    <tbody>
                      {poItems.map((item) => (
                        <tr key={item.variant_id}>
                          <td>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.variant_name}</p>
                          </td>
                          <td><input type="number" step="0.01" value={item.unit_cost} onChange={(e) => updateItemCost(item.variant_id, parseFloat(e.target.value) || 0)} className="input-field py-1 text-xs" style={{ width: 80 }} /></td>
                          <td><input type="number" value={item.quantity} onChange={(e) => updateItemQty(item.variant_id, parseFloat(e.target.value) || 0)} className="input-field py-1 text-xs" style={{ width: 64 }} /></td>
                          <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.subtotal)}</td>
                          <td><button type="button" onClick={() => removePoItem(item.variant_id)} className="btn btn-ghost p-1" style={{ color: 'var(--color-danger-400)' }}><X size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 flex justify-between items-center" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Total Purchase</span>
                    <span className="text-base font-bold" style={{ color: 'var(--color-success-400)' }}>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || poItems.length === 0} className="btn btn-primary flex-1">
                  {saving && <Loader2 size={16} className="animate-spin" />} Save and Replenish Stock
                </button>
                <button type="button" onClick={() => { setShowForm(false); setPoItems([]); }} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}