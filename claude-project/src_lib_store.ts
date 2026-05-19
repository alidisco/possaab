import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
interface AuthState {
  user: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'cashier';
  } | null;
  isAuthenticated: boolean;
  login: (user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'saab-auth',
    }
  )
);

// Cart Store
export interface CartItem {
  variantId: number;
  productName: string;
  variantName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  unitType: string;
  maxStock: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  customerId: number | null;
  customerType: 'retail' | 'wholesale';
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  paidAmount: number;
  currency: 'USD' | 'LBP';
  notes: string;
  addItem: (item: Omit<CartItem, 'subtotal'>) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  setCustomer: (id: number | null, type: 'retail' | 'wholesale') => void;
  setDiscount: (type: 'fixed' | 'percentage', value: number) => void;
  setPaymentStatus: (status: 'paid' | 'partial' | 'unpaid') => void;
  setPaymentMethod: (method: 'cash' | 'card' | 'transfer' | 'other') => void;
  setPaidAmount: (amount: number) => void;
  setCurrency: (currency: 'USD' | 'LBP') => void;
  setNotes: (notes: string) => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getRemaining: () => number;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  customerId: null,
  customerType: 'retail',
  discountType: 'fixed',
  discountValue: 0,
  paymentStatus: 'paid',
  paymentMethod: 'cash',
  paidAmount: 0,
  currency: 'USD',
  notes: '',

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.unitPrice }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { ...item, subtotal: item.quantity * item.unitPrice }],
      };
    }),

  removeItem: (variantId) =>
    set((state) => ({
      items: state.items.filter((i) => i.variantId !== variantId),
    })),

  updateQuantity: (variantId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.variantId === variantId
          ? { ...i, quantity, subtotal: quantity * i.unitPrice }
          : i
      ),
    })),

  setCustomer: (id, type) => set({ customerId: id, customerType: type }),
  setDiscount: (type, value) => set({ discountType: type, discountValue: value }),
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setPaidAmount: (amount) => set({ paidAmount: amount }),
  setCurrency: (currency) => set({ currency }),
  setNotes: (notes) => set({ notes }),

  getSubtotal: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),
  getDiscountAmount: () => {
    const { discountType, discountValue } = get();
    const subtotal = get().getSubtotal();
    if (discountType === 'percentage') {
      return subtotal * (discountValue / 100);
    }
    return discountValue;
  },
  getTotal: () => get().getSubtotal() - get().getDiscountAmount(),
  getRemaining: () => Math.max(0, get().getTotal() - get().paidAmount),

  clearCart: () =>
    set({
      items: [],
      customerId: null,
      customerType: 'retail',
      discountType: 'fixed',
      discountValue: 0,
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      paidAmount: 0,
      notes: '',
    }),
}));

// Settings Store
interface SettingsState {
  exchangeRate: number;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  receiptFooter: string;
  backupDirectory: string;
  lanMode: 'server' | 'client';
  lanPort: string;
  serverIp: string;
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      exchangeRate: 89500,
      storeName: 'Saab Electric',
      storePhone: '',
      storeAddress: '',
      receiptFooter: 'Thank you for shopping at Saab Electric!',
      backupDirectory: 'D:/SaabElectricBackups',
      lanMode: 'server',
      lanPort: '3456',
      serverIp: '',
      setSettings: (settings) => set(settings),
    }),
    {
      name: 'saab-settings',
    }
  )
);

// UI Store
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('light', newTheme === 'light');
          }
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('light', theme === 'light');
        }
        set({ theme });
      },
    }),
    {
      name: 'saab-ui',
    }
  )
);