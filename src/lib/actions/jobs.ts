'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Stage, DealStatus } from '@/types/database'
import { STAGES } from '@/lib/constants'

type BatchInput = {
  game_name: string
  sku: string
  ticket_mode: string
  tickets_per_deal: number
  price: number
  payout: number
  starting_serial: number
  deal_count: number
}

export async function createJob(formData: {
  customer: string
  due_date: string
  notes: string
  batches: BatchInput[]
}) {
  const supabase = await createClient()

  if (!formData.customer.trim()) {
    return { error: 'Customer name is required' }
  }

  if (formData.batches.some(b => !b.game_name.trim())) {
    return { error: 'All batches need a game name' }
  }

  if (formData.batches.some(b => b.deal_count < 1)) {
    return { error: 'Each batch needs at least 1 deal' }
  }

  if (formData.batches.some(b => b.starting_serial < 1)) {
    return { error: 'Starting serial must be at least 1' }
  }

  // Generate job number
  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  const jobNumber = `JOB-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  // Create the job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      job_number: jobNumber,
      customer: formData.customer.trim(),
      due_date: formData.due_date || null,
      notes: formData.notes || null,
      stage: 'Art',
    })
    .select('id')
    .single()

  if (jobError || !job) {
    return { error: jobError?.message || 'Failed to create job' }
  }

  // Expand batches into individual deals
  const deals: {
    job_id: string
    serial: number
    game_name: string
    sku: string | null
    ticket_mode: string
    tickets_per_deal: number
    price: number
    payout: number
  }[] = []

  for (const batch of formData.batches) {
    for (let i = 0; i < batch.deal_count; i++) {
      deals.push({
        job_id: job.id,
        serial: batch.starting_serial + i,
        game_name: batch.game_name.trim(),
        sku: batch.sku || null,
        ticket_mode: batch.ticket_mode || '5w',
        tickets_per_deal: batch.tickets_per_deal || 0,
        price: batch.price || 0,
        payout: batch.payout || 0,
      })
    }
  }

  const { error: dealsError } = await supabase
    .from('deals')
    .insert(deals)

  if (dealsError) {
    // Clean up the job if deals failed
    await supabase.from('jobs').delete().eq('id', job.id)
    return { error: dealsError.message }
  }

  // Update next_serial to the highest serial + 1
  const maxSerial = Math.max(...deals.map(d => d.serial))
  await supabase
    .from('app_settings')
    .update({ value: String(maxSerial + 1) })
    .eq('key', 'next_serial')

  revalidatePath('/')
  redirect('/')
}

export async function updateJobStage(jobId: string, stage: Stage) {
  if (!STAGES.includes(stage)) {
    return { error: 'Invalid stage' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('jobs')
    .update({ stage })
    .eq('id', jobId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
}

export async function updateDealStatuses(
  updates: { id: string; status: DealStatus }[]
) {
  const supabase = await createClient()

  const validStatuses: DealStatus[] = ['active', 'lost_gluer', 'lost_die_cut']
  if (updates.some(u => !validStatuses.includes(u.status))) {
    return { error: 'Invalid deal status' }
  }

  // Update each deal's status
  for (const update of updates) {
    const { error } = await supabase
      .from('deals')
      .update({ status: update.status })
      .eq('id', update.id)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/')
}
