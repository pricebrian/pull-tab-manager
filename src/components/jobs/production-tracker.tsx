'use client'

import { useState, useTransition, useMemo } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatSerial } from '@/lib/utils'
import { updateDealStatuses } from '@/lib/actions/jobs'
import type { Job, DealStatus } from '@/types/database'

interface ProductionTrackerProps {
  job: Job
  onClose: () => void
}

const STATUS_OPTIONS: { value: DealStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: '#4ade80' },
  { value: 'lost_gluer', label: 'Lost at Gluer', color: '#f87171' },
  { value: 'lost_die_cut', label: 'Lost at Die Cut', color: '#fbbf24' },
]

export function ProductionTracker({ job, onClose }: ProductionTrackerProps) {
  const deals = job.deals || []
  const [statuses, setStatuses] = useState<Record<string, DealStatus>>(
    Object.fromEntries(deals.map((d) => [d.id, d.status]))
  )
  const [isPending, startTransition] = useTransition()

  const summary = useMemo(() => {
    const values = Object.values(statuses)
    const total = values.length
    const active = values.filter((s) => s === 'active').length
    const lostGluer = values.filter((s) => s === 'lost_gluer').length
    const lostDieCut = values.filter((s) => s === 'lost_die_cut').length
    const yieldPct = total > 0 ? ((active / total) * 100).toFixed(1) : '0.0'
    return { total, active, lostGluer, lostDieCut, yieldPct }
  }, [statuses])

  const hasChanges = useMemo(() => {
    return deals.some((d) => statuses[d.id] !== d.status)
  }, [deals, statuses])

  const handleSave = () => {
    const updates = deals
      .filter((d) => statuses[d.id] !== d.status)
      .map((d) => ({ id: d.id, status: statuses[d.id] }))

    if (updates.length === 0) {
      onClose()
      return
    }

    startTransition(async () => {
      const result = await updateDealStatuses(updates)
      if (!result?.error) {
        onClose()
      }
    })
  }

  const setAllStatus = (status: DealStatus) => {
    setStatuses(Object.fromEntries(deals.map((d) => [d.id, status])))
  }

  const yieldColor =
    parseFloat(summary.yieldPct) >= 98
      ? '#4ade80'
      : parseFloat(summary.yieldPct) >= 94
        ? '#fbbf24'
        : '#f87171'

  return (
    <Modal title="Production Tracker" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        {/* Summary */}
        <div className="flex items-center gap-4 px-4 py-3 bg-ptm-bg3 rounded-lg border border-ptm-border flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
              Total Deals
            </span>
            <strong className="text-lg font-[family-name:var(--font-barlow-condensed)] font-bold text-ptm-text">
              {summary.total}
            </strong>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
              Active
            </span>
            <strong className="text-lg font-[family-name:var(--font-barlow-condensed)] font-bold text-ptm-green">
              {summary.active}
            </strong>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
              Lost at Gluer
            </span>
            <strong className="text-lg font-[family-name:var(--font-barlow-condensed)] font-bold text-ptm-red">
              {summary.lostGluer}
            </strong>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
              Lost at Die Cut
            </span>
            <strong className="text-lg font-[family-name:var(--font-barlow-condensed)] font-bold text-ptm-yellow">
              {summary.lostDieCut}
            </strong>
          </div>
          <div className="flex flex-col gap-0.5 ml-auto">
            <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
              Yield
            </span>
            <strong
              className="text-lg font-[family-name:var(--font-barlow-condensed)] font-bold"
              style={{ color: yieldColor }}
            >
              {summary.yieldPct}%
            </strong>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ptm-text3 uppercase tracking-wider font-semibold">
            Set all:
          </span>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className="text-[11px] px-2.5 py-1 rounded border cursor-pointer transition-all hover:brightness-110"
              style={{
                color: opt.color,
                borderColor: opt.color + '40',
                background: opt.color + '15',
              }}
              onClick={() => setAllStatus(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Deal list */}
        <div className="max-h-[400px] overflow-y-auto flex flex-col gap-1">
          {deals.map((d) => {
            const currentStatus = statuses[d.id]
            const statusInfo = STATUS_OPTIONS.find(
              (s) => s.value === currentStatus
            )!
            const changed = currentStatus !== d.status

            return (
              <div
                key={d.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                  currentStatus !== 'active'
                    ? 'bg-ptm-bg4 border-ptm-border2'
                    : 'bg-ptm-bg3 border-ptm-border'
                } ${changed ? 'ring-1 ring-ptm-accent/30' : ''}`}
              >
                {/* Serial */}
                <span className="font-[family-name:var(--font-barlow-condensed)] font-bold text-sm text-ptm-accent2 min-w-[90px]">
                  #{formatSerial(d.serial)}
                </span>

                {/* Game name */}
                <span className="text-sm text-ptm-text flex-1 truncate">
                  {d.game_name}
                </span>

                {/* SKU */}
                <span className="text-[11px] text-ptm-text3 hidden sm:inline">
                  {d.sku}
                </span>

                {/* Status selector */}
                <select
                  className="bg-ptm-bg4 border text-sm px-2 py-1 rounded outline-none cursor-pointer transition-colors focus:border-ptm-accent"
                  style={{
                    color: statusInfo.color,
                    borderColor: statusInfo.color + '40',
                  }}
                  value={currentStatus}
                  onChange={(e) =>
                    setStatuses((prev) => ({
                      ...prev,
                      [d.id]: e.target.value as DealStatus,
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>

        {/* Lost serials summary */}
        {(summary.lostGluer > 0 || summary.lostDieCut > 0) && (
          <div className="bg-ptm-bg3 border border-ptm-border rounded-lg p-3">
            {summary.lostGluer > 0 && (
              <div className="text-[12px] text-ptm-red mb-1.5">
                <span className="font-semibold">Lost at Gluer:</span>{' '}
                {deals
                  .filter((d) => statuses[d.id] === 'lost_gluer')
                  .map((d) => `#${formatSerial(d.serial)}`)
                  .join(', ')}
              </div>
            )}
            {summary.lostDieCut > 0 && (
              <div className="text-[12px] text-ptm-yellow">
                <span className="font-semibold">Lost at Die Cut:</span>{' '}
                {deals
                  .filter((d) => statuses[d.id] === 'lost_die_cut')
                  .map((d) => `#${formatSerial(d.serial)}`)
                  .join(', ')}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2.5 mt-1">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isPending}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
