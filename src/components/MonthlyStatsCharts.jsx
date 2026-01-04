import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function MonthlyStatsCharts({ stats }) {
  const sortedStats = useMemo(() => {
    if (!stats) return []
    return stats.slice().sort((a, b) => a.month.localeCompare(b.month))
  }, [stats])

  const formatMonth = month => {
    if (!month) return ''
    const d = new Date(`${month}-01`)
    if (Number.isNaN(d.getTime())) return month
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  const pnlChart = useMemo(() => {
    if (!sortedStats.length) return null

    const labels = sortedStats.map(s => formatMonth(s.month))
    const pnlValues = sortedStats.map(s => s.totalPnl)
    
    return {
      labels,
      datasets: [
        {
          label: 'Monthly P&L',
          data: pnlValues,
          backgroundColor: pnlValues.map(v => (v >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(255,107,107,0.6)')),
          borderColor: pnlValues.map(v => (v >= 0 ? 'rgba(34,197,94,1)' : 'rgba(255,107,107,1)')),
          borderWidth: 1,
        },
      ],
    }
  }, [sortedStats])

  const winRateChart = useMemo(() => {
    if (!sortedStats.length) return null

    const labels = sortedStats.map(s => formatMonth(s.month))
    const winRates = sortedStats.map(s => s.winRate)
    
    return {
      labels,
      datasets: [
        {
          label: 'Win Rate (%)',
          data: winRates,
          backgroundColor: 'rgba(59,130,246,0.6)',
          borderColor: 'rgba(59,130,246,1)',
          borderWidth: 1,
        },
      ],
    }
  }, [sortedStats])

  if (!pnlChart || !winRateChart) {
    return <div className="no-data">No monthly data available</div>
  }

  return (
    <div className="monthly-charts">
      <div className="chart-card">
        <h3>Monthly P&L</h3>
        <Bar
          data={pnlChart}
          options={{
            maintainAspectRatio: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: context => {
                    const s = sortedStats[context.dataIndex]
                    if (!s) return ''
                    return [
                      `P&L: $${context.parsed.y.toFixed(2)}`,
                      `Trades: ${s.trades}`,
                      `Win rate: ${s.winRate.toFixed(1)}%`,
                    ]
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className="chart-card">
        <h3>Monthly Win Rate</h3>
        <Bar
          data={winRateChart}
          options={{
            maintainAspectRatio: true,
            scales: { y: { max: 100 } },
            plugins: {
              tooltip: {
                callbacks: {
                  label: context => {
                    const s = sortedStats[context.dataIndex]
                    if (!s) return ''
                    return [
                      `Win rate: ${context.parsed.y.toFixed(1)}%`,
                      `Trades: ${s.trades}`,
                      `P&L: $${s.totalPnl.toFixed(2)}`,
                    ]
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}
