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
 * Clones .modal-print-area into a fresh overlay div on <body>,
 * hides everything else, prints, then cleans up.
 * This avoids CSS cascade issues with Tailwind utilities.
 */
export function printModalContent() {
  const source = document.querySelector('.modal-print-area')
  if (!source) return

  // Clone the content
  const clone = source.cloneNode(true) as HTMLElement

  // Strip .no-print elements from the clone
  clone.querySelectorAll('.no-print').forEach((el) => el.remove())

  // Create overlay container
  const overlay = document.createElement('div')
  overlay.id = 'print-overlay'
  overlay.appendChild(clone)
  document.body.appendChild(overlay)

  // Activate print mode
  document.body.classList.add('modal-printing')

  const cleanup = () => {
    document.body.classList.remove('modal-printing')
    overlay.remove()
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
