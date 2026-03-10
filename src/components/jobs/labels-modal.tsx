'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatSerial, currency } from '@/lib/utils'
import type { Job } from '@/types/database'

interface LabelsModalProps {
  job: Job
  onClose: () => void
}

export function LabelsModal({ job, onClose }: LabelsModalProps) {
  const deals = job.deals || []

  return (
    <Modal title="Deal Labels" onClose={onClose} wide>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {deals.map((d) => {
          const revenue = (d.tickets_per_deal || 0) * (d.price || 0)
          const profit = revenue - (d.payout || 0)
          const profitPct =
            revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0'

          return (
            <div
              key={d.id}
              className="bg-ptm-bg3 border-2 border-ptm-border2 rounded-lg p-4 font-[family-name:var(--font-barlow-condensed)] print:border-2 print:border-gray-800 print:break-inside-avoid"
            >
              {/* Label header */}
              <div className="flex justify-between items-start mb-3 pb-2.5 border-b border-ptm-border">
                <span className="font-extrabold text-lg text-ptm-text tracking-wide uppercase">
                  {d.game_name}
                </span>
                <span className="font-bold text-base text-ptm-accent2">
                  #{formatSerial(d.serial)}
                </span>
              </div>

              {/* Label grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-ptm-text3 uppercase tracking-wider">
                    Form/SKU
                  </span>
                  <strong className="text-sm text-ptm-text font-bold">
                    {d.sku || '—'}
                  </strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-ptm-text3 uppercase tracking-wider">
                    Tickets/Deal
                  </span>
                  <strong className="text-sm text-ptm-text font-bold">
                    {d.tickets_per_deal?.toLocaleString()}
                  </strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-ptm-text3 uppercase tracking-wider">
                    Ticket Price
                  </span>
                  <strong className="text-sm text-ptm-text font-bold">
                    {currency(d.price)}
                  </strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-ptm-text3 uppercase tracking-wider">
                    Payout
                  </span>
                  <strong className="text-sm text-ptm-text font-bold">
                    {currency(d.payout)}
                  </strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-ptm-text3 uppercase tracking-wider">
                    Profit
                  </span>
                  <strong className="text-sm text-ptm-text font-bold">
                    {currency(profit)}
                  </strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-ptm-text3 uppercase tracking-wider">
                    Profit %
                  </span>
                  <strong className="text-sm text-ptm-text font-bold">
                    {profitPct}%
                  </strong>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2.5 pt-2 border-t border-ptm-border text-[11px] text-ptm-text3">
                {job.customer} · {new Date().toLocaleDateString()}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center mt-5">
        <Button variant="primary" onClick={() => window.print()}>
          Print All Labels
        </Button>
      </div>
    </Modal>
  )
}
