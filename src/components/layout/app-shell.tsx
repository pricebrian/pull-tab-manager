import Link from 'next/link'
import { formatSerial } from '@/lib/utils'
import { getNextSerial } from '@/lib/queries'
import { Briefcase, ScanBarcode, FileText, Settings } from 'lucide-react'

const navItems = [
  { label: 'Jobs', href: '/', icon: Briefcase, active: true },
  { label: 'Scanner', href: '#', icon: ScanBarcode, soon: true },
  { label: 'Invoices', href: '#', icon: FileText, soon: true },
  { label: 'Settings', href: '#', icon: Settings, soon: true },
]

export async function AppShell({ children }: { children: React.ReactNode }) {
  const nextSerial = await getNextSerial()

  return (
    <div className="min-h-screen bg-ptm-bg pb-16">
      {/* Header */}
      <header className="no-print sticky top-0 z-50 flex items-center justify-between px-7 py-4 bg-ptm-bg2 border-b border-ptm-border">
        <div>
          <div className="font-[family-name:var(--font-barlow-condensed)] font-extrabold text-xl tracking-widest text-ptm-accent">
            ◈ PULL TAB MANAGER
          </div>
          <div className="text-[11px] text-ptm-text3 tracking-widest uppercase mt-0.5">
            Production Management System
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-barlow-condensed)] font-semibold uppercase tracking-wide transition-colors ${
                  item.active
                    ? 'text-ptm-accent bg-ptm-accent/10'
                    : item.soon
                      ? 'text-ptm-text3 cursor-not-allowed'
                      : 'text-ptm-text2 hover:text-ptm-text'
                }`}
              >
                <item.icon size={14} />
                {item.label}
                {item.soon && (
                  <span className="text-[9px] bg-ptm-bg4 text-ptm-text3 px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="text-xs text-ptm-text2">
            Next Serial:{' '}
            <span className="text-ptm-accent2 font-semibold font-[family-name:var(--font-barlow-condensed)] text-[15px]">
              #{formatSerial(nextSerial)}
            </span>
          </div>
          <Link
            href="/jobs/new"
            className="inline-flex items-center justify-center rounded-lg font-[family-name:var(--font-barlow-condensed)] font-bold uppercase tracking-wide border cursor-pointer transition-all duration-150 bg-ptm-accent text-ptm-bg border-ptm-accent hover:brightness-110 px-5 py-2 text-sm"
          >
            + New Job
          </Link>
        </div>
      </header>

      {children}
    </div>
  )
}
