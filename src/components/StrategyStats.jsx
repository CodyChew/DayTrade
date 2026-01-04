import React, { useMemo } from 'react'
import StrategyROIChart from './StrategyROIChart'
import StrategyRollingWinRate from './StrategyRollingWinRate'
import RiskPnLScatter from './RiskPnLScatter'

export default function StrategyStats({ data }) {
  const riskPnlCorrelation = useMemo(() => {
    if (!data || data.length === 0) return undefined
    const points = data
      .map(t => ({ x: Number(t.entry), y: Number(t.pnl) }))
      .filter(p => !Number.isNaN(p.x) && !Number.isNaN(p.y))
    if (points.length < 2) return undefined
    const n = points.length
    let sumX = 0
    let sumY = 0
    let sumX2 = 0
    let sumY2 = 0
    let sumXY = 0
    points.forEach(p => {
      sumX += p.x
      sumY += p.y
      sumX2 += p.x * p.x
      sumY2 += p.y * p.y
      sumXY += p.x * p.y
    })
    const numerator = n * sumXY - sumX * sumY
    const denomLeft = n * sumX2 - sumX * sumX
    const denomRight = n * sumY2 - sumY * sumY
    if (denomLeft <= 0 || denomRight <= 0) return undefined
    const denom = Math.sqrt(denomLeft * denomRight)
    return numerator / denom
  }, [data])

  const stats = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group trades by strategy type
    const strategyMap = {}
    data.forEach(trade => {
      const strategy = (trade.strategy || 'Unknown').trim()
      if (!strategyMap[strategy]) {
        strategyMap[strategy] = {
          strategy,
          trades: [],
        }
      }
      strategyMap[strategy].trades.push(trade)
    })

    // Calculate stats for each strategy
    return Object.values(strategyMap)
      .map(s => {
        const trades = s.trades
        const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
        const roiValues = trades
          .map(t => t.roi)
          .filter(v => v !== undefined && !Number.isNaN(v))
        const winners = trades.filter(t => t.pnl > 0).length
        const losers = trades.filter(t => t.pnl < 0).length
        const breakeven = trades.filter(t => t.pnl === 0).length
        const winRate = trades.length > 0 ? (winners / trades.length) * 100 : 0
        const avgPnl = trades.length > 0 ? totalPnl / trades.length : 0
        const maxPnl = Math.max(...trades.map(t => t.pnl || 0))
        const minPnl = Math.min(...trades.map(t => t.pnl || 0))
        const avgRoi =
          roiValues.length > 0 ? roiValues.reduce((sum, v) => sum + v, 0) / roiValues.length : undefined

        return {
          strategy: s.strategy,
          trades: trades.length,
          totalPnl,
          avgRoi,
          roiSamples: roiValues.length,
          winRate,
          avgPnl,
          winners,
          losers,
          breakeven,
          maxPnl,
          minPnl,
        }
      })
      .sort((a, b) => b.totalPnl - a.totalPnl)
  }, [data])

  return (
    <div className="strategy-stats-container">
      <StrategyROIChart data={data} />
      
      <StrategyRollingWinRate data={data} />

      <div className="strategy-metrics">
        <h3>Risk vs PnL Scatter</h3>
        <div className="chart-container">
          <RiskPnLScatter data={data} />
        </div>
      </div>

      <div className="strategy-metrics">
        <h3>Strategy Performance Summary</h3>
        <div className="kpis">
          <div className="kpi">
            <div className="kpi-label">Risk vs PnL Correlation</div>
            <div className="kpi-value">
              {riskPnlCorrelation === undefined ? 'N/A' : riskPnlCorrelation.toFixed(2)}
            </div>
          </div>
        </div>
        {stats.length === 0 ? (
          <div className="no-data">No strategy data available</div>
        ) : (
          <div className="strategy-cards">
            {stats.map((s, i) => (
              <div key={i} className={`strategy-card ${s.totalPnl >= 0 ? 'profitable' : 'losing'}`}>
                <div className="strategy-card-header">
                  <div className="strategy-title">
                    <h4>{s.strategy}</h4>
                  </div>
                  <div className={`strategy-badge ${s.totalPnl >= 0 ? 'positive' : 'negative'}`}>
                    ${s.totalPnl.toFixed(2)}
                  </div>
                </div>
                <div className="strategy-card-stats">
                  <div className="stat-group">
                    <div className="stat-item">
                      <span className="stat-label">Trades</span>
                      <span className="stat-value">{s.trades}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Win Rate</span>
                      <span className="stat-value">{s.winRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="stat-group">
                    <div className="stat-item">
                      <span className="stat-label">Avg ROI</span>
                      <span className={`stat-value ${s.avgRoi !== undefined && s.avgRoi >= 0 ? 'positive' : 'negative'}`}>
                        {s.avgRoi !== undefined ? `${s.avgRoi.toFixed(2)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="stat-item avg">
                      <span className="stat-label">Avg P&L</span>
                      <span className={`stat-value ${s.avgPnl >= 0 ? 'positive' : 'negative'}`}>
                        ${s.avgPnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="stat-group">
                    <div className="stat-item winners">
                      <span className="stat-label">Wins</span>
                      <span className="stat-value">{s.winners}</span>
                    </div>
                    <div className="stat-item losers">
                      <span className="stat-label">Losses</span>
                      <span className="stat-value">{s.losers}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="strategy-stats-table">
        <h3>Strategy Details</h3>
        <table>
          <thead>
            <tr>
              <th>Strategy</th>
              <th>Trades</th>
              <th>Winners</th>
              <th>Losers</th>
              <th>Win Rate</th>
              <th>Total P&L</th>
              <th>Avg P&L</th>
              <th>Avg ROI</th>
              <th>ROI Samples</th>
              <th>Max P&L</th>
              <th>Min P&L</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={i}>
                <td>{s.strategy}</td>
                <td>{s.trades}</td>
                <td className="positive">{s.winners}</td>
                <td className="negative">{s.losers}</td>
                <td>{s.winRate.toFixed(1)}%</td>
                <td className={s.totalPnl >= 0 ? 'positive' : 'negative'}>
                  ${s.totalPnl.toFixed(2)}
                </td>
                <td className={s.avgPnl >= 0 ? 'positive' : 'negative'}>
                  ${s.avgPnl.toFixed(2)}
                </td>
                <td className={s.avgRoi === undefined ? '' : s.avgRoi >= 0 ? 'positive' : 'negative'}>
                  {s.avgRoi !== undefined ? `${s.avgRoi.toFixed(2)}%` : 'N/A'}
                </td>
                <td>{s.roiSamples}</td>
                <td className="positive">${s.maxPnl.toFixed(2)}</td>
                <td className="negative">${s.minPnl.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
