import React, { useMemo } from 'react'
import MonthlyStatsCharts from './MonthlyStatsCharts'

export default function MonthlyStats({ data }) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group trades by month
    const monthMap = {}
    data.forEach(trade => {
      const date = trade.date || ''
      const month = date.slice(0, 7) // YYYY-MM
      if (!monthMap[month]) {
        monthMap[month] = {
          month,
          trades: [],
        }
      }
      monthMap[month].trades.push(trade)
    })

    // Calculate stats for each month
    return Object.values(monthMap)
      .map(m => {
        const trades = m.trades
        const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
        const winners = trades.filter(t => t.pnl > 0).length
        const winRate = trades.length > 0 ? (winners / trades.length) * 100 : 0
        const avgPnl = trades.length > 0 ? totalPnl / trades.length : 0

        return {
          month: m.month,
          trades: trades.length,
          totalPnl,
          winRate,
          avgPnl,
        }
      })
      .sort((a, b) => b.month.localeCompare(a.month))
  }, [data])

  return (
    <div className="monthly-stats-container">
      <MonthlyStatsCharts stats={stats} />
      
      <div className="monthly-stats-table">
        <h3>Monthly Details</h3>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Trades</th>
              <th>Total P&L</th>
              <th>Win Rate</th>
              <th>Avg P&L/Trade</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={i}>
                <td>{s.month}</td>
                <td>{s.trades}</td>
                <td className={s.totalPnl >= 0 ? 'positive' : 'negative'}>
                  ${s.totalPnl.toFixed(2)}
                </td>
                <td>{s.winRate.toFixed(1)}%</td>
                <td className={s.avgPnl >= 0 ? 'positive' : 'negative'}>
                  ${s.avgPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
