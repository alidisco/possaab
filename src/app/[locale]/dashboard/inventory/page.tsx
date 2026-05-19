'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import { Warehouse, Search, AlertTriangle, Edit, X, Check } from 'lucide-react';

interface Item {
  id: number; product_name: string; variant_name: string;
  barcode: string; stock_quantity: number; min_stock: number;
  unit_type: string; cost_price: number;
}

export default function InventoryPage() {
  const t = useTranslations();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLow, setShowLow] = useState(false);
  const [adjustId, setAdjustId] = useState<number | null>(null);
  const [newQty, setNewQty] = useState('');

  useEffect(() => { load(); }, []);

  const load = async (q?: string) => {
    const url = q ? `/api/data?entity=variants&search=${encodeURIComponent(q)}` : '/api/data?entity=variants';
    const r = await fetch(url); const d = await r.json();
    setItems(d.variants || []); setLoading(false);
  };

  const adjust = async (id: number) => {
    if (!newQty) return;
    await fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'inventory_adjustment', data: { variant_id: id, new_quantity: parseFloat(newQty) } })
    });
    load(search); setAdjustId(null);
  };

  const list = showLow ? items.filter(i => i.stock_quantity <= i.min_stock) : items;
  const lowCount = items.filter(i => i.stock_quantity <= i.min_stock).length;
  const totalVal = items.reduce((s, i) => s + i.stock_quantity * i.cost_price, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Warehouse size={22} style={{ color: 'var(--color-primary-400)' }} />
          {t('nav.inventory')}
        </h1>
        <p className="page-subtitle mt-1">Track and adjust stock levels</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 stat-blue animate-slide-up opacity-0 animate-stagger-1">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total SKUs</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{items.length}</p>
        </div>
        <div className="glass-card p-4 stat-green animate-slide-up opacity-0 animate-stagger-2">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Stock Value</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalVal)}</p>
        </div>
        <div className={`glass-card p-4 animate-slide-up opacity-0 animate-stagger-3 ${lowCount > 0 ? 'stat-red' : 'stat-green'}`}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Low Stock</p>
          <p className="text-2xl font-bold mt-1" style={{ color: lowCount > 0 ? 'var(--color-danger-400)' : 'var(--text-primary)' }}>{lowCount}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); load(e.target.value); }} placeholder="Search products…" className="input-field pl-9" />
        </div>
        <button onClick={() => setShowLow(!showLow)} className={`btn btn-sm ${showLow ? 'btn-danger' : 'btn-secondary'}`}>
          <AlertTriangle size={14} /> Low Stock ({lowCount})
        </button>
      </div>

      <div className="glass-card overflow-hidden animate-slide-up opacity-0 animate-stagger-4">
        {loading ? (
          <div className="p-8"><div className="skeleton h-40 w-full" /></div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <Warehouse size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No items found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th><th>Variant</th><th>Barcode</th>
                <th>Stock</th><th>Min</th><th>Unit</th><th>Value</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(i => (
                <tr key={i.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{i.product_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{i.variant_name || '—'}</td>
                  <td className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{i.barcode || '—'}</td>
                  <td>
                    <span style={{
                      color: i.stock_quantity <= i.min_stock ? 'var(--color-danger-400)' : 'var(--color-success-400)',
                      fontWeight: i.stock_quantity <= i.min_stock ? 700 : 400,
                    }}>
                      {i.stock_quantity}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-tertiary)' }}>{i.min_stock}</td>
                  <td className="capitalize" style={{ color: 'var(--text-secondary)' }}>{i.unit_type}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{formatCurrency(i.stock_quantity * i.cost_price)}</td>
                  <td>
                    {adjustId === i.id ? (
                      <div className="flex gap-1 items-center">
                        <input
                          type="number" value={newQty} onChange={e => setNewQty(e.target.value)}
                          className="input-field text-xs py-1.5" style={{ width: 72 }} autoFocus
                        />
                        <button onClick={() => adjust(i.id)} className="btn btn-ghost p-1.5" style={{ color: 'var(--color-success-400)' }}>
                          <Check size={14} />
                        </button>
                        <button onClick={() => setAdjustId(null)} className="btn btn-ghost p-1.5">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setAdjustId(i.id); setNewQty(String(i.stock_quantity)); }} className="btn btn-ghost p-2">
                        <Edit size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}