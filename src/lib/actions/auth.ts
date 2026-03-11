'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin.trim()).digest('hex')
}

const COOKIE_NAME = 'ptm-auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 365 days

export async function verifyPin(pin: string) {
  const expectedHash = process.env.AUTH_PIN
  if (!expectedHash) {
    return { error: 'Auth not configured' }
  }

  const inputHash = hashPin(pin)

  if (inputHash !== expectedHash) {
    return { error: 'Invalid passphrase' }
  }

  // Set auth cookie
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, inputHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  redirect('/')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect('/login')
}
