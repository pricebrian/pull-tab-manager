interface StatsBarProps {
  total: number
  active: number
  shipped: number
  totalDeals: number
}

export function StatsBar({ total, active, shipped, totalDeals }: StatsBarProps) {
  const stats = [
    { label: 'Total Jobs', value: total },
    { label: 'Active', value: active },
    { label: 'Shipped', value: shipped },
    { label: 'Total Deals', value: totalDeals },
  ]

  return (
    <div className="no-print flex gap-2 px-7 py-3 border-b border-ptm-border">
      {stats.map((s) => (
        <div
          key={s.label}
          className="text-xs text-ptm-text2 bg-ptm-bg3 px-3 py-1 rounded-full border border-ptm-border"
        >
          <b className="text-ptm-text">{s.value}</b> {s.label}
        </div>
      ))}
    </div>
  )
}
