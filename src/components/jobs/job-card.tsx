'use client'

import { useState } from 'react'
import { formatSerial, currency, pct } from '@/lib/utils'
import { TICKET_MODES } from '@/lib/constants'
import type { Job } from '@/types/database'
import { StagePipeline } from './stage-pipeline'
import { ProductionTracker } from './production-tracker'
import { ShipLog } from './ship-log'
import { LabelsModal } from './labels-modal'
import { BarChart3, Tag, Package, MonitorSmartphone } from 'lucide-react'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const [showTracker, setShowTracker] = useState(false)
  const [showShipLog, setShowShipLog] = useState(false)
  const [showLabels, setShowLabels] = useState(false)

  const deals = job.deals || []
  const totalDeals = deals.length
  const totalTickets = deals.reduce((s, d) => s + (d.tickets_per_deal || 0), 0)

  const overallYield = (() => {
    const tracked = deals.filter((d) => d.sheets_in > 0)
    if (!tracked.length) return null
    const totalIn = tracked.reduce((s, d) => s + (d.sheets_in || 0), 0)
    const totalOut = tracked.reduce(
      (s, d) =>
        s + (d.sheets_in || 0) - (d.glue_damage || 0) - (d.cut_damage || 0),
      0
    )
    return pct(totalOut, totalIn)
  })()

  return (
    <>
      <div className="bg-ptm-bg2 border border-ptm-border rounded-lg p-5 flex flex-col gap-3.5 transition-colors hover:border-ptm-border2">
        {/* Top row */}
        <div className="flex justify-between items-start">
          <div>
            <div className="font-[family-name:var(--font-barlow-condensed)] font-bold text-lg text-ptm-accent tracking-wide">
              {job.job_number}
            </div>
            <div className="text-[15px] text-ptm-text font-medium mt-0.5">
              {job.customer}
            </div>
            {job.due_date && (
              <div className="text-[11px] text-ptm-text3 mt-1">
                Due{' '}
                {new Date(job.due_date + 'T00:00:00').toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                )}
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <span className="block font-[family-name:var(--font-barlow-condensed)] font-bold text-[22px] text-ptm-text leading-none">
                {totalDeals}
              </span>
              <label className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                Deals
              </label>
            </div>
            <div className="text-center">
              <span className="block font-[family-name:var(--font-barlow-condensed)] font-bold text-[22px] text-ptm-text leading-none">
                {totalTickets.toLocaleString()}
              </span>
              <label className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                Tickets
              </label>
            </div>
            {overallYield !== null && (
              <div className="text-center">
                <span
                  className="block font-[family-name:var(--font-barlow-condensed)] font-bold text-[22px] leading-none"
                  style={{
                    color:
                      parseFloat(overallYield) >= 98
                        ? '#4ade80'
                        : parseFloat(overallYield) >= 94
                          ? '#fbbf24'
                          : '#f87171',
                  }}
                >
                  {overallYield}%
                </span>
                <label className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                  Yield
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Stage pipeline */}
        <StagePipeline jobId={job.id} currentStage={job.stage} />

        {/* Deals list */}
        <div className="flex flex-col gap-1">
          {deals.map((d) => {
            const mode =
              TICKET_MODES.find((m) => m.value === d.ticket_mode) ||
              TICKET_MODES[0]
            const sheets = Math.ceil(
              (d.tickets_per_deal || 0) / mode.perSheet
            )
            const out =
              (d.sheets_in || 0) -
              (d.glue_damage || 0) -
              (d.cut_damage || 0)
            const yld = d.sheets_in > 0 ? pct(out, d.sheets_in) : null

            return (
              <div
                key={d.id}
                className="flex items-center gap-2 text-xs px-2.5 py-1.5 bg-ptm-bg3 rounded flex-wrap"
              >
                <span className="font-[family-name:var(--font-barlow-condensed)] font-semibold text-ptm-accent2 text-[13px] min-w-[80px]">
                  #{formatSerial(d.serial)}
                </span>
                <span className="text-ptm-text font-medium flex-1">
                  {d.game_name}
                </span>
                <span className="text-ptm-text3 text-[11px]">{d.sku}</span>
                <span className="text-ptm-text2 text-[11px] ml-auto">
                  {(d.tickets_per_deal || 0).toLocaleString()} tickets ·{' '}
                  {sheets} sheets
                </span>
                {yld !== null && (
                  <span
                    className="text-[11px] font-semibold"
                    style={{
                      color:
                        parseFloat(yld) >= 98
                          ? '#4ade80'
                          : parseFloat(yld) >= 94
                            ? '#fbbf24'
                            : '#f87171',
                    }}
                  >
                    {yld}% yield
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Notes */}
        {job.notes && (
          <div className="text-xs text-ptm-text2 bg-ptm-bg3 px-3 py-2 rounded border-l-3 border-ptm-accent2">
            {job.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            className="flex items-center gap-1.5 text-xs font-medium text-ptm-text2 bg-ptm-bg3 border border-ptm-border px-3.5 py-1.5 rounded-lg cursor-pointer transition-all hover:text-ptm-text hover:border-ptm-border2 hover:bg-ptm-bg4"
            onClick={() => setShowTracker(true)}
          >
            <BarChart3 size={13} /> Production
          </button>
          <button
            className="flex items-center gap-1.5 text-xs font-medium text-ptm-text2 bg-ptm-bg3 border border-ptm-border px-3.5 py-1.5 rounded-lg cursor-pointer transition-all hover:text-ptm-text hover:border-ptm-border2 hover:bg-ptm-bg4"
            onClick={() => setShowLabels(true)}
          >
            <Tag size={13} /> Labels
          </button>
          <button
            className="flex items-center gap-1.5 text-xs font-medium text-ptm-text2 bg-ptm-bg3 border border-ptm-border px-3.5 py-1.5 rounded-lg cursor-pointer transition-all hover:text-ptm-text hover:border-ptm-border2 hover:bg-ptm-bg4"
            onClick={() => setShowShipLog(true)}
          >
            <Package size={13} /> Ship Log
          </button>
          <button
            className="flex items-center gap-1.5 text-xs font-medium text-ptm-monday bg-ptm-bg3 border border-ptm-monday/30 px-3.5 py-1.5 rounded-lg cursor-not-allowed opacity-50"
            title="Coming soon"
            disabled
          >
            <MonitorSmartphone size={13} /> Monday
            <span className="text-[9px] bg-ptm-bg4 text-ptm-text3 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showTracker && (
        <ProductionTracker
          job={job}
          onClose={() => setShowTracker(false)}
        />
      )}
      {showShipLog && (
        <ShipLog job={job} onClose={() => setShowShipLog(false)} />
      )}
      {showLabels && (
        <LabelsModal job={job} onClose={() => setShowLabels(false)} />
      )}
    </>
  )
}
