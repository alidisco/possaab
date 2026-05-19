'use client';
//C:\Users\alidi\OneDrive\Desktop\saabPOS\src\app\[locale]\dashboard\pos\page.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore, useCartStore } from '@/lib/store';
import { formatCurrency, generateInvoiceNumber } from '@/lib/utils';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, User, X,
  CreditCard, Banknote, ArrowRightLeft, Printer, Check,
  Package, Zap, AlertCircle, Loader2
} from 'lucide-react';

interface SearchResult {
  id: number;
  product_name: string;
  product_name_ar: string;
  variant_name: string;
  barcode: string;
  sku: string;
  retail_price: number;
  wholesale_price: number;
  stock_quantity: number;
  unit_type: string;
}

interface Customer {
  id: number;
  name: string;
  company_name: string;
  type: 'retail' | 'wholesale';
  balance: number;
  credit_limit: number | null;
  phone: string;
}

export default function POSPage() {
  const t = useTranslations();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState<number | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>(null);

  // Focus barcode input on mount and after actions
  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); barcodeRef.current?.focus(); }
      if (e.key === 'F5') { e.preventDefault(); if (cart.items.length > 0) setShowPayment(true); }
      if (e.key === 'Escape') { setShowPayment(false); setShowSearch(false); setShowCustomerSelect(false); setSaleComplete(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.items.length]);

  // Search products/variants
  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    // First try exact barcode match
    try {
      const barcodeRes = await fetch(`/api/data?entity=variants&barcode=${encodeURIComponent(query)}`);
      const barcodeData = await barcodeRes.json();
      if (barcodeData.variant) {
        addToCart(barcodeData.variant);
        setBarcodeInput('');
        setShowSearch(false);
        return;
      }
    } catch { }

    // Fall back to search
    try {
      const res = await fetch(`/api/data?entity=variants&search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.variants || []);
      setShowSearch(true);
    } catch { }
  }, []);

  const handleBarcodeChange = (value: string) => {
    setBarcodeInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(value), 300);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleSearch(barcodeInput.trim());
    }
  };

  const addToCart = (variant: SearchResult) => {
    const price = cart.customerType === 'wholesale' ? variant.wholesale_price : variant.retail_price;
    cart.addItem({
      variantId: variant.id,
      productName: locale === 'ar' && variant.product_name_ar ? variant.product_name_ar : variant.product_name,
      variantName: variant.variant_name || '',
      barcode: variant.barcode,
      quantity: 1,
      unitPrice: price,
      unitType: variant.unit_type,
      maxStock: variant.stock_quantity,
    });
    setBarcodeInput('');
    setShowSearch(false);
    barcodeRef.current?.focus();
  };

  // Customer search
  const searchCustomers = async (query: string) => {
    setCustomerSearch(query);
    try {
      const res = await fetch(`/api/data?entity=customers&search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch { }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    cart.setCustomer(customer.id, customer.type);
    setShowCustomerSelect(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    cart.setCustomer(null, 'retail');
  };

  // Process sale
  const processSale = async () => {
    if (cart.items.length === 0 || !user) return;
    setProcessing(true);

    try {
      const invoiceNumber = generateInvoiceNumber();
      const subtotal = cart.getSubtotal();
      const discountAmount = cart.getDiscountAmount();
      const total = cart.getTotal();
      const paidAmount = cart.paymentStatus === 'paid' ? total : cart.paidAmount;
      const remaining = Math.max(0, total - paidAmount);

      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'invoices',
          data: {
            invoice_number: invoiceNumber,
            customer_id: cart.customerId,
            cashier_id: user.id,
            payment_status: cart.paymentStatus,
            currency: cart.currency,
            exchange_rate: 1,
            subtotal,
            discount_amount: discountAmount,
            discount_type: cart.discountType,
            total_amount: total,
            paid_amount: paidAmount,
            remaining_amount: remaining,
            payment_method: cart.paymentMethod,
            notes: cart.notes,
            items: cart.items.map((item) => ({
              variant_id: item.variantId,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              discount_amount: 0,
              subtotal: item.subtotal,
            })),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLastInvoiceId(data.id as number);
        setSaleComplete(true);
        setShowPayment(false);
      }
    } catch (error) {
      console.error('Sale failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const startNewSale = () => {
    cart.clearCart();
    setSelectedCustomer(null);
    setSaleComplete(false);
    setLastInvoiceId(null);
    barcodeRef.current?.focus();
  };

  const subtotal = cart.getSubtotal();
  const discountAmount = cart.getDiscountAmount();
  const total = cart.getTotal();

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)] -m-6 p-4">
      {/* Left panel - Product search & list */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barcode scanner input */}
        <form onSubmit={handleBarcodeSubmit} className="relative mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              ref={barcodeRef}
              id="barcode-input"
              type="text"
              value={barcodeInput}
              onChange={(e) => handleBarcodeChange(e.target.value)}
              placeholder={t('pos.scanBarcode')}
              className="input-field pl-11 pr-20 py-3.5 text-base"
              style={{ fontSize: '16px' }}
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <kbd className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold" style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-tertiary)',
              }}>F1</kbd>
            </div>
          </div>

          {/* Search dropdown */}
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-card shadow-2xl max-h-72 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addToCart(item)}
                  className="w-full flex items-center gap-3 p-3 hover-bg-item transition-colors text-left"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div className="p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                    <Package size={16} style={{ color: 'var(--color-primary-400)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.product_name} {item.variant_name && `- ${item.variant_name}`}
                    </p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{item.barcode || item.sku || 'No barcode'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--color-primary-400)' }}>
                      {formatCurrency(cart.customerType === 'wholesale' ? item.wholesale_price : item.retail_price)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Stock: {item.stock_quantity}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Cart items */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} style={{ color: 'var(--color-primary-400)' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('pos.cart')}</h2>
              <span className="badge badge-info">{cart.items.length}</span>
            </div>
            {cart.items.length > 0 && (
              <button onClick={() => cart.clearCart()} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger-400)' }}>
                <Trash2 size={14} />
                {t('pos.clearCart')}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-tertiary)' }}>
                <ShoppingCart size={48} className="opacity-20 mb-3" />
                <p className="text-sm">{t('pos.emptyCart')}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-disabled)' }}>{t('pos.addItems')}</p>
              </div>
            ) : (
              <div>
                {cart.items.map((item, index) => (
                  <div key={item.variantId} className="pos-item p-3 flex items-center gap-3" style={{ animationDelay: `${index * 50}ms`, borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{item.variantName}</p>
                      )}
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-primary-400)' }}>
                        {formatCurrency(item.unitPrice)} × {item.quantity} = {formatCurrency(item.subtotal)}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) cart.removeItem(item.variantId);
                          else cart.updateQuantity(item.variantId, item.quantity - 1);
                        }}
                        className="btn btn-ghost p-1.5 rounded-lg"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (val > 0) cart.updateQuantity(item.variantId, val);
                        }}
                        className="w-14 text-center input-field py-1 px-1 text-sm"
                        step={item.unitType === 'piece' ? '1' : '0.1'}
                        min="0.1"
                      />
                      <button
                        onClick={() => cart.updateQuantity(item.variantId, item.quantity + 1)}
                        className="btn btn-ghost p-1.5 rounded-lg"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal & remove */}
                    <div className="text-right shrink-0 w-20">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>

                    <button
                      onClick={() => cart.removeItem(item.variantId)}
                      className="btn btn-ghost p-1.5"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel - Customer & payment */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        {/* Customer selection */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <User size={16} />
              {t('pos.customer')}
            </h3>
          </div>

          {selectedCustomer ? (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{
                background: selectedCustomer.type === 'wholesale'
                  ? 'linear-gradient(135deg, var(--color-accent-600), var(--color-primary-600))'
                  : 'linear-gradient(135deg, var(--color-success-600), var(--color-primary-600))'
              }}>
                {(selectedCustomer.company_name || selectedCustomer.name || 'C').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {selectedCustomer.company_name || selectedCustomer.name}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{selectedCustomer.type}</p>
              </div>
              <button onClick={clearCustomer} className="btn btn-ghost p-1">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setShowCustomerSelect(true); searchCustomers(''); }}
              className="btn btn-secondary w-full"
              id="select-customer-btn"
            >
              <User size={14} />
              {t('pos.selectCustomer')}
            </button>
          )}

          {/* Inline customer selector */}
          {showCustomerSelect && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => searchCustomers(e.target.value)}
                placeholder="Search customers..."
                className="input-field text-sm"
                autoFocus
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover-bg-item text-left text-sm"
                  >
                    <span className={`badge ${c.type === 'wholesale' ? 'badge-info' : 'badge-success'}`}>
                      {c.type === 'wholesale' ? 'W' : 'R'}
                    </span>
                    <span className="truncate" style={{ color: 'var(--text-primary)' }}>{c.company_name || c.name}</span>
                    {c.balance > 0 && (
                      <span className="text-xs ms-auto" style={{ color: 'var(--color-warning-400)' }}>{formatCurrency(c.balance)}</span>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowCustomerSelect(false)} className="btn btn-ghost btn-sm w-full">
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>

        {/* Payment summary */}
        <div className="glass-card p-4 flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>{t('pos.subtotal')}</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(subtotal)}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-2">
              <span className="text-sm shrink-0" style={{ color: 'var(--text-secondary)' }}>{t('pos.discount')}</span>
              <div className="flex-1 flex gap-1">
                <select
                  value={cart.discountType}
                  onChange={(e) => cart.setDiscount(e.target.value as 'fixed' | 'percentage', cart.discountValue)}
                  className="input-field text-xs py-1 w-16"
                >
                  <option value="fixed">$</option>
                  <option value="percentage">%</option>
                </select>
                <input
                  type="number"
                  value={cart.discountValue || ''}
                  onChange={(e) => cart.setDiscount(cart.discountType, parseFloat(e.target.value) || 0)}
                  className="input-field text-sm py-1 flex-1"
                  placeholder="0"
                  min="0"
                />
              </div>
              {discountAmount > 0 && (
                <span className="text-sm" style={{ color: 'var(--color-danger-400)' }}>-{formatCurrency(discountAmount)}</span>
              )}
            </div>

            {/* Separator */}
            <div className="pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
              <div className="flex justify-between items-center">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('pos.total')}</span>
                <span className="text-2xl font-bold gradient-text">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment status */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Payment Status
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['paid', 'partial', 'unpaid'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      cart.setPaymentStatus(status);
                      if (status === 'paid') cart.setPaidAmount(total);
                    }}
                    className={`btn btn-sm text-xs ${cart.paymentStatus === status
                      ? status === 'paid' ? 'btn-success' : status === 'partial' ? 'btn-warning' : 'btn-danger'
                      : 'btn-secondary'
                      }`}
                  >
                    {t(`pos.${status}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid amount for partial */}
            {cart.paymentStatus === 'partial' && (
              <div className="space-y-1">
                <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Paid Amount</label>
                <input
                  type="number"
                  value={cart.paidAmount || ''}
                  onChange={(e) => cart.setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="input-field text-sm"
                  placeholder="0.00"
                  min="0"
                  max={total}
                />
                <p className="text-xs" style={{ color: 'var(--color-warning-400)' }}>
                  Remaining: {formatCurrency(Math.max(0, total - cart.paidAmount))}
                </p>
              </div>
            )}

            {/* Payment method */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('pos.paymentMethod')}
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => cart.setPaymentMethod('cash')}
                  className={`btn btn-sm text-xs ${cart.paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Banknote size={12} />
                  {t('pos.cash')}
                </button>
                <button
                  onClick={() => cart.setPaymentMethod('card')}
                  className={`btn btn-sm text-xs ${cart.paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <CreditCard size={12} />
                  {t('pos.card')}
                </button>
                <button
                  onClick={() => cart.setPaymentMethod('transfer')}
                  className={`btn btn-sm text-xs ${cart.paymentMethod === 'transfer' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <ArrowRightLeft size={12} />
                  {t('pos.transfer')}
                </button>
              </div>
            </div>
          </div>

          {/* Complete sale button */}
          <div className="mt-4 space-y-2">
            {/* Credit limit warning */}
            {selectedCustomer && selectedCustomer.credit_limit && cart.paymentStatus !== 'paid' && (
              (selectedCustomer.balance + (total - cart.paidAmount)) > selectedCustomer.credit_limit && (
                <div className="p-2 rounded-lg flex items-center gap-2 text-xs" style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#f87171'
                }}>
                  <AlertCircle size={14} />
                  Credit limit exceeded! Max: {formatCurrency(selectedCustomer.credit_limit)}
                </div>
              )
            )}

            <button
              onClick={processSale}
              disabled={cart.items.length === 0 || processing}
              className="btn btn-success w-full btn-lg"
              id="complete-sale-btn"
            >
              {processing ? (
                <><Loader2 size={18} className="animate-spin" /> Processing...</>
              ) : (
                <>
                  <Check size={18} />
                  {t('pos.completeSale')}
                  <kbd className="text-[10px] opacity-60 bg-white/10 px-1.5 py-0.5 rounded ml-1">F5</kbd>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sale complete overlay */}
      {saleComplete && (
        <div className="modal-overlay animate-fade-in">
          <div className="p-8 rounded-xl max-w-md w-full mx-4 text-center shadow-2xl relative animate-scale-up space-y-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, var(--color-success-500), var(--color-success-600))',
              boxShadow: '0 0 32px rgba(16, 185, 129, 0.25)'
            }}>
              <Check size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Sale Complete!</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Invoice has been created successfully
              </p>
            </div>

            <div className="p-4 rounded-lg text-left space-y-2" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Total</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Items</span>
                <span style={{ color: 'var(--text-primary)' }}>{cart.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span className={`badge ${cart.paymentStatus === 'paid' ? 'badge-success' : cart.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                  {cart.paymentStatus}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button className="btn btn-secondary flex-1 btn-lg" onClick={startNewSale}>
                <Zap size={16} />
                New Sale
              </button>
              <button className="btn btn-primary flex-1 btn-lg" onClick={startNewSale}>
                <Printer size={16} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
