import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatSerial(n: number): string {
  return String(n).padStart(7, '0')
}

export function currency(n: number): string {
  return `$${(n || 0).toFixed(2)}`
}

export function pct(a: number, b: number): string {
  return b === 0 ? '0.0' : ((a / b) * 100).toFixed(1)
}

/**
 * Adds a class to body that hides everything except .modal-print-area,
 * triggers window.print(), then cleans up.
 */
export function printModalContent() {
  document.body.classList.add('modal-printing')
  const cleanup = () => {
    document.body.classList.remove('modal-printing')
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
