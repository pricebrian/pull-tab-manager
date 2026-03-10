'use client'

import { useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatSerial, currency, printModalContent } from '@/lib/utils'
import type { Job, Deal } from '@/types/database'
import JsBarcode from 'jsbarcode'

interface LabelsModalProps {
  job: Job
  onClose: () => void
}

function Barcode({ value, height = 40 }: { value: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.5,
          height,
          displayValue: false,
          margin: 0,
        })
      } catch {
        // If barcode generation fails, leave SVG empty
      }
    }
  }, [value, height])

  return <svg ref={svgRef} />
}

function BoxLabel({ deal, date }: { deal: Deal; date: string }) {
  const serial = formatSerial(deal.serial)
  const formId = deal.sku || '—'
  const tcnt = (deal.tickets_per_deal || 0).toLocaleString()
  const price = deal.price || 0
  const totalIn = (deal.tickets_per_deal || 0) * price
  const payout = deal.payout || 0
  const profit = totalIn - payout
  const profitPct = totalIn > 0 ? ((profit / totalIn) * 100).toFixed(2) : '0.00'

  return (
    <div className="label-card bg-white text-black border-2 border-gray-800 rounded p-3 font-[family-name:var(--font-barlow-condensed)] break-inside-avoid w-[360px]">
      <div className="flex gap-3">
        {/* Left: Barcodes + game name */}
        <div className="flex flex-col items-center gap-1 min-w-[120px]">
          <Barcode value={formId} height={28} />
          <span className="text-[10px] font-semibold tracking-wider">
            {formId}
          </span>
          <span className="font-extrabold text-sm tracking-wide uppercase mt-1">
            {deal.game_name}
          </span>
          <Barcode value={serial} height={28} />
          <span className="text-[10px] font-semibold tracking-wider">
            {serial}
          </span>
        </div>

        {/* Right: Details */}
        <div className="flex flex-col justify-between flex-1 text-right">
          <div>
            <div className="font-extrabold text-xl leading-tight">
              {serial}
            </div>
            <div className="font-bold text-sm mt-0.5">FORM {formId}</div>
          </div>
          <div className="text-[11px] leading-relaxed mt-1">
            <div className="font-semibold">
              TCNT {tcnt} / {currency(price)}
            </div>
            <div>
              IN {currency(totalIn)} / PAYS {currency(payout)}
            </div>
            <div className="font-semibold">
              Profit: {currency(profit)} - {profitPct}%
            </div>
          </div>
          <div className="text-[10px] mt-1">{date}</div>
        </div>
      </div>
    </div>
  )
}

function FlareLabel({ deal, date }: { deal: Deal; date: string }) {
  const serial = formatSerial(deal.serial)
  const formId = deal.sku || '—'
  const tcnt = (deal.tickets_per_deal || 0).toLocaleString()

  return (
    <div className="label-card bg-white text-black border-2 border-gray-800 rounded p-3 font-[family-name:var(--font-barlow-condensed)] break-inside-avoid w-[360px]">
      <div className="flex gap-3">
        {/* Left: Barcodes + game name */}
        <div className="flex flex-col items-center gap-1 min-w-[120px]">
          <Barcode value={formId} height={28} />
          <span className="text-[10px] font-semibold tracking-wider">
            {formId}
          </span>
          <span className="font-extrabold text-sm tracking-wide uppercase mt-1">
            {deal.game_name}
          </span>
          <Barcode value={serial} height={28} />
          <span className="text-[10px] font-semibold tracking-wider">
            {serial}
          </span>
        </div>

        {/* Right: Details (simplified) */}
        <div className="flex flex-col justify-between flex-1 text-right">
          <div>
            <div className="font-extrabold text-xl leading-tight">
              {serial}
            </div>
            <div className="font-bold text-sm mt-0.5">FORM {formId}</div>
          </div>
          <div className="text-[11px] mt-1">
            <div className="font-semibold">TCNT {tcnt}</div>
          </div>
          <div className="text-[10px] mt-1">{date}</div>
        </div>
      </div>
    </div>
  )
}

export function LabelsModal({ job, onClose }: LabelsModalProps) {
  const deals = job.deals || []
  const today = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Modal title="Deal Labels" onClose={onClose} wide>
      <div id="labels-print" className="modal-print-area">
        <div className="text-xs text-ptm-text3 mb-4 no-print">
          {deals.length} deals × 2 labels each = {deals.length * 2} labels
          total (Box + Flare per deal)
        </div>

        <div className="flex flex-col gap-3 items-center">
          {deals.map((d) => (
            <div key={d.id} className="flex flex-col gap-2 label-pair">
              <BoxLabel deal={d} date={today} />
              <FlareLabel deal={d} date={today} />
            </div>
          ))}
        </div>

        <div className="flex gap-2.5 mt-5 justify-center no-print">
          <Button variant="primary" onClick={printModalContent}>
            Print All Labels
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
