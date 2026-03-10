'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Stage } from '@/types/database'
import { STAGES } from '@/lib/constants'

type DealInput = {
  game_name: string
  sku: string
  ticket_mode: string
  tickets_per_deal: number
  price: number
  payout: number
}

export async function createJob(formData: {
  customer: string
  due_date: string
  notes: string
  deals: DealInput[]
}) {
  const supabase = await createClient()

  if (!formData.customer.trim()) {
    return { error: 'Customer name is required' }
  }

  if (formData.deals.some(d => !d.game_name.trim())) {
    return { error: 'All deals need a game name' }
  }

  // Generate job number
  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  const jobNumber = `JOB-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  // Atomically claim serial numbers
  const { data: serialData, error: serialError } = await supabase
    .rpc('claim_serials', { count: formData.deals.length })

  if (serialError || serialData === null) {
    return { error: 'Failed to assign serial numbers' }
  }

  const startSerial = serialData as number

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

  // Create deals with assigned serials
  const deals = formData.deals.map((d, i) => ({
    job_id: job.id,
    serial: startSerial + i,
    game_name: d.game_name.trim(),
    sku: d.sku || null,
    ticket_mode: d.ticket_mode || '5w',
    tickets_per_deal: d.tickets_per_deal || 0,
    price: d.price || 0,
    payout: d.payout || 0,
  }))

  const { error: dealsError } = await supabase
    .from('deals')
    .insert(deals)

  if (dealsError) {
    // Clean up the job if deals failed
    await supabase.from('jobs').delete().eq('id', job.id)
    return { error: dealsError.message }
  }

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

export async function updateProductionData(
  dealId: string,
  data: { sheets_in: number; glue_damage: number; cut_damage: number }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('deals')
    .update({
      sheets_in: data.sheets_in,
      glue_damage: data.glue_damage,
      cut_damage: data.cut_damage,
    })
    .eq('id', dealId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
}
