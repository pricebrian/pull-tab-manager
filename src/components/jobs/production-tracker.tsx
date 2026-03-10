'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatSerial, pct } from '@/lib/utils'
import { TICKET_MODES } from '@/lib/constants'
import { updateProductionData } from '@/lib/actions/jobs'
import type { Job, Deal } from '@/types/database'

interface ProductionTrackerProps {
  job: Job
  onClose: () => void
}

type DealState = {
  id: string
  sheets_in: number
  glue_damage: number
  cut_damage: number
}

export function ProductionTracker({ job, onClose }: ProductionTrackerProps) {
  const deals = job.deals || []
  const [dealStates, setDealStates] = useState<DealState[]>(
    deals.map((d) => ({
      id: d.id,
      sheets_in: d.sheets_in,
      glue_damage: d.glue_damage,
      cut_damage: d.cut_damage,
    }))
  )
  const [isPending, startTransition] = useTransition()

  const update = (id: string, field: keyof DealState, val: string) => {
    setDealStates((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, [field]: parseInt(val) || 0 } : d
      )
    )
  }

  const handleSave = () => {
    startTransition(async () => {
      for (const ds of dealStates) {
        await updateProductionData(ds.id, {
          sheets_in: ds.sheets_in,
          glue_damage: ds.glue_damage,
          cut_damage: ds.cut_damage,
        })
      }
      onClose()
    })
  }

  return (
    <Modal title="Production Tracker" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        {deals.map((d, i) => {
          const ds = dealStates[i]
          const mode =
            TICKET_MODES.find((m) => m.value === d.ticket_mode) ||
            TICKET_MODES[0]
          const totalSheets = Math.ceil(
            (d.tickets_per_deal || 0) / mode.perSheet
          )
          const glueOut = (ds.sheets_in || 0) - (ds.glue_damage || 0)
          const cutOut = glueOut - (ds.cut_damage || 0)
          const yieldPct =
            ds.sheets_in > 0 ? parseFloat(pct(cutOut, ds.sheets_in)) : 0
          const yieldColor =
            yieldPct >= 98 ? '#4ade80' : yieldPct >= 94 ? '#fbbf24' : '#f87171'

          return (
            <div
              key={d.id}
              className="bg-ptm-bg3 border border-ptm-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="font-semibold text-sm text-ptm-text">
                  {d.game_name}
                </span>
                <span className="font-[family-name:var(--font-barlow-condensed)] font-bold text-ptm-accent2 text-sm">
                  #{formatSerial(d.serial)}
                </span>
                <span className="text-[11px] text-ptm-text3 ml-auto">
                  Expected: {totalSheets} sheets
                </span>
                <span
                  className="font-[family-name:var(--font-barlow-condensed)] font-bold text-base"
                  style={{ color: yieldColor }}
                >
                  Yield: {yieldPct}%
                </span>
              </div>

              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-start max-sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-ptm-text3 uppercase tracking-wider font-semibold">
                    Sheets to Gluer
                  </label>
                  <input
                    type="number"
                    className="bg-ptm-bg4 border border-ptm-border text-ptm-text font-[family-name:var(--font-barlow)] text-sm px-2.5 py-1.5 rounded outline-none w-full focus:border-ptm-accent transition-colors"
                    value={ds.sheets_in || ''}
                    min={0}
                    onChange={(e) =>
                      update(d.id, 'sheets_in', e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-ptm-text3 uppercase tracking-wider font-semibold">
                    Damaged at Gluer
                  </label>
                  <input
                    type="number"
                    className="bg-ptm-bg4 border border-ptm-border text-ptm-text font-[family-name:var(--font-barlow)] text-sm px-2.5 py-1.5 rounded outline-none w-full focus:border-ptm-accent transition-colors"
                    value={ds.glue_damage || ''}
                    min={0}
                    onChange={(e) =>
                      update(d.id, 'glue_damage', e.target.value)
                    }
                  />
                  <span className="text-[11px] text-ptm-text2 mt-0.5">
                    Out: {glueOut}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-ptm-text3 uppercase tracking-wider font-semibold">
                    Damaged at Die Cut
                  </label>
                  <input
                    type="number"
                    className="bg-ptm-bg4 border border-ptm-border text-ptm-text font-[family-name:var(--font-barlow)] text-sm px-2.5 py-1.5 rounded outline-none w-full focus:border-ptm-accent transition-colors"
                    value={ds.cut_damage || ''}
                    min={0}
                    onChange={(e) =>
                      update(d.id, 'cut_damage', e.target.value)
                    }
                  />
                  <span className="text-[11px] text-ptm-text2 mt-0.5">
                    Out: {cutOut}
                  </span>
                </div>
                <div className="text-center p-2">
                  <div className="text-[10px] text-ptm-text3 uppercase tracking-wider mb-1">
                    Final Tickets
                  </div>
                  <div
                    className="font-[family-name:var(--font-barlow-condensed)] font-extrabold text-2xl"
                    style={{ color: yieldColor }}
                  >
                    {(cutOut * mode.perSheet).toLocaleString()}
                  </div>
                </div>
              </div>

              {(ds.glue_damage > 0 || ds.cut_damage > 0) && (
                <div className="text-[11px] text-ptm-yellow bg-ptm-yellow/10 px-2.5 py-1.5 rounded border-l-3 border-ptm-yellow mt-2">
                  Damage recorded — serial #{formatSerial(d.serial)} affected
                </div>
              )}
            </div>
          )
        })}

        <div className="flex gap-2.5 mt-1">
          <Button variant="primary" onClick={handleSave} loading={isPending}>
            Save Production Data
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
