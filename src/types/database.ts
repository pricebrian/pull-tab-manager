export type Job = {
  id: string
  job_number: string
  customer: string
  due_date: string | null
  notes: string | null
  stage: Stage
  created_at: string
  updated_at: string
  deals?: Deal[]
}

export type Deal = {
  id: string
  job_id: string
  serial: number
  game_name: string
  sku: string | null
  ticket_mode: '5w' | '3w'
  tickets_per_deal: number
  price: number
  payout: number
  sheets_in: number
  glue_damage: number
  cut_damage: number
  created_at: string
}

export type Stage =
  | 'Art'
  | 'Imposing'
  | 'Printing'
  | 'Gluing'
  | 'Die Cut'
  | 'Packing'
  | 'Shipped'

export type AppSettings = {
  key: string
  value: string
}
