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

const STRATEGY_COLORS = {
  'Bear Call': '#3b82f6',
  'Bull Put': '#22c55e',
  'Iron Condor': '#f59e0b',
  'Unknown': '#9ca3af',
}

export default function StrategyROIChart({ data }) {
  const isNarrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    // Group by month and strategy
    const monthStrategyMap = {}
    data.forEach(trade => {
      const date = trade.date || ''
      const month = date.slice(0, 7) // YYYY-MM
      const strategy = (trade.strategy || 'Unknown').trim()

      if (!monthStrategyMap[month]) {
        monthStrategyMap[month] = {}
      }
      if (!monthStrategyMap[month][strategy]) {
        monthStrategyMap[month][strategy] = { pnl: 0, count: 0 }
      }

      monthStrategyMap[month][strategy].pnl += trade.pnl || 0
      monthStrategyMap[month][strategy].count += 1
    })

    // Get sorted months
    const months = Object.keys(monthStrategyMap).sort()
    
    // Get all unique strategies
    const strategies = [...new Set(data.map(t => (t.strategy || 'Unknown').trim()))]
    
    // Calculate cumulative P&L for each strategy by month
    const cumulativeByStrategy = {}
    strategies.forEach(strategy => {
      cumulativeByStrategy[strategy] = []
      let cumulative = 0
      months.forEach(month => {
        if (monthStrategyMap[month][strategy]) {
          cumulative += monthStrategyMap[month][strategy].pnl
        }
        cumulativeByStrategy[strategy].push(cumulative)
      })
    })

    // Build chart dataset
    const datasets = strategies.map(strategy => {
      const color = STRATEGY_COLORS[strategy] || STRATEGY_COLORS['Unknown']
      return {
        label: strategy,
        data: cumulativeByStrategy[strategy],
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: isNarrow ? 2 : 4,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: isNarrow ? 1 : 2,
        pointHoverRadius: isNarrow ? 4 : 6,
      }
    })

    return {
      labels: months.map(m => new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })),
      datasets,
    }
  }, [data, isNarrow])

  if (!chartData || chartData.datasets.length === 0) {
    return <div className="no-data">No data available for ROI chart</div>
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
        backgroundColor: '#0f1724',
        titleColor: '#e6eef8',
        bodyColor: '#e6eef8',
        borderColor: '#1e293b',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`
          },
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: '#1e293b',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          callback: (value) => `$${value.toFixed(0)}`,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: isNarrow ? 6 : 12,
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
  }

  return (
    <div className="strategy-roi-chart">
      <h3>Cumulative P&L by Strategy Over Time</h3>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
