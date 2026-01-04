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

export default function StrategyStatsCharts({ stats }) {
  const pnlChart = useMemo(() => {
    if (!stats || stats.length === 0) return null

    const labels = stats.map(s => s.strategy)
    const pnlValues = stats.map(s => s.totalPnl)
    
    return {
      labels,
      datasets: [
        {
          label: 'Total P&L',
          data: pnlValues,
          backgroundColor: pnlValues.map(v => (v >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(255,107,107,0.6)')),
          borderColor: pnlValues.map(v => (v >= 0 ? 'rgba(34,197,94,1)' : 'rgba(255,107,107,1)')),
          borderWidth: 1,
        },
      ],
    }
  }, [stats])

  const winRateChart = useMemo(() => {
    if (!stats || stats.length === 0) return null

    const labels = stats.map(s => s.strategy)
    const winRates = stats.map(s => s.winRate)
    
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
  }, [stats])

  const roiChart = useMemo(() => {
    if (!stats || stats.length === 0) return null

    const labels = stats.map(s => s.strategy)
    const roiValues = stats.map(s => (s.avgRoi !== undefined ? s.avgRoi : null))

    return {
      labels,
      datasets: [
        {
          label: 'Avg ROI (%)',
          data: roiValues,
          backgroundColor: 'rgba(16,185,129,0.6)',
          borderColor: 'rgba(16,185,129,1)',
          borderWidth: 1,
        },
      ],
    }
  }, [stats])

  if (!pnlChart || !winRateChart || !roiChart) {
    return <div className="no-data">No strategy data available</div>
  }

  return (
    <div className="strategy-charts">
      <div className="chart-card">
        <h3>Total P&L by Strategy</h3>
        <Bar
          data={pnlChart}
          options={{
            indexAxis: 'y',
            maintainAspectRatio: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: context => {
                    const s = stats[context.dataIndex]
                    if (!s) return ''
                    return [`$${context.parsed.x.toFixed(2)}`, `Trades: ${s.trades}`]
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className="chart-card">
        <h3>Win Rate by Strategy</h3>
        <Bar
          data={winRateChart}
          options={{
            indexAxis: 'y',
            maintainAspectRatio: true,
            scales: { x: { max: 100 } },
            plugins: {
              tooltip: {
                callbacks: {
                  label: context => {
                    const s = stats[context.dataIndex]
                    if (!s) return ''
                    return [`${context.parsed.x.toFixed(1)}%`, `Trades: ${s.trades}`]
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className="chart-card">
        <h3>Average ROI by Strategy</h3>
        <Bar
          data={roiChart}
          options={{
            indexAxis: 'y',
            maintainAspectRatio: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: context => {
                    const s = stats[context.dataIndex]
                    if (!s || s.avgRoi === undefined) return 'No ROI data'
                    return [`${context.parsed.x.toFixed(2)}%`, `ROI samples: ${s.roiSamples}`]
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
