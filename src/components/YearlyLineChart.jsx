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

export default function YearlyLineChart({ data }) {
  const labels = data.map(d => {
    if (d.month) {
      const date = new Date(`${d.month}-01`)
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      }
      return d.month
    }
    return String(d.year)
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
      },
    ],
  }

  return <Line data={chartData} />
}
