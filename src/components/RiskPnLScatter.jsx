import React, { useMemo } from 'react'
import { Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend)

export default function RiskPnLScatter({ data }) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return []
    return data
      .map(t => ({ x: Number(t.entry), y: Number(t.pnl) }))
      .filter(p => !Number.isNaN(p.x) && !Number.isNaN(p.y))
  }, [data])

  if (!points.length) {
    return <div className="no-data">No entry/PnL data available</div>
  }

  const chartData = {
    datasets: [
      {
        label: 'Entry vs PnL',
        data: points,
        backgroundColor: 'rgba(56,189,248,0.6)',
        borderColor: 'rgba(56,189,248,1)',
        pointRadius: 4,
      },
    ],
  }

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Entry (Risk Proxy)',
        },
      },
      y: {
        grid: {
          color: context => (context.tick && context.tick.value === 0 ? 'rgba(248,113,113,0.7)' : 'rgba(15,23,42,0.6)'),
          lineWidth: context => (context.tick && context.tick.value === 0 ? 2 : 1),
        },
        title: {
          display: true,
          text: 'PnL',
        },
      },
    },
  }

  return <Scatter data={chartData} options={options} />
}
