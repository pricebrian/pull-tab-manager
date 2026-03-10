'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatSerial, currency } from '@/lib/utils'
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
  const totalValue = deals.reduce(
    (s, d) => s + (d.tickets_per_deal || 0) * (d.price || 0),
    0
  )

  return (
    <Modal title="Ship Log / Pick List" onClose={onClose} wide>
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-5 pb-4 border-b-2 border-ptm-border2">
          <div>
            <div className="font-[family-name:var(--font-barlow-condensed)] font-extrabold text-[22px] tracking-widest text-ptm-text">
              OAKDAY INC.
            </div>
            <div className="text-xs text-ptm-text3 uppercase tracking-widest mt-0.5">
              Ship Log & Pick List
            </div>
          </div>
          <div className="text-[13px] text-ptm-text2 text-right leading-7">
            <div>
              <b className="text-ptm-text">Customer:</b> {job.customer}
            </div>
            <div>
              <b className="text-ptm-text">Job:</b> {job.job_number}
            </div>
            <div>
              <b className="text-ptm-text">Date:</b>{' '}
              {new Date().toLocaleDateString()}
            </div>
            <div>
              <b className="text-ptm-text">Status:</b> {job.stage}
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse text-xs">
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
                  className="px-2.5 py-2 text-left text-[10px] uppercase tracking-widest text-ptm-text3 border-b border-ptm-border2"
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
                <tr key={d.id}>
                  <td className="px-2.5 py-2 border-b border-ptm-border text-ptm-text2">
                    {d.game_name}
                  </td>
                  <td className="px-2.5 py-2 border-b border-ptm-border text-ptm-text2">
                    {d.sku}
                  </td>
                  <td className="px-2.5 py-2 border-b border-ptm-border font-[family-name:var(--font-barlow-condensed)] text-ptm-accent2">
                    #{formatSerial(d.serial)}
                  </td>
                  <td className="px-2.5 py-2 border-b border-ptm-border text-ptm-text2">
                    {d.tickets_per_deal?.toLocaleString()}
                  </td>
                  <td className="px-2.5 py-2 border-b border-ptm-border text-ptm-text2">
                    {currency(d.price)}
                  </td>
                  <td className="px-2.5 py-2 border-b border-ptm-border text-ptm-text2">
                    {currency(d.payout)}
                  </td>
                  <td className="px-2.5 py-2 border-b border-ptm-border text-ptm-text2">
                    {currency(profit)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={3}
                className="px-2.5 py-2.5 border-t-2 border-ptm-border2 text-ptm-text font-bold"
              >
                TOTALS
              </td>
              <td className="px-2.5 py-2.5 border-t-2 border-ptm-border2 text-ptm-text font-bold">
                {totalTickets.toLocaleString()}
              </td>
              <td
                colSpan={2}
                className="border-t-2 border-ptm-border2"
              ></td>
              <td
                className="px-2.5 py-2.5 border-t-2 border-ptm-border2 text-ptm-text font-bold"
              >
                {currency(totalValue)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="flex gap-2.5 mt-5">
          <Button variant="primary" onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
