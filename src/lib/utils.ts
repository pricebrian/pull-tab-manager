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

/**
 * Generate and download a QuickBooks-compatible Products & Services CSV
 * for all unique games in a job. Groups deals by game_name + sku.
 */
export function downloadQBCsv(job: {
  job_number: string
  deals?: {
    game_name: string
    sku: string | null
    ticket_mode: '5w' | '3w'
    game_type: 'instant' | 'seal'
    tickets_per_deal: number
    price: number
    payout: number
  }[]
}) {
  const deals = job.deals || []
  if (!deals.length) return

  // Group deals by unique game (game_name + sku)
  const gameMap = new Map<
    string,
    {
      game_name: string
      sku: string | null
      ticket_mode: '5w' | '3w'
      game_type: 'instant' | 'seal'
      tickets_per_deal: number
      price: number
      payout: number
      deal_count: number
    }
  >()

  for (const d of deals) {
    const key = `${d.game_name}||${d.sku || ''}`
    if (!gameMap.has(key)) {
      gameMap.set(key, { ...d, deal_count: 1 })
    } else {
      gameMap.get(key)!.deal_count++
    }
  }

  // QB CSV headers
  const headers = [
    'Product/service name',
    'Item type',
    'SKU',
    'Category',
    'Sale description',
    'Sales price/rate',
    'Income account',
  ]

  const rows: string[][] = []
  for (const g of gameMap.values()) {
    const windowLabel = g.ticket_mode === '5w' ? '5W' : '3W'
    const typeLabel = g.game_type === 'seal' ? 'Seal' : 'Instant'
    const category = `${windowLabel} ${typeLabel} Ticket`
    const windowDesc = g.ticket_mode === '5w' ? '5 window' : '3 window'
    const description = `${windowDesc} - ${g.tickets_per_deal} count - ${g.deal_count} deal per case`
    const pricePerDeal = g.tickets_per_deal * g.price

    rows.push([
      g.game_name,
      'Non-Inventory',
      g.sku || '',
      category,
      description,
      pricePerDeal.toFixed(2),
      'Sales',
    ])
  }

  // Build CSV string
  const csvEscape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\n')

  // Trigger browser download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${job.job_number}-quickbooks.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
