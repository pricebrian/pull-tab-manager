'use client'

import { cn } from '@/lib/utils'
import { STAGES } from '@/lib/constants'
import { updateJobStage } from '@/lib/actions/jobs'
import type { Stage } from '@/types/database'
import { useTransition } from 'react'

interface StagePipelineProps {
  jobId: string
  currentStage: Stage
}

export function StagePipeline({ jobId, currentStage }: StagePipelineProps) {
  const [isPending, startTransition] = useTransition()
  const stageIdx = STAGES.indexOf(currentStage)

  const handleClick = (stage: Stage) => {
    startTransition(() => {
      updateJobStage(jobId, stage)
    })
  }

  return (
    <div
      className={cn(
        'flex bg-ptm-bg3 rounded-md overflow-hidden border border-ptm-border',
        isPending && 'opacity-60'
      )}
    >
      {STAGES.map((stage, i) => {
        const isDone = i < stageIdx
        const isActive = i === stageIdx

        return (
          <button
            key={stage}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 px-0.5 cursor-pointer transition-colors hover:bg-white/[0.04] border-none bg-transparent"
            onClick={() => handleClick(stage)}
            title={stage}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                isDone && 'bg-ptm-green',
                isActive && 'bg-ptm-accent shadow-[0_0_8px_var(--color-ptm-accent)]',
                !isDone && !isActive && 'bg-ptm-text3'
              )}
            />
            <span
              className={cn(
                'text-[9px] tracking-wide uppercase',
                isDone && 'text-ptm-green',
                isActive && 'text-ptm-accent font-semibold',
                !isDone && !isActive && 'text-ptm-text3'
              )}
            >
              {stage}
            </span>
          </button>
        )
      })}
    </div>
  )
}
