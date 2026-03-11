'use client'

import { useState, useTransition } from 'react'
import { verifyPin } from '@/lib/actions/auth'
import { Lock } from 'lucide-react'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!pin.trim()) {
      setError('Please enter the passphrase')
      return
    }

    startTransition(async () => {
      const result = await verifyPin(pin)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-ptm-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-ptm-accent/10 border border-ptm-accent/30 mb-4">
            <Lock size={24} className="text-ptm-accent" />
          </div>
          <h1 className="font-[family-name:var(--font-barlow-condensed)] font-extrabold text-2xl tracking-widest text-ptm-accent">
            PULL TAB MANAGER
          </h1>
          <p className="text-sm text-ptm-text3 mt-1">
            Enter passphrase to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg bg-ptm-red/10 border border-ptm-red/20 px-4 py-2.5 text-sm text-ptm-red text-center">
              {error}
            </div>
          )}

          <input
            type="password"
            className="w-full bg-ptm-bg3 border border-ptm-border text-ptm-text text-sm px-4 py-3 rounded-lg outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3 text-center tracking-widest"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="passphrase"
            autoFocus
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-3 inline-flex items-center justify-center rounded-lg font-[family-name:var(--font-barlow-condensed)] font-bold uppercase tracking-wide border cursor-pointer transition-all duration-150 bg-ptm-accent text-ptm-bg border-ptm-accent hover:brightness-110 px-5 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Verifying...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
