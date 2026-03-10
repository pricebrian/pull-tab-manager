import { createClient } from '@/lib/supabase/server'
import type { Job } from '@/types/database'

export async function getJobs(): Promise<Job[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('jobs')
    .select('*, deals(*)')
    .order('created_at', { ascending: false })

  return (data as Job[]) || []
}

export async function getJob(id: string): Promise<Job | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('jobs')
    .select('*, deals(*)')
    .eq('id', id)
    .single()

  return data as Job | null
}

export async function getNextSerial(): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'next_serial')
    .single()

  return data ? parseInt(data.value) : 1
}

export async function getJobStats() {
  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('jobs')
    .select('stage, deals(id)')

  if (!jobs) return { total: 0, active: 0, shipped: 0, totalDeals: 0 }

  const total = jobs.length
  const shipped = jobs.filter(j => j.stage === 'Shipped').length
  const active = total - shipped
  const totalDeals = jobs.reduce(
    (sum, j) => sum + (Array.isArray(j.deals) ? j.deals.length : 0),
    0
  )

  return { total, active, shipped, totalDeals }
}
