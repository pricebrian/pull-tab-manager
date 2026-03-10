'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatSerial, currency } from '@/lib/utils'
import { TICKET_MODES } from '@/lib/constants'
import { createJob } from '@/lib/actions/jobs'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

type DealInput = {
  id: number
  game_name: string
  sku: string
  ticket_mode: string
  tickets_per_deal: number
  price: number
  payout: number
}

export default function NewJobPage() {
  const [customer, setCustomer] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [deals, setDeals] = useState<DealInput[]>([
    {
      id: 1,
      game_name: '',
      sku: '',
      ticket_mode: '5w',
      tickets_per_deal: 0,
      price: 0,
      payout: 0,
    },
  ])
  const [dealCounter, setDealCounter] = useState(2)
  const [nextSerial, setNextSerial] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'next_serial')
      .single()
      .then(({ data }) => {
        if (data) setNextSerial(parseInt(data.value))
      })
  }, [])

  const addDeal = () => {
    setDeals((prev) => [
      ...prev,
      {
        id: dealCounter,
        game_name: '',
        sku: '',
        ticket_mode: '5w',
        tickets_per_deal: 0,
        price: 0,
        payout: 0,
      },
    ])
    setDealCounter((c) => c + 1)
  }

  const updateDeal = (id: number, field: keyof DealInput, value: string | number) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )
  }

  const removeDeal = (id: number) => {
    if (deals.length > 1) {
      setDeals((prev) => prev.filter((d) => d.id !== id))
    }
  }

  const handleSubmit = () => {
    setError(null)

    if (!customer.trim()) {
      setError('Customer name is required')
      return
    }

    if (deals.some((d) => !d.game_name.trim())) {
      setError('All deals need a game name')
      return
    }

    startTransition(async () => {
      const result = await createJob({
        customer,
        due_date: dueDate,
        notes,
        deals: deals.map((d) => ({
          game_name: d.game_name,
          sku: d.sku,
          ticket_mode: d.ticket_mode,
          tickets_per_deal: d.tickets_per_deal,
          price: d.price,
          payout: d.payout,
        })),
      })

      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-ptm-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-4 px-7 py-4 bg-ptm-bg2 border-b border-ptm-border">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-ptm-text2 hover:text-ptm-text transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <h1 className="font-[family-name:var(--font-barlow-condensed)] font-bold text-lg tracking-wide uppercase text-ptm-text">
          Create New Job
        </h1>
      </header>

      <div className="max-w-[900px] mx-auto p-7">
        {error && (
          <div className="mb-5 rounded-lg bg-ptm-red/10 border border-ptm-red/20 px-4 py-3 text-sm text-ptm-red">
            {error}
          </div>
        )}

        {/* Job info */}
        <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
              Customer Name
            </label>
            <input
              className="bg-ptm-bg3 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Riverside VFW"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
              Due Date
            </label>
            <input
              type="date"
              className="bg-ptm-bg3 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2 max-sm:col-span-1">
            <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
              Notes
            </label>
            <input
              className="bg-ptm-bg3 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional job notes..."
            />
          </div>
        </div>

        {/* Deals section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-ptm-text">
              Deals{' '}
              <span className="bg-ptm-accent text-ptm-bg text-[11px] px-1.5 py-0.5 rounded-full ml-1.5">
                {deals.length}
              </span>
            </span>
            <span className="text-[11px] text-ptm-accent2 font-[family-name:var(--font-barlow-condensed)]">
              Serials: #{formatSerial(nextSerial)} — #
              {formatSerial(nextSerial + deals.length - 1)}
            </span>
          </div>

          {deals.map((deal, i) => {
            const mode =
              TICKET_MODES.find((m) => m.value === deal.ticket_mode) ||
              TICKET_MODES[0]
            const sheets = deal.tickets_per_deal
              ? Math.ceil(deal.tickets_per_deal / mode.perSheet)
              : 0
            const revenue = (deal.tickets_per_deal || 0) * (deal.price || 0)
            const profit = revenue - (deal.payout || 0)
            const profitPct =
              revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0'

            return (
              <div
                key={deal.id}
                className="bg-ptm-bg3 border border-ptm-border rounded-lg p-4 mb-2.5"
              >
                <div className="flex justify-between items-center mb-3.5">
                  <span className="font-[family-name:var(--font-barlow-condensed)] font-bold text-base text-ptm-accent2">
                    Serial #{formatSerial(nextSerial + i)}
                  </span>
                  <button
                    className="text-[11px] text-ptm-red bg-ptm-red/10 border border-ptm-red/20 rounded px-2.5 py-1 cursor-pointer hover:bg-ptm-red/20 transition-colors"
                    onClick={() => removeDeal(deal.id)}
                    disabled={deals.length <= 1}
                  >
                    Remove Deal
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
                      Game Name
                    </label>
                    <input
                      className="bg-ptm-bg4 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
                      value={deal.game_name}
                      onChange={(e) =>
                        updateDeal(deal.id, 'game_name', e.target.value)
                      }
                      placeholder="e.g. Lucky 7s"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
                      Form / SKU
                    </label>
                    <input
                      className="bg-ptm-bg4 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
                      value={deal.sku}
                      onChange={(e) =>
                        updateDeal(deal.id, 'sku', e.target.value)
                      }
                      placeholder="e.g. LK7-5W-3990"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
                      Ticket Type
                    </label>
                    <select
                      className="bg-ptm-bg4 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors"
                      value={deal.ticket_mode}
                      onChange={(e) =>
                        updateDeal(deal.id, 'ticket_mode', e.target.value)
                      }
                    >
                      {TICKET_MODES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
                      Tickets per Deal
                    </label>
                    <input
                      type="number"
                      className="bg-ptm-bg4 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
                      value={deal.tickets_per_deal || ''}
                      onChange={(e) =>
                        updateDeal(
                          deal.id,
                          'tickets_per_deal',
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="e.g. 3990"
                    />
                    {sheets > 0 && (
                      <span className="text-[11px] text-ptm-accent2 mt-0.5">
                        {sheets} sheets @ {mode.perSheet}/sheet
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
                      Ticket Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      className="bg-ptm-bg4 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
                      value={deal.price || ''}
                      onChange={(e) =>
                        updateDeal(
                          deal.id,
                          'price',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.25"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
                      Payout ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      className="bg-ptm-bg4 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
                      value={deal.payout || ''}
                      onChange={(e) =>
                        updateDeal(
                          deal.id,
                          'payout',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Calcs */}
                {deal.tickets_per_deal > 0 && deal.price > 0 && (
                  <div className="flex gap-4 mt-3 px-3 py-2.5 bg-ptm-bg4 rounded">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                        Revenue
                      </span>
                      <strong className="text-sm font-[family-name:var(--font-barlow-condensed)] font-bold">
                        {currency(revenue)}
                      </strong>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                        Profit
                      </span>
                      <strong
                        className="text-sm font-[family-name:var(--font-barlow-condensed)] font-bold"
                        style={{
                          color: profit >= 0 ? '#4ade80' : '#f87171',
                        }}
                      >
                        {currency(profit)}
                      </strong>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                        Profit %
                      </span>
                      <strong
                        className="text-sm font-[family-name:var(--font-barlow-condensed)] font-bold"
                        style={{
                          color:
                            parseFloat(profitPct) >= 20
                              ? '#4ade80'
                              : '#fbbf24',
                        }}
                      >
                        {profitPct}%
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <button
            className="w-full bg-transparent border-2 border-dashed border-ptm-border text-ptm-text3 font-[family-name:var(--font-barlow-condensed)] font-semibold text-sm uppercase tracking-wide py-2.5 rounded-lg cursor-pointer transition-all hover:border-ptm-accent hover:text-ptm-accent mt-1"
            onClick={addDeal}
          >
            + Add Another Deal
          </button>
        </div>

        {/* Submit */}
        <div className="flex gap-2.5 mt-6">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            loading={isPending}
          >
            Create Job & Assign Serials
          </Button>
          <Link href="/">
            <Button variant="secondary" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
