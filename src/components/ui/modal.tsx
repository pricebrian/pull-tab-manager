'use client'

import { cn } from '@/lib/utils'
import { useEffect, useCallback } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  wide?: boolean
  children: React.ReactNode
}

export function Modal({ title, onClose, wide, children }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 bg-black/75 z-200 flex items-start justify-center p-10 overflow-y-auto print:static print:bg-transparent print:p-0 print:overflow-visible print:block"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-ptm-bg2 border border-ptm-border2 rounded-lg w-full animate-in fade-in slide-in-from-top-4 duration-200',
          'print:bg-transparent print:border-0 print:rounded-none print:max-w-none print:shadow-none',
          wide ? 'max-w-[900px]' : 'max-w-[560px]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ptm-border print:hidden">
          <span className="font-[family-name:var(--font-barlow-condensed)] font-bold text-lg tracking-wide uppercase text-ptm-text">
            {title}
          </span>
          <button
            className="text-ptm-text3 hover:text-ptm-text hover:bg-ptm-bg4 rounded px-2 py-1 cursor-pointer transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-6 print:p-0">{children}</div>
      </div>
    </div>
  )
}
