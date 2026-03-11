'use client'

import { useTransition } from 'react'
import { logout } from '@/lib/actions/auth'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      className="text-ptm-text3 hover:text-ptm-text transition-colors p-1.5 rounded-lg disabled:opacity-50"
      title="Log out"
      disabled={isPending}
      onClick={() => startTransition(async () => { await logout() })}
    >
      <LogOut size={15} />
    </button>
  )
}
