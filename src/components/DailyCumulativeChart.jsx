import React from 'react'
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
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function DailyCumulativeChart({ data }) {
  const labels = data.map(d => {
    const parsed = new Date(d.date)
    if (Number.isNaN(parsed.getTime())) return d.date
    return String(parsed.getDate()).padStart(2, '0')
  })
  const values = data.map(d => d.cumulativePnl)
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Cumulative P&L',
        data: values,
        borderColor: 'rgba(56,189,248,1)',
        backgroundColor: 'rgba(56,189,248,0.2)',
        fill: true,
        tension: 0.25,
      },
    ],
  }

  return <Line data={chartData} />
}
