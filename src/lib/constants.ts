import type { Stage } from '@/types/database'

export const STAGES: Stage[] = [
  'Art',
  'Imposing',
  'Printing',
  'Gluing',
  'Die Cut',
  'Packing',
  'Shipped',
]

export const TICKET_MODES = [
  { label: '5-Window (70/sheet)', value: '5w' as const, perSheet: 70 },
  { label: '3-Window (100/sheet)', value: '3w' as const, perSheet: 100 },
]
