'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Barcode, Search, Printer, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import JsBarcode from 'jsbarcode';

function BarcodeItem({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try { JsBarcode(svgRef.current, value, { format: 'CODE128', width: 1.2, height: 35, displayValue: false, margin: 0 }); }
      catch (err) { console.error('Failed to generate barcode:', err); }
    }
  }, [value]);
  return <svg ref={svgRef} className="max-w-full h-8" />;
}

interface Variant { id: number; product_name: string; variant_name: string; barcode: string; sku: string; retail_price: number; }

export default function BarcodesPage() {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedItems, setSelectedItems] = useState<Array<{ variant: Variant; quantity: number }>>([]);

  const searchVariants = async (q: string) => {
    setSearch(q);
    if (!q) { setVariants([]); return; }
    try {
      const res = await fetch(`/api/data?entity=variants&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setVariants(data.variants || []);
    } catch { }
  };

  const addItem = (v: Variant) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.variant.id === v.id);
      if (existing) return prev.map((item) => item.variant.id === v.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { variant: v, quantity: 1 }];
    });
  };

  const updateQuantity = (variantId: number, qty: number) => {
    if (qty <= 0) { setSelectedItems((prev) => prev.filter((i) => i.variant.id !== variantId)); return; }
    setSelectedItems((prev) => prev.map((i) => (i.variant.id === variantId ? { ...i, quantity: qty } : i)));
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:m-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Barcode size={22} style={{ color: 'var(--color-primary-400)' }} />
            Barcode Generator & Label Printer
          </h1>
          <p className="page-subtitle mt-1">Generate and print custom barcodes for variants</p>
        </div>
        {selectedItems.length > 0 && (
          <button onClick={() => window.print()} className="btn btn-primary"><Printer size={16} /> Print Labels</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Search & Select */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input type="text" value={search} onChange={(e) => searchVariants(e.target.value)} placeholder="Search variants to add…" className="input-field pl-9" />
          </div>

          <div className="glass-card overflow-hidden">
            {variants.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                <Search size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Search and add variants to print barcodes</p>
              </div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Product</th><th>Barcode</th><th>Price</th><th>Action</th></tr></thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.product_name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{v.variant_name}</p>
                      </td>
                      <td className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{v.barcode || 'N/A'}</td>
                      <td style={{ color: 'var(--text-primary)' }}>{formatCurrency(v.retail_price)}</td>
                      <td>
                        <button onClick={() => addItem(v)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary-400)' }}>
                          <Plus size={14} /> Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Label Queue */}
        <div>
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Label Queue</h3>
            {selectedItems.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>No items added to print queue</p>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.variant.id} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.variant.product_name}</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.variant.barcode}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ms-2">
                      <button onClick={() => updateQuantity(item.variant.id, item.quantity - 1)} className="btn btn-ghost p-1 rounded-md"><Minus size={12} /></button>
                      <span className="text-sm font-semibold w-6 text-center" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variant.id, item.quantity + 1)} className="btn btn-ghost p-1 rounded-md"><Plus size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print template */}
      <div className="hidden print:grid print:grid-cols-4 print:gap-4 print:p-4">
        {selectedItems.map((item) =>
          Array.from({ length: item.quantity }).map((_, idx) => (
            <div key={`${item.variant.id}-${idx}`} className="border border-black p-3 text-center flex flex-col items-center justify-between h-28 bg-white text-black font-sans">
              <p className="text-[10px] font-bold truncate w-full">{item.variant.product_name}</p>
              <p className="text-[8px] text-gray-500">{item.variant.variant_name}</p>
              <div className="w-full flex flex-col items-center justify-center my-1">
                <BarcodeItem value={item.variant.barcode} />
                <p className="text-[8px] tracking-[4px] font-mono mt-1">{item.variant.barcode}</p>
              </div>
              <p className="text-[9px] font-bold">{formatCurrency(item.variant.retail_price)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}