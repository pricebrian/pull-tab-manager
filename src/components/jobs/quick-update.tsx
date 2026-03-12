'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import {
  interpretUpdate,
  executeActions,
} from '@/lib/actions/quick-update'
import { formatSerial } from '@/lib/utils'
import type { InterpretResult, ProposedAction } from '@/types/quick-update'
import {
  Sparkles,
  ArrowRight,
  AlertTriangle,
  X,
  Check,
  Archive,
  ArchiveRestore,
} from 'lucide-react'

export function QuickUpdate() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState<InterpretResult | null>(null)
  const [isInterpreting, startInterpret] = useTransition()
  const [isExecuting, startExecute] = useTransition()
  const [executed, setExecuted] = useState(false)

  const handleInterpret = () => {
    setResult(null)
    setExecuted(false)
    startInterpret(async () => {
      const res = await interpretUpdate(text)
      setResult(res)
    })
  }

  const handleConfirm = () => {
    if (!result?.success) return
    startExecute(async () => {
      const res = await executeActions(result.actions)
      if (!res.error) {
        setExecuted(true)
        setTimeout(() => handleClose(), 1500)
      } else {
        setResult({ success: false, error: res.error })
      }
    })
  }

  const handleClose = () => {
    setOpen(false)
    setText('')
    setResult(null)
    setExecuted(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
      e.preventDefault()
      handleInterpret()
    }
  }

  return (
    <>
      <button
        className="flex items-center gap-1.5 font-[family-name:var(--font-barlow-condensed)] font-semibold text-xs tracking-wide uppercase px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all text-ptm-blue bg-ptm-blue/10 border-ptm-blue/30 hover:bg-ptm-blue/20 hover:border-ptm-blue/50"
        onClick={() => setOpen(true)}
      >
        <Sparkles size={13} /> Quick Update
      </button>

      {open && (
        <Modal title="AI Quick Update" onClose={handleClose}>
          <div className="flex flex-col gap-4">
            {/* Input */}
            <div>
              <textarea
                className="w-full bg-ptm-bg3 border border-ptm-border text-ptm-text text-sm px-3.5 py-2.5 rounded-lg outline-none transition-colors focus:border-ptm-accent placeholder:text-ptm-text3 resize-none"
                rows={3}
                placeholder='e.g. "Job 4 finished printing, move to gluing. Deal 1409130 was lost at the die cut."'
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={isExecuting || executed}
              />
              <div className="text-[10px] text-ptm-text3 mt-1">
                Press Enter to interpret. Describe stage changes, lost deals, or
                archival actions.
              </div>
            </div>

            {/* Interpret button */}
            {!result && !executed && (
              <Button
                variant="primary"
                onClick={handleInterpret}
                loading={isInterpreting}
                disabled={!text.trim()}
              >
                Interpret Update
              </Button>
            )}

            {/* Error */}
            {result && !result.success && (
              <>
                <div className="flex items-start gap-2 bg-ptm-red/10 border border-ptm-red/20 rounded-lg px-3.5 py-2.5">
                  <AlertTriangle
                    size={16}
                    className="text-ptm-red mt-0.5 shrink-0"
                  />
                  <div>
                    <div className="text-sm text-ptm-red font-medium">
                      Could not interpret
                    </div>
                    <div className="text-xs text-ptm-text2 mt-0.5">
                      {result.error}
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleInterpret}
                  loading={isInterpreting}
                  disabled={!text.trim()}
                >
                  Retry
                </Button>
              </>
            )}

            {/* Proposed actions */}
            {result?.success && !executed && (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-ptm-text2 font-medium uppercase tracking-wider">
                  Proposed Actions
                </div>
                <div className="flex flex-col gap-2">
                  {result.actions.map((action, i) => (
                    <ActionCard key={i} action={action} />
                  ))}
                </div>
                <div className="flex gap-2.5 mt-1">
                  <Button
                    variant="primary"
                    onClick={handleConfirm}
                    loading={isExecuting}
                  >
                    Confirm &amp; Apply
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setResult(null)}
                  >
                    Edit &amp; Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Success */}
            {executed && (
              <div className="flex items-center gap-2 bg-ptm-green/10 border border-ptm-green/20 rounded-lg px-3.5 py-3">
                <Check size={18} className="text-ptm-green" />
                <span className="text-sm text-ptm-green font-medium">
                  All actions applied successfully!
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}

function ActionCard({ action }: { action: ProposedAction }) {
  switch (action.type) {
    case 'move_stage':
      return (
        <div className="flex items-center gap-2 bg-ptm-bg3 border border-ptm-border rounded-lg px-3 py-2">
          <ArrowRight size={14} className="text-ptm-accent shrink-0" />
          <div className="text-sm text-ptm-text">
            <span className="text-ptm-accent font-semibold">
              {action.jobNumber}
            </span>{' '}
            <span className="text-ptm-text3">{action.fromStage}</span>
            {' → '}
            <span className="text-ptm-accent2 font-semibold">
              {action.toStage}
            </span>
          </div>
        </div>
      )
    case 'mark_deal_lost':
      return (
        <div className="flex items-center gap-2 bg-ptm-bg3 border border-ptm-border rounded-lg px-3 py-2">
          <X
            size={14}
            className={
              action.lostAt === 'lost_gluer'
                ? 'text-ptm-red shrink-0'
                : 'text-ptm-yellow shrink-0'
            }
          />
          <div className="text-sm text-ptm-text">
            Deal{' '}
            <span className="font-[family-name:var(--font-barlow-condensed)] text-ptm-accent2 font-semibold">
              #{formatSerial(action.serial)}
            </span>{' '}
            ({action.gameName}) —{' '}
            <span
              className={
                action.lostAt === 'lost_gluer'
                  ? 'text-ptm-red font-semibold'
                  : 'text-ptm-yellow font-semibold'
              }
            >
              Lost at {action.lostAt === 'lost_gluer' ? 'Gluer' : 'Die Cut'}
            </span>
            <span className="text-ptm-text3 text-xs ml-1">
              ({action.jobNumber})
            </span>
          </div>
        </div>
      )
    case 'mark_deal_active':
      return (
        <div className="flex items-center gap-2 bg-ptm-bg3 border border-ptm-border rounded-lg px-3 py-2">
          <Check size={14} className="text-ptm-green shrink-0" />
          <div className="text-sm text-ptm-text">
            Deal{' '}
            <span className="font-[family-name:var(--font-barlow-condensed)] text-ptm-accent2 font-semibold">
              #{formatSerial(action.serial)}
            </span>{' '}
            ({action.gameName}) —{' '}
            <span className="text-ptm-green font-semibold">Reactivated</span>
            <span className="text-ptm-text3 text-xs ml-1">
              ({action.jobNumber})
            </span>
          </div>
        </div>
      )
    case 'archive_job':
      return (
        <div className="flex items-center gap-2 bg-ptm-bg3 border border-ptm-border rounded-lg px-3 py-2">
          <Archive size={14} className="text-ptm-text3 shrink-0" />
          <div className="text-sm text-ptm-text">
            Archive{' '}
            <span className="text-ptm-accent font-semibold">
              {action.jobNumber}
            </span>
          </div>
        </div>
      )
    case 'unarchive_job':
      return (
        <div className="flex items-center gap-2 bg-ptm-bg3 border border-ptm-border rounded-lg px-3 py-2">
          <ArchiveRestore size={14} className="text-ptm-accent2 shrink-0" />
          <div className="text-sm text-ptm-text">
            Unarchive{' '}
            <span className="text-ptm-accent font-semibold">
              {action.jobNumber}
            </span>
          </div>
        </div>
      )
  }
}
