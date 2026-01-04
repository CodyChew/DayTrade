export function aggregateMonthly(trades) {
  // returns [{month: '2024-01', pnl: 100, trades: 2}, ...]
  const map = {}
  trades.forEach(t => {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map[key]) map[key] = { month: key, pnl: 0, trades: 0 }
    map[key].pnl += t.pnl
    map[key].trades += 1
  })
  return Object.values(map).sort((a,b)=>a.month.localeCompare(b.month))
}

export function aggregateYearly(trades) {
  // returns [{year: 2023, cumulativePnl: 50}, ...]
  const map = {}
  trades.forEach(t => {
    const d = new Date(t.date)
    const key = d.getFullYear()
    if (!map[key]) map[key] = { year: key, pnl: 0 }
    map[key].pnl += t.pnl
  })
  const years = Object.values(map).sort((a,b)=>a.year - b.year)
  // cumulative
  let cum = 0
  return years.map(y => {
    cum += y.pnl
    return { year: y.year, cumulativePnl: cum }
  })
}

export function aggregateMonthlyCumulative(trades) {
  // returns [{month: '2024-01', cumulativePnl: 100}, ...]
  const map = {}
  trades.forEach(t => {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map[key]) map[key] = { month: key, pnl: 0 }
    map[key].pnl += t.pnl || 0
  })
  const months = Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  let cum = 0
  return months.map(m => {
    cum += m.pnl
    return { month: m.month, cumulativePnl: cum }
  })
}

export function aggregateDailyCumulative(trades) {
  // returns [{date: '2024-01-05', cumulativePnl: 100}, ...]
  const map = {}
  trades.forEach(t => {
    if (!t.date) return
    if (!map[t.date]) map[t.date] = { date: t.date, pnl: 0 }
    map[t.date].pnl += t.pnl || 0
  })
  const days = Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  let cum = 0
  return days.map(d => {
    cum += d.pnl
    return { date: d.date, cumulativePnl: cum }
  })
}

export function computeKPIs(trades) {
  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0)
  const tradesCount = trades.length
  const wins = trades.filter(t=>t.pnl>0).length
  const winRate = tradesCount===0?0:wins/tradesCount
  const roiValues = trades
    .map(t => t.roi)
    .filter(v => v !== undefined && !Number.isNaN(v))
    .sort((a, b) => a - b)

  const percentile = p => {
    if (!roiValues.length) return undefined
    if (roiValues.length === 1) return roiValues[0]
    const idx = (roiValues.length - 1) * p
    const lower = Math.floor(idx)
    const upper = Math.ceil(idx)
    if (lower === upper) return roiValues[lower]
    const weight = idx - lower
    return roiValues[lower] * (1 - weight) + roiValues[upper] * weight
  }

  return {
    totalPnl,
    trades: tradesCount,
    winRate,
    roiP25: percentile(0.25),
    roiP50: percentile(0.5),
    roiP75: percentile(0.75),
  }
}
