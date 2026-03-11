'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatSerial, currency, printModalContent } from '@/lib/utils'
import type { Job } from '@/types/database'

interface ShipLogProps {
  job: Job
  onClose: () => void
}

export function ShipLog({ job, onClose }: ShipLogProps) {
  const deals = job.deals || []
  const totalTickets = deals.reduce(
    (s, d) => s + (d.tickets_per_deal || 0),
    0
  )

  return (
    <Modal title="Ship Log / Pick List" onClose={onClose} wide>
      <div id="ship-log-print" className="modal-print-area">
        {/* Header */}
        <div className="ship-log-header flex justify-between items-start mb-4 pb-4 border-b-2 border-ptm-border2 print:border-black/20">
          <div>
            <div className="font-[family-name:var(--font-barlow-condensed)] font-extrabold text-[22px] tracking-widest text-ptm-text print:text-black">
              OAKDAY INC.
            </div>
            <div className="text-xs text-ptm-text3 uppercase tracking-widest mt-0.5 print:text-gray-500">
              Ship Log &amp; Pick List
            </div>
          </div>
          <div className="text-[13px] text-ptm-text2 text-right leading-7 print:text-gray-700">
            <div>
              <b className="text-ptm-text print:text-black">Customer:</b>{' '}
              {job.customer}
            </div>
            <div>
              <b className="text-ptm-text print:text-black">Job:</b>{' '}
              {job.job_number}
            </div>
            <div>
              <b className="text-ptm-text print:text-black">Date:</b>{' '}
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Summary stats row */}
        <div className="flex gap-6 mb-4 pb-3 border-b border-ptm-border print:border-black/10">
          <div className="text-xs text-ptm-text2 print:text-gray-600">
            <b className="text-ptm-text font-[family-name:var(--font-barlow-condensed)] text-base print:text-black">
              {deals.length}
            </b>{' '}
            Deals
          </div>
          <div className="text-xs text-ptm-text2 print:text-gray-600">
            <b className="text-ptm-text font-[family-name:var(--font-barlow-condensed)] text-base print:text-black">
              {totalTickets.toLocaleString()}
            </b>{' '}
            Total Tickets
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse text-xs print:text-[10px]">
          <thead>
            <tr>
              {[
                'Game Name',
                'SKU',
                'Serial #',
                'Tickets/Deal',
                'Price',
                'Payout',
                'Profit',
              ].map((h) => (
                <th
                  key={h}
                  className="px-2 py-1.5 text-left text-[10px] print:text-[9px] uppercase tracking-widest text-ptm-text3 border-b border-ptm-border2 print:text-gray-500 print:border-black/20"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => {
              const profit =
                (d.tickets_per_deal || 0) * (d.price || 0) - (d.payout || 0)

              return (
                <tr key={d.id} className="print:break-inside-avoid">
                  <td className="px-2 py-1.5 border-b border-ptm-border text-ptm-text2 print:text-black print:border-black/8">
                    {d.game_name}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ptm-border text-ptm-text2 print:text-gray-700 print:border-black/8">
                    {d.sku}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ptm-border font-[family-name:var(--font-barlow-condensed)] text-ptm-accent2 print:text-black print:font-semibold print:border-black/8">
                    #{formatSerial(d.serial)}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ptm-border text-ptm-text2 print:text-black print:border-black/8">
                    {d.tickets_per_deal?.toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ptm-border text-ptm-text2 print:text-black print:border-black/8">
                    {currency(d.price)}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ptm-border text-ptm-text2 print:text-black print:border-black/8">
                    {currency(d.payout)}
                  </td>
                  <td className="px-2 py-1.5 border-b border-ptm-border text-ptm-text2 print:text-black print:border-black/8">
                    {currency(profit)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="print:break-inside-avoid">
              <td
                colSpan={3}
                className="px-2 py-2 border-t-2 border-ptm-border2 text-ptm-text font-bold print:text-black print:border-black/20"
              >
                TOTALS
              </td>
              <td className="px-2 py-2 border-t-2 border-ptm-border2 text-ptm-text font-bold print:text-black print:border-black/20">
                {totalTickets.toLocaleString()}
              </td>
              <td
                colSpan={3}
                className="border-t-2 border-ptm-border2 print:border-black/20"
              ></td>
            </tr>
          </tfoot>
        </table>

        <div className="flex gap-2.5 mt-5 no-print">
          <Button variant="primary" onClick={printModalContent}>
            Print / Export PDF
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
