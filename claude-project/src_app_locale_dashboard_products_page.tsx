'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import {
  Package, Plus, Search, Edit, Trash2, X, ChevronDown,
  ChevronUp, Layers, Loader2
} from 'lucide-react';

interface Product {
  id: number; name_en: string; name_ar: string; category_id: number;
  category_name: string; description: string; has_variants: number;
  variant_count: number; total_stock: number; created_at: string;
}

interface Variant {
  id: number; product_id: number; barcode: string; sku: string; variant_name: string;
  wattage: string; color: string; size: string; unit_type: string;
  cost_price: number; retail_price: number; wholesale_price: number;
  stock_quantity: number; min_stock: number;
}

interface Category { id: number; name_en: string; name_ar: string; }

const LABEL = (text: string) => (
  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{text}</label>
);

export default function ProductsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editVariant, setEditVariant] = useState<Variant | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name_en: '', name_ar: '', category_id: '', description: '', has_variants: false,
    barcode: '', sku: '', unit_type: 'piece', cost_price: '', retail_price: '', wholesale_price: '',
    stock_quantity: '', min_stock: '',
  });

  const [variantForm, setVariantForm] = useState({
    barcode: '', sku: '', variant_name: '', wattage: '', color: '', size: '',
    unit_type: 'piece', cost_price: '', retail_price: '', wholesale_price: '',
    stock_quantity: '', min_stock: '',
  });

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const fetchProducts = async (searchQuery?: string) => {
    try {
      const url = searchQuery
        ? `/api/data?entity=products&search=${encodeURIComponent(searchQuery)}`
        : '/api/data?entity=products';
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
    } catch { } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { const res = await fetch('/api/data?entity=categories'); const data = await res.json(); setCategories(data.categories || []); } catch { }
  };

  const fetchVariants = async (productId: number) => {
    try { const res = await fetch(`/api/data?entity=products&id=${productId}`); const data = await res.json(); setVariants(data.variants || []); } catch { }
  };

  const handleSearch = (value: string) => { setSearch(value); fetchProducts(value); };

  const toggleExpand = (productId: number) => {
    if (expandedProduct === productId) { setExpandedProduct(null); }
    else { setExpandedProduct(productId); fetchVariants(productId); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editProduct) {
        await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'products', id: editProduct.id, data: { ...form, category_id: form.category_id || null } }) });
      } else {
        await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'products', data: { ...form, category_id: form.category_id || null } }) });
      }
      fetchProducts(search); resetForm();
    } catch { } finally { setSaving(false); }
  };

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedProduct) return;
    setSaving(true);
    try {
      const data = { ...variantForm, product_id: expandedProduct, cost_price: parseFloat(variantForm.cost_price) || 0, retail_price: parseFloat(variantForm.retail_price) || 0, wholesale_price: parseFloat(variantForm.wholesale_price) || 0, stock_quantity: parseFloat(variantForm.stock_quantity) || 0, min_stock: parseFloat(variantForm.min_stock) || 0 };
      if (editVariant) {
        await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'variants', id: editVariant.id, data }) });
      } else {
        await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'variants', data }) });
      }
      fetchVariants(expandedProduct); fetchProducts(search); resetVariantForm();
    } catch { } finally { setSaving(false); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await fetch(`/api/data?entity=products&id=${id}`, { method: 'DELETE' });
    fetchProducts(search);
  };

  const handleDeleteVariant = async (id: number) => {
    if (!confirm('Delete this variant?')) return;
    await fetch(`/api/data?entity=variants&id=${id}`, { method: 'DELETE' });
    if (expandedProduct) fetchVariants(expandedProduct);
    fetchProducts(search);
  };

  const resetForm = () => {
    setShowForm(false); setEditProduct(null);
    setForm({ name_en: '', name_ar: '', category_id: '', description: '', has_variants: false, barcode: '', sku: '', unit_type: 'piece', cost_price: '', retail_price: '', wholesale_price: '', stock_quantity: '', min_stock: '' });
  };

  const resetVariantForm = () => {
    setShowVariantForm(false); setEditVariant(null);
    setVariantForm({ barcode: '', sku: '', variant_name: '', wattage: '', color: '', size: '', unit_type: 'piece', cost_price: '', retail_price: '', wholesale_price: '', stock_quantity: '', min_stock: '' });
  };

  const openEditProduct = async (product: Product) => {
    setEditProduct(product);
    let defaultVariant = { barcode: '', sku: '', unit_type: 'piece', cost_price: '', retail_price: '', wholesale_price: '', stock_quantity: '', min_stock: '' };
    if (product.has_variants === 0) {
      try {
        const res = await fetch(`/api/data?entity=products&id=${product.id}`);
        const data = await res.json();
        if (data.variants && data.variants.length > 0) {
          const v = data.variants[0];
          defaultVariant = { barcode: v.barcode || '', sku: v.sku || '', unit_type: v.unit_type || 'piece', cost_price: String(v.cost_price || ''), retail_price: String(v.retail_price || ''), wholesale_price: String(v.wholesale_price || ''), stock_quantity: String(v.stock_quantity || ''), min_stock: String(v.min_stock || '') };
        }
      } catch (err) { console.error(err); }
    }
    setForm({ name_en: product.name_en, name_ar: product.name_ar || '', category_id: String(product.category_id || ''), description: product.description || '', has_variants: product.has_variants === 1, ...defaultVariant });
    setShowForm(true);
  };

  const openEditVariant = (variant: Variant) => {
    setEditVariant(variant);
    setVariantForm({ barcode: variant.barcode || '', sku: variant.sku || '', variant_name: variant.variant_name || '', wattage: variant.wattage || '', color: variant.color || '', size: variant.size || '', unit_type: variant.unit_type, cost_price: String(variant.cost_price), retail_price: String(variant.retail_price), wholesale_price: String(variant.wholesale_price), stock_quantity: String(variant.stock_quantity), min_stock: String(variant.min_stock) });
    setShowVariantForm(true);
  };

  const unitOptions = [
    { value: 'piece', label: t('products.piece') },
    { value: 'meter', label: t('products.meter') },
    { value: 'yard', label: t('products.yard') },
    { value: 'box', label: t('products.box') },
    { value: 'roll', label: t('products.roll') },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Package size={22} style={{ color: 'var(--color-primary-400)' }} />
            {t('products.title')}
          </h1>
          <p className="page-subtitle mt-1">{t('products.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary" id="add-product-btn">
          <Plus size={16} /> {t('products.addProduct')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
        <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder={t('products.searchPlaceholder')} className="input-field pl-9" id="product-search" />
      </div>

      {/* Products list */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <Package size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">{t('products.noProductsFound')}</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm mt-3"><Plus size={14} /> {t('products.addFirstProduct')}</button>
          </div>
        ) : (
          <div>
            {products.map((product) => (
              <div key={product.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {/* Product row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer transition-colors"
                  style={{ background: 'transparent' }}
                  onClick={() => toggleExpand(product.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="p-2 rounded-lg shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                    <Package size={17} style={{ color: 'var(--color-primary-400)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {locale === 'ar' && product.name_ar ? product.name_ar : product.name_en}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.category_name && <span className="badge badge-info text-[10px]">{product.category_name}</span>}
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {t('products.variantsCount', { count: product.variant_count, stock: product.total_stock || 0 })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openEditProduct(product); }} className="btn btn-ghost p-2"><Edit size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }} className="btn btn-ghost p-2" style={{ color: 'var(--color-danger-400)' }}><Trash2 size={14} /></button>
                    {expandedProduct === product.id
                      ? <ChevronUp size={17} style={{ color: 'var(--text-tertiary)' }} />
                      : <ChevronDown size={17} style={{ color: 'var(--text-tertiary)' }} />}
                  </div>
                </div>

                {/* Expanded variants */}
                {expandedProduct === product.id && (
                  <div className="px-4 py-4 animate-fade-in" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Layers size={14} /> {t('products.variants')}
                      </h4>
                      <button onClick={() => setShowVariantForm(true)} className="btn btn-primary btn-sm"><Plus size={12} /> {t('products.addVariant')}</button>
                    </div>

                    {variants.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>{t('products.noVariants')}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="data-table text-sm">
                          <thead>
                            <tr>
                              <th>{t('products.nameColumn')}</th>
                              <th>{t('products.barcodeColumn')}</th>
                              <th>{t('products.costColumn')}</th>
                              <th>{t('products.retailColumn')}</th>
                              <th>{t('products.wholesaleColumn')}</th>
                              <th>{t('products.stockColumn')}</th>
                              <th>{t('products.unitColumn')}</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map((v) => (
                              <tr key={v.id}>
                                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{v.variant_name || '—'}</td>
                                <td className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{v.barcode || '—'}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(v.cost_price)}</td>
                                <td style={{ color: 'var(--color-primary-400)' }}>{formatCurrency(v.retail_price)}</td>
                                <td style={{ color: 'var(--color-accent-400)' }}>{formatCurrency(v.wholesale_price)}</td>
                                <td style={{ color: v.stock_quantity <= v.min_stock ? 'var(--color-danger-400)' : 'var(--text-primary)', fontWeight: v.stock_quantity <= v.min_stock ? 700 : 400 }}>
                                  {v.stock_quantity}
                                </td>
                                <td className="capitalize" style={{ color: 'var(--text-secondary)' }}>{t(`products.${v.unit_type}`)}</td>
                                <td>
                                  <div className="flex gap-1">
                                    <button onClick={() => openEditVariant(v)} className="btn btn-ghost p-1.5"><Edit size={12} /></button>
                                    <button onClick={() => handleDeleteVariant(v.id)} className="btn btn-ghost p-1.5" style={{ color: 'var(--color-danger-400)' }}><Trash2 size={12} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Inline variant form */}
                    {showVariantForm && (
                      <form onSubmit={handleSaveVariant} className="mt-4 p-4 rounded-xl space-y-3 animate-fade-in" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                        <h5 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {editVariant ? t('products.editVariant') : t('products.addVariant')}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: t('products.nameColumn'), key: 'variant_name', placeholder: 'e.g. 10W White' },
                            { label: t('products.barcode'), key: 'barcode', placeholder: 'Scan or enter' },
                            { label: t('products.sku'), key: 'sku', placeholder: '' },
                          ].map(({ label, key, placeholder }) => (
                            <div key={key}>
                              {LABEL(label)}
                              <input value={(variantForm as any)[key]} onChange={(e) => setVariantForm({ ...variantForm, [key]: e.target.value })} className="input-field text-sm" placeholder={placeholder} />
                            </div>
                          ))}
                          <div>
                            {LABEL(t('products.unitType'))}
                            <select value={variantForm.unit_type} onChange={(e) => setVariantForm({ ...variantForm, unit_type: e.target.value })} className="input-field text-sm">
                              {unitOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                          {[
                            { label: t('products.wattage'), key: 'wattage' },
                            { label: t('products.color'), key: 'color' },
                            { label: t('products.size'), key: 'size' },
                          ].map(({ label, key }) => (
                            <div key={key}>
                              {LABEL(label)}
                              <input value={(variantForm as any)[key]} onChange={(e) => setVariantForm({ ...variantForm, [key]: e.target.value })} className="input-field text-sm" />
                            </div>
                          ))}
                          <div />
                          {[
                            { label: `${t('products.costPrice')} ($)`, key: 'cost_price', required: true },
                            { label: `${t('products.retailPrice')} ($)`, key: 'retail_price', required: true },
                            { label: `${t('products.wholesalePrice')} ($)`, key: 'wholesale_price', required: true },
                          ].map(({ label, key, required }) => (
                            <div key={key}>
                              {LABEL(label)}
                              <input type="number" step="0.01" value={(variantForm as any)[key]} onChange={(e) => setVariantForm({ ...variantForm, [key]: e.target.value })} className="input-field text-sm" required={required} />
                            </div>
                          ))}
                          <div />
                          <div>
                            {LABEL(t('products.stockQty'))}
                            <input type="number" step="0.1" value={variantForm.stock_quantity} onChange={(e) => setVariantForm({ ...variantForm, stock_quantity: e.target.value })} className="input-field text-sm" required />
                          </div>
                          <div>
                            {LABEL(t('products.minStockField'))}
                            <input type="number" step="0.1" value={variantForm.min_stock} onChange={(e) => setVariantForm({ ...variantForm, min_stock: e.target.value })} className="input-field text-sm" required />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                            {saving && <Loader2 size={13} className="animate-spin" />}
                            {editVariant ? t('products.updateVariant') : t('products.addVariant')}
                          </button>
                          <button type="button" onClick={resetVariantForm} className="btn btn-secondary btn-sm">{t('common.cancel')}</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product modal */}
      {showForm && (
        <div className="modal-overlay animate-fade-in">
          <div className="animate-scale-up w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Package size={20} style={{ color: 'var(--color-primary-400)' }} />
                {editProduct ? t('products.editProduct') : t('products.addProduct')}
              </h2>
              <button onClick={resetForm} className="btn btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>{LABEL(`${t('products.productName')} (English) *`)}<input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="input-field" required autoFocus /></div>
                <div>{LABEL(`${t('products.productName')} (Arabic)`)}<input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="input-field" dir="rtl" /></div>
              </div>

              <div>
                {LABEL(t('products.category'))}
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field">
                  <option value="">{t('products.category')}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{locale === 'ar' && c.name_ar ? c.name_ar : c.name_en}</option>)}
                </select>
              </div>

              <div>{LABEL(t('products.description'))}<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} placeholder={t('products.description')} /></div>

              <div className="flex items-center gap-3 py-1">
                <div
                  className="relative w-9 h-5 rounded-full cursor-pointer transition-colors"
                  style={{ background: form.has_variants ? 'var(--color-primary-600)' : 'var(--bg-overlay)', border: '1px solid var(--border-default)' }}
                  onClick={() => setForm({ ...form, has_variants: !form.has_variants })}
                >
                  <div className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-transform" style={{ transform: form.has_variants ? 'translateX(16px)' : 'translateX(2px)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <label className="text-sm font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }} onClick={() => setForm({ ...form, has_variants: !form.has_variants })}>
                  {t('products.hasMultipleVariants')}
                </label>
              </div>

              {!form.has_variants && (
                <div className="space-y-4 pt-2 animate-fade-in" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary-400)' }}>{t('products.pricingBarcodeStock')}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>{LABEL(t('products.barcodeField'))}<input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input-field" placeholder={t('products.scanOrEnterBarcode')} /></div>
                    <div>{LABEL(t('products.skuField'))}<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field" placeholder={t('products.stockKeepingUnit')} /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>{LABEL(t('products.costPriceField'))}<input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="input-field" required={!form.has_variants} placeholder="0.00" /></div>
                    <div>{LABEL(t('products.retailPriceField'))}<input type="number" step="0.01" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: e.target.value })} className="input-field" required={!form.has_variants} placeholder="0.00" /></div>
                    <div>{LABEL(t('products.wholesalePriceField'))}<input type="number" step="0.01" value={form.wholesale_price} onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })} className="input-field" placeholder={t('products.leaveEmptyForRetail')} /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      {LABEL(t('products.unitTypeField'))}
                      <select value={form.unit_type} onChange={(e) => setForm({ ...form, unit_type: e.target.value })} className="input-field">
                        {unitOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>{LABEL(t('products.initialStockField'))}<input type="number" step="0.1" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="input-field" required={!form.has_variants} placeholder="0" /></div>
                    <div>{LABEL(t('products.minStockAlertField'))}<input type="number" step="0.1" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="input-field" placeholder="5" /></div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1 btn-lg">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editProduct ? t('products.editProduct') : t('products.addProduct')}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary flex-1 btn-lg">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}