'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatSerial, currency } from '@/lib/utils'
import { TICKET_MODES } from '@/lib/constants'
import { createJob } from '@/lib/actions/jobs'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

type BatchInput = {
  id: number
  game_name: string
  sku: string
  ticket_mode: string
  tickets_per_deal: number
  price: number
  payout: number
  starting_serial: number
  deal_count: number
}

export default function NewJobPage() {
  const [customer, setCustomer] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [nextSerial, setNextSerial] = useState<number>(1)
  const [batches, setBatches] = useState<BatchInput[]>([
    {
      id: 1,
      game_name: '',
      sku: '',
      ticket_mode: '5w',
      tickets_per_deal: 0,
      price: 0,
      payout: 0,
      starting_serial: 0,
      deal_count: 1,
    },
  ])
  const [batchCounter, setBatchCounter] = useState(2)
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
        if (data) {
          const serial = parseInt(data.value)
          setNextSerial(serial)
          setBatches((prev) =>
            prev.map((b, i) =>
              i === 0 && b.starting_serial === 0
                ? { ...b, starting_serial: serial }
                : b
            )
          )
        }
      })
  }, [])

  const totalDeals = useMemo(
    () => batches.reduce((sum, b) => sum + (b.deal_count || 0), 0),
    [batches]
  )

  const addBatch = () => {
    const lastBatch = batches[batches.length - 1]
    const nextStart =
      (lastBatch?.starting_serial || nextSerial) +
      (lastBatch?.deal_count || 1)

    setBatches((prev) => [
      ...prev,
      {
        id: batchCounter,
        game_name: '',
        sku: '',
        ticket_mode: '5w',
        tickets_per_deal: 0,
        price: 0,
        payout: 0,
        starting_serial: nextStart,
        deal_count: 1,
      },
    ])
    setBatchCounter((c) => c + 1)
  }

  const updateBatch = (
    id: number,
    field: keyof BatchInput,
    value: string | number
  ) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    )
  }

  const removeBatch = (id: number) => {
    if (batches.length > 1) {
      setBatches((prev) => prev.filter((b) => b.id !== id))
    }
  }

  const handleSubmit = () => {
    setError(null)

    if (!customer.trim()) {
      setError('Customer name is required')
      return
    }

    if (batches.some((b) => !b.game_name.trim())) {
      setError('All batches need a game name')
      return
    }

    if (batches.some((b) => b.deal_count < 1)) {
      setError('Each batch needs at least 1 deal')
      return
    }

    if (batches.some((b) => b.starting_serial < 1)) {
      setError('Starting serial must be at least 1')
      return
    }

    startTransition(async () => {
      const result = await createJob({
        customer,
        due_date: dueDate,
        notes,
        batches: batches.map((b) => ({
          game_name: b.game_name,
          sku: b.sku,
          ticket_mode: b.ticket_mode,
          tickets_per_deal: b.tickets_per_deal,
          price: b.price,
          payout: b.payout,
          starting_serial: b.starting_serial,
          deal_count: b.deal_count,
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

        {/* Deal Batches */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-ptm-text">
              Deal Batches{' '}
              <span className="bg-ptm-accent text-ptm-bg text-[11px] px-1.5 py-0.5 rounded-full ml-1.5">
                {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
              </span>
            </span>
            <span className="text-[11px] text-ptm-accent2 font-[family-name:var(--font-barlow-condensed)]">
              {totalDeals} total {totalDeals === 1 ? 'deal' : 'deals'}
            </span>
          </div>

          {batches.map((batch) => {
            const mode =
              TICKET_MODES.find((m) => m.value === batch.ticket_mode) ||
              TICKET_MODES[0]
            const sheets = batch.tickets_per_deal
              ? Math.ceil(batch.tickets_per_deal / mode.perSheet)
              : 0
            const revenuePerDeal =
              (batch.tickets_per_deal || 0) * (batch.price || 0)
            const profitPerDeal = revenuePerDeal - (batch.payout || 0)
            const profitPct =
              revenuePerDeal > 0
                ? ((profitPerDeal / revenuePerDeal) * 100).toFixed(1)
                : '0.0'
            const endSerial =
              batch.starting_serial + (batch.deal_count || 1) - 1

            return (
              <div
                key={batch.id}
                className="bg-ptm-bg3 border border-ptm-border rounded-lg p-4 mb-2.5"
              >
                {/* Batch header */}
                <div className="flex justify-between items-center mb-3.5">
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-barlow-condensed)] font-bold text-base text-ptm-accent2">
                      Serials #{formatSerial(batch.starting_serial)}
                      {batch.deal_count > 1 && (
                        <> — #{formatSerial(endSerial)}</>
                      )}
                    </span>
                    <span className="text-[11px] text-ptm-text3 bg-ptm-bg4 px-2 py-0.5 rounded-full">
                      {batch.deal_count}{' '}
                      {batch.deal_count === 1 ? 'deal' : 'deals'}
                    </span>
                  </div>
                  <button
                    className="text-[11px] text-ptm-red bg-ptm-red/10 border border-ptm-red/20 rounded px-2.5 py-1 cursor-pointer hover:bg-ptm-red/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => removeBatch(batch.id)}
                    disabled={batches.length <= 1}
                  >
                    Remove Batch
                  </button>
                </div>

                {/* Serial + Count row */}
                <div className="grid grid-cols-2 gap-3.5 mb-3.5 max-sm:grid-cols-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
                      Starting Serial #
                    </label>
                    <input
                      type="number"
                      className="bg-ptm-bg4 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
                      value={batch.starting_serial || ''}
                      onChange={(e) =>
                        updateBatch(
                          batch.id,
                          'starting_serial',
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="e.g. 1420000"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
                      Number of Deals
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="bg-ptm-bg4 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
                      value={batch.deal_count || ''}
                      onChange={(e) =>
                        updateBatch(
                          batch.id,
                          'deal_count',
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* Game details */}
                <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-ptm-text3 uppercase tracking-wider">
                      Game Name
                    </label>
                    <input
                      className="bg-ptm-bg4 border border-ptm-border text-ptm-text text-sm px-3 py-2 rounded outline-none focus:border-ptm-accent transition-colors placeholder:text-ptm-text3"
                      value={batch.game_name}
                      onChange={(e) =>
                        updateBatch(batch.id, 'game_name', e.target.value)
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
                      value={batch.sku}
                      onChange={(e) =>
                        updateBatch(batch.id, 'sku', e.target.value)
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
                      value={batch.ticket_mode}
                      onChange={(e) =>
                        updateBatch(batch.id, 'ticket_mode', e.target.value)
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
                      value={batch.tickets_per_deal || ''}
                      onChange={(e) =>
                        updateBatch(
                          batch.id,
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
                      value={batch.price || ''}
                      onChange={(e) =>
                        updateBatch(
                          batch.id,
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
                      value={batch.payout || ''}
                      onChange={(e) =>
                        updateBatch(
                          batch.id,
                          'payout',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Calcs */}
                {batch.tickets_per_deal > 0 && batch.price > 0 && (
                  <div className="flex gap-4 mt-3 px-3 py-2.5 bg-ptm-bg4 rounded flex-wrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                        Revenue / Deal
                      </span>
                      <strong className="text-sm font-[family-name:var(--font-barlow-condensed)] font-bold">
                        {currency(revenuePerDeal)}
                      </strong>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                        Profit / Deal
                      </span>
                      <strong
                        className="text-sm font-[family-name:var(--font-barlow-condensed)] font-bold"
                        style={{
                          color:
                            profitPerDeal >= 0 ? '#4ade80' : '#f87171',
                        }}
                      >
                        {currency(profitPerDeal)}
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
                    {batch.deal_count > 1 && (
                      <>
                        <div className="w-px bg-ptm-border2 mx-1" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                            Batch Revenue
                          </span>
                          <strong className="text-sm font-[family-name:var(--font-barlow-condensed)] font-bold">
                            {currency(revenuePerDeal * batch.deal_count)}
                          </strong>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-ptm-text3 uppercase tracking-wider">
                            Batch Profit
                          </span>
                          <strong
                            className="text-sm font-[family-name:var(--font-barlow-condensed)] font-bold"
                            style={{
                              color:
                                profitPerDeal >= 0 ? '#4ade80' : '#f87171',
                            }}
                          >
                            {currency(profitPerDeal * batch.deal_count)}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <button
            className="w-full bg-transparent border-2 border-dashed border-ptm-border text-ptm-text3 font-[family-name:var(--font-barlow-condensed)] font-semibold text-sm uppercase tracking-wide py-2.5 rounded-lg cursor-pointer transition-all hover:border-ptm-accent hover:text-ptm-accent mt-1"
            onClick={addBatch}
          >
            + Add Another Batch
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
            Create Job ({totalDeals} {totalDeals === 1 ? 'deal' : 'deals'})
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
