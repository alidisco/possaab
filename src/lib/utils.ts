import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: 'USD' | 'LBP' = 'USD'): string {
  if (currency === 'LBP') {
    return `${Math.round(amount).toLocaleString()} L.L.`;
  }
  return `$${amount.toFixed(2)}`;
}

export function convertCurrency(
  amount: number,
  from: 'USD' | 'LBP',
  to: 'USD' | 'LBP',
  exchangeRate: number
): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'LBP') return amount * exchangeRate;
  if (from === 'LBP' && to === 'USD') return amount / exchangeRate;
  return amount;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `INV-${year}-${random}`;
}

export function generateBarcode(): string {
  // Generate a 13-digit EAN-like barcode
  const prefix = '200'; // Internal use prefix
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  const code = prefix + random;
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit;
}
