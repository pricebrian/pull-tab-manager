'use client'

import { useState, useTransition } from 'react'
import { formatSerial, pct, cn, downloadQBCsv } from '@/lib/utils'
import { TICKET_MODES } from '@/lib/constants'
import type { Job } from '@/types/database'
import { StagePipeline } from './stage-pipeline'
import { ProductionTracker } from './production-tracker'
import { ShipLog } from './ship-log'
import { LabelsModal } from './labels-modal'
import { archiveJob, unarchiveJob } from '@/lib/actions/jobs'
import {
  BarChart3,
  Tag,
  Package,
  MonitorSmartphone,
  ChevronDown,
  Archive,
  FileSpreadsheet,
} from 'lucide-react'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showTracker, setShowTracker] = useState(false)
  const [showShipLog, setShowShipLog] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [isArchiving, startArchiveTransition] = useTransition()

  const deals = job.deals || []
  const totalDeals = deals.length
  const totalTickets = deals.reduce((s, d) => s + (d.tickets_per_deal || 0), 0)

  const lostCount = deals.filter((d) => d.status !== 'active').length
  const overallYield = (() => {
    if (!deals.length) return null
    if (lostCount === 0) return null
    const active = deals.filter((d) => d.status === 'active').length
    return pct(active, deals.length)
  })()

  const yieldColor =
    overallYield !== null
      ? parseFloat(overallYield) >= 98
        ? '#4ade80'
        : parseFloat(overallYield) >= 94
          ? '#fbbf24'
          : '#f87171'
      : undefined

  const archiveButton = !job.archived ? (
    <button
      className="text-ptm-text3 hover:text-ptm-text transition-colors p-1 rounded disabled:opacity-50"
      onClick={(e) => {
        e.stopPropagation()
        startArchiveTransition(async () => { await archiveJob(job.id) })
      }}
      disabled={isArchiving}
      title="Archive job"
    >
      <Archive size={14} />
    </button>
  ) : (
    <button
      className="text-ptm-accent2 hover:brightness-110 transition-colors p-1 rounded disabled:opacity-50"
      onClick={(e) => {
        e.stopPropagation()
        startArchiveTransition(async () => { await unarchiveJob(job.id) })
      }}
      disabled={isArchiving}
      title="Unarchive job"
    >
      <Archive size={14} />
    </button>
  )

  return (
    <>
      {!expanded ? (
        /* ── Collapsed card ── */
        <div
          className={cn(
            'bg-ptm-bg2 border border-ptm-border rounded-lg px-5 py-3 cursor-pointer transition-colors hover:border-ptm-border2',
            job.archived && 'opacity-60'
          )}
          onClick={() => setExpanded(true)}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-[family-name:var(--font-barlow-condensed)] font-bold text-base text-ptm-accent tracking-wide min-w-[120px]">
              {job.job_number}
            </span>
            <span className="text-sm text-ptm-text font-medium flex-1 min-w-[120px] truncate">
              {job.customer}
            </span>
            {job.due_date && (
              <span className="text-[11px] text-ptm-text3">
                Due{' '}
                {new Date(job.due_date + 'T00:00:00').toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric' }
                )}
              </span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-ptm-accent/30 text-ptm-accent bg-ptm-accent/10">
              {job.stage}
            </span>
            <span className="text-xs text-ptm-text2">
              {totalDeals} deals
            </span>
            <span className="text-xs text-ptm-text2">
              {totalTickets.toLocaleString()} tickets
            </span>
            {overallYield !== null && (
              <span className="text-xs font-semibold" style={{ color: yieldColor }}>
                {overallYield}%
              </span>
            )}
            {archiveButton}
            <ChevronDown size={16} className="text-ptm-text3" />
          </div>
        </div>
      ) : (
        /* ── Expanded card ── */
        <div
          className={cn(
            'bg-ptm-bg2 border border-ptm-border rounded-lg p-5 flex flex-col gap-3.5 transition-colors hover:border-ptm-border2',
            job.archived && 'opacity-60'
          )}
        >
          {/* Top row — clickable to collapse */}
          <div
            className="flex justify-between items-start cursor-pointer"
            onClick={() => setExpanded(false)}
          >
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
            <div className="flex gap-4 items-start">
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
                    style={{ color: yieldColor }}
                  >
                    {overallYield}%
                  </span>
                  <label className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                    Yield
                  </label>
                </div>
              )}
              <ChevronDown
                size={16}
                className="text-ptm-text3 mt-1 rotate-180 transition-transform"
              />
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

              return (
                <div
                  key={d.id}
                  className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded flex-wrap ${
                    d.status !== 'active'
                      ? 'bg-ptm-bg4 opacity-60'
                      : 'bg-ptm-bg3'
                  }`}
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
                  {d.status === 'lost_gluer' && (
                    <span className="text-[11px] font-semibold text-ptm-red">
                      Lost at Gluer
                    </span>
                  )}
                  {d.status === 'lost_die_cut' && (
                    <span className="text-[11px] font-semibold text-ptm-yellow">
                      Lost at Die Cut
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
              className="flex items-center gap-1.5 text-xs font-medium text-ptm-green bg-ptm-bg3 border border-ptm-green/30 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all hover:brightness-110 hover:border-ptm-green/50"
              onClick={() => downloadQBCsv(job)}
              title="Download QuickBooks CSV"
            >
              <FileSpreadsheet size={13} /> QB CSV
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
            {!job.archived ? (
              <button
                className="flex items-center gap-1.5 text-xs font-medium text-ptm-text2 bg-ptm-bg3 border border-ptm-border px-3.5 py-1.5 rounded-lg cursor-pointer transition-all hover:text-ptm-text hover:border-ptm-border2 hover:bg-ptm-bg4 ml-auto disabled:opacity-50"
                onClick={() =>
                  startArchiveTransition(async () => { await archiveJob(job.id) })
                }
                disabled={isArchiving}
              >
                <Archive size={13} /> Archive
              </button>
            ) : (
              <button
                className="flex items-center gap-1.5 text-xs font-medium text-ptm-accent2 bg-ptm-accent2/10 border border-ptm-accent2/30 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all hover:brightness-110 ml-auto disabled:opacity-50"
                onClick={() =>
                  startArchiveTransition(async () => { await unarchiveJob(job.id) })
                }
                disabled={isArchiving}
              >
                <Archive size={13} /> Unarchive
              </button>
            )}
          </div>
        </div>
      )}

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
