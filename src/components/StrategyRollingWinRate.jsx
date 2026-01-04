import React, { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function StrategyRollingWinRate({ data, windowSize = 10 }) {
  const isNarrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    const strategyMap = {}
    data.forEach(trade => {
      const strategy = (trade.strategy || 'Unknown').trim()
      if (!strategyMap[strategy]) strategyMap[strategy] = []
      strategyMap[strategy].push(trade)
    })

    const strategySeries = Object.entries(strategyMap).map(([strategy, trades]) => {
      const ordered = trades
        .slice()
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

      const winRates = ordered.map((trade, index) => {
        const start = Math.max(0, index - windowSize + 1)
        const windowTrades = ordered.slice(start, index + 1)
        const wins = windowTrades.filter(t => (t.pnl || 0) > 0).length
        return (wins / windowTrades.length) * 100
      })

      return { strategy, winRates }
    })

    const maxLen = Math.max(...strategySeries.map(s => s.winRates.length), 0)
    const labels = Array.from({ length: maxLen }, (_, i) => `Trade ${i + 1}`)

    const palette = [
      'rgba(59,130,246,1)',
      'rgba(34,197,94,1)',
      'rgba(245,158,11,1)',
      'rgba(239,68,68,1)',
      'rgba(139,92,246,1)',
      'rgba(14,165,233,1)',
      'rgba(234,179,8,1)',
    ]

    const datasets = strategySeries.map((series, idx) => {
      const color = palette[idx % palette.length]
      const padded = Array.from({ length: maxLen }, (_, i) => series.winRates[i] ?? null)
      return {
        label: series.strategy,
        data: padded,
        borderColor: color,
        backgroundColor: color.replace('1)', '0.2)'),
        fill: false,
        tension: 0.25,
        pointRadius: isNarrow ? 2 : 3,
        pointHoverRadius: isNarrow ? 4 : 5,
        spanGaps: true,
      }
    })

    return { labels, datasets }
  }, [data, windowSize, isNarrow])

  if (!chartData) {
    return <div className="no-data">No data available for rolling win rate</div>
  }

  const options = {
    responsive: true,
    maintainAspectRatio: !isNarrow,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#e6eef8',
          padding: isNarrow ? 10 : 15,
          font: { size: isNarrow ? 10 : 12 },
          boxWidth: isNarrow ? 16 : 24,
        },
      },
      tooltip: {
        callbacks: {
          label: context => `${context.parsed.y.toFixed(1)}%`,
        },
      },
    },
    scales: {
      y: {
        max: 100,
        ticks: {
          callback: value => `${value}%`,
          color: '#9ca3af',
        },
        grid: {
          color: '#1e293b',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: isNarrow ? 6 : 12,
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="strategy-rolling-winrate">
      <h3>Rolling Win Rate by Strategy (last {windowSize} trades)</h3>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
