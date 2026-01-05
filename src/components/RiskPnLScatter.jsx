import React, { useMemo, useState, useCallback } from 'react'
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

export default function RiskPnLScatter({ data, selectedTicker, onSelectTicker }) {
  const [hoveredTicker, setHoveredTicker] = useState('')

  const points = useMemo(() => {
    if (!data || data.length === 0) return []
    return data
      .map(t => ({
        x: Number(t.entry),
        y: Number(t.pnl),
        ticker: (t.symbol || '').toString().trim().toUpperCase(),
      }))
      .filter(p => !Number.isNaN(p.x) && !Number.isNaN(p.y))
  }, [data])

  const handleHover = useCallback((event, elements) => {
    if (event?.native?.target) {
      event.native.target.style.cursor = elements && elements.length ? 'pointer' : 'default'
    }
    if (!elements || elements.length === 0) {
      setHoveredTicker('')
      return
    }
    const element = elements[0]
    const raw = element?.element?.$context?.raw
    const nextTicker = raw?.ticker || ''
    setHoveredTicker(nextTicker)
  }, [])

  const handleClick = useCallback((event, elements) => {
    if (!onSelectTicker) return
    if (!elements || elements.length === 0) {
      onSelectTicker('')
      return
    }
    const element = elements[0]
    const raw = element?.element?.$context?.raw
    const nextTicker = raw?.ticker || ''
    onSelectTicker(nextTicker === selectedTicker ? '' : nextTicker)
  }, [onSelectTicker, selectedTicker])

  if (!points.length) {
    return <div className="no-data">No entry/PnL data available</div>
  }

  const chartData = {
    datasets: [
      {
        label: 'Entry vs PnL',
        data: points,
        backgroundColor: context => {
          const ticker = context.raw?.ticker || ''
          if (selectedTicker) {
            return ticker === selectedTicker ? 'rgba(34,197,94,0.9)' : 'rgba(148,163,184,0.2)'
          }
          if (!hoveredTicker) return 'rgba(56,189,248,0.6)'
          return ticker === hoveredTicker ? 'rgba(34,197,94,0.9)' : 'rgba(148,163,184,0.25)'
        },
        borderColor: context => {
          const ticker = context.raw?.ticker || ''
          if (selectedTicker) {
            return ticker === selectedTicker ? 'rgba(34,197,94,1)' : 'rgba(148,163,184,0.3)'
          }
          if (!hoveredTicker) return 'rgba(56,189,248,1)'
          return ticker === hoveredTicker ? 'rgba(34,197,94,1)' : 'rgba(148,163,184,0.35)'
        },
        pointRadius: context => {
          const ticker = context.raw?.ticker || ''
          if (selectedTicker) return ticker === selectedTicker ? 6 : 3
          if (!hoveredTicker) return 4
          return ticker === hoveredTicker ? 6 : 3
        },
      },
    ],
  }

  const options = {
    onHover: handleHover,
    onClick: handleClick,
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
    plugins: {
      tooltip: {
        callbacks: {
          label: context => {
            const ticker = context.raw?.ticker || 'N/A'
            const x = context.raw?.x
            const y = context.raw?.y
            return `${ticker} - Entry: ${x}, PnL: ${y}`
          },
        },
      },
    },
  }

  return <Scatter data={chartData} options={options} />
}
