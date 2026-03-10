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
      <header className="no-print sticky top-0 z-50 px-5 sm:px-7 py-3 sm:py-4 bg-ptm-bg2 border-b border-ptm-border">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-[family-name:var(--font-barlow-condensed)] font-extrabold text-lg sm:text-xl tracking-widest text-ptm-accent truncate">
              ◈ PULL TAB MANAGER
            </div>
            <div className="text-[10px] sm:text-[11px] text-ptm-text3 tracking-widest uppercase mt-0.5">
              Production Management System
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Nav links — desktop only */}
            <nav className="hidden lg:flex items-center gap-1">
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

            <div className="text-xs text-ptm-text2 hidden sm:block">
              Next Serial:{' '}
              <span className="text-ptm-accent2 font-semibold font-[family-name:var(--font-barlow-condensed)] text-[15px]">
                #{formatSerial(nextSerial)}
              </span>
            </div>
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center rounded-lg font-[family-name:var(--font-barlow-condensed)] font-bold uppercase tracking-wide border cursor-pointer transition-all duration-150 bg-ptm-accent text-ptm-bg border-ptm-accent hover:brightness-110 px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              + New Job
            </Link>
          </div>
        </div>
        {/* Serial — mobile only */}
        <div className="sm:hidden text-[11px] text-ptm-text2 mt-1.5">
          Next Serial:{' '}
          <span className="text-ptm-accent2 font-semibold font-[family-name:var(--font-barlow-condensed)] text-[13px]">
            #{formatSerial(nextSerial)}
          </span>
        </div>
      </header>

      {children}
    </div>
  )
}
