import React, { useMemo, useEffect, useState } from 'react'
import sampleData from './data/sample_data.json'
import { aggregateMonthly, aggregateMonthlyCumulative, aggregateDailyCumulative, computeKPIs } from './utils/aggregations'
import MonthlyBarChart from './components/MonthlyBarChart'
import YearlyLineChart from './components/YearlyLineChart'
import StrategyStats from './components/StrategyStats'
import DailyCumulativeChart from './components/DailyCumulativeChart'
import RiskPnLScatter from './components/RiskPnLScatter'

const SHEET_ID = import.meta.env.VITE_SHEET_ID || ''
const SHEET_GID = import.meta.env.VITE_SHEET_GID || '0' 

export default function App() {
  const [rows, setRows] = useState(sampleData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [scope, setScope] = useState('all')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedTicker, setSelectedTicker] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    // Prefer VITE_SHEET_ID if set, fallback to local CSV in /docs
    if (SHEET_ID) {
      import('./utils/fetchSheet')
        .then(m => m.fetchSheetAsJson(SHEET_ID, SHEET_GID))
        .then(data => {
          if (cancelled) return
          console.log('Loaded from Google Sheet:', data.slice(0, 3))
          setRows(data)
          setLoading(false)
        })
        .catch(err => {
          // fallback to local CSV
          import('./utils/loadCsv')
            .then(m => m.loadLocalCsv())
            .then(data => {
              if (cancelled) return
              setRows(data)
              setLoading(false)
            })
            .catch(err2 => {
              if (cancelled) return
              console.error('Failed to load data from sheet or CSV', err2)
              setError(err2.message)
              setLoading(false)
            })
        })
    } else {
      // No sheet ID, try local CSV
      import('./utils/loadCsv')
        .then(m => m.loadLocalCsv())
        .then(data => {
          if (cancelled) return
          setRows(data)
          setLoading(false)
        })
        .catch(err => {
          if (cancelled) return
          console.error('Failed to load CSV', err)
          setError(err.message)
          setLoading(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [])

  const years = useMemo(() => {
    if (!rows || rows.length === 0) return []
    const allYears = rows
      .map(t => t.date?.slice(0, 4))
      .filter(Boolean)
    return [...new Set(allYears)].sort()
  }, [rows])

  const monthsForYear = useMemo(() => {
    if (!rows || rows.length === 0 || !selectedYear) return []
    const months = rows
      .map(t => t.date?.slice(0, 7))
      .filter(m => m && m.startsWith(selectedYear))
    return [...new Set(months)].sort().reverse()
  }, [rows, selectedYear])

  const daysForMonth = useMemo(() => {
    if (!rows || rows.length === 0 || !selectedMonth) return []
    const days = rows
      .map(t => t.date)
      .filter(d => d && d.startsWith(selectedMonth))
    return [...new Set(days)].sort()
  }, [rows, selectedMonth])

  const daysForMonthSet = useMemo(() => new Set(daysForMonth), [daysForMonth])

  const yearPnlMap = useMemo(() => {
    const map = {}
    rows.forEach(t => {
      const year = t.date?.slice(0, 4)
      if (!year) return
      map[year] = (map[year] || 0) + (t.pnl || 0)
    })
    return map
  }, [rows])

  const monthPnlMap = useMemo(() => {
    const map = {}
    rows.forEach(t => {
      const month = t.date?.slice(0, 7)
      if (!month) return
      map[month] = (map[month] || 0) + (t.pnl || 0)
    })
    return map
  }, [rows])

  const dayPnlMap = useMemo(() => {
    const map = {}
    rows.forEach(t => {
      const day = t.date
      if (!day) return
      map[day] = (map[day] || 0) + (t.pnl || 0)
    })
    return map
  }, [rows])

  const dayGrid = useMemo(() => {
    if (!selectedMonth) return []
    const parts = selectedMonth.split('-')
    if (parts.length !== 2) return []
    const year = Number(parts[0])
    const monthIndex = Number(parts[1]) - 1
    if (Number.isNaN(year) || Number.isNaN(monthIndex)) return []
    const first = new Date(year, monthIndex, 1)
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const startOffset = (first.getDay() + 6) % 7
    const grid = []

    for (let i = 0; i < startOffset; i += 1) {
      grid.push({ key: `pad-${i}`, empty: true })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayStr = String(day).padStart(2, '0')
      const date = `${parts[0]}-${parts[1]}-${dayStr}`
      const pnl = dayPnlMap[date] || 0
      const available = daysForMonthSet.has(date)
      grid.push({ key: date, date, pnl, available })
    }

    const pad = (7 - (grid.length % 7)) % 7
    for (let i = 0; i < pad; i += 1) {
      grid.push({ key: `pad-end-${i}`, empty: true })
    }

    return grid
  }, [selectedMonth, dayPnlMap, daysForMonthSet])

  useEffect(() => {
    if (years.length === 0) return
    if (!selectedYear || !years.includes(selectedYear)) {
      setSelectedYear(years[years.length - 1])
    }
  }, [years, selectedYear])

  useEffect(() => {
    if (monthsForYear.length === 0) return
    if (!selectedMonth || !monthsForYear.includes(selectedMonth)) {
      setSelectedMonth(monthsForYear[0])
    }
  }, [monthsForYear, selectedMonth])

  useEffect(() => {
    if (daysForMonth.length === 0) return
    if (!selectedDay || !daysForMonth.includes(selectedDay)) {
      setSelectedDay(daysForMonth[0])
    }
  }, [daysForMonth, selectedDay])

  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return []
    if (scope === 'year' && selectedYear) {
      return rows.filter(t => t.date?.startsWith(selectedYear))
    }
    if (scope === 'month' && selectedMonth) {
      return rows.filter(t => t.date?.slice(0, 7) === selectedMonth)
    }
    if (scope === 'day' && selectedDay) {
      return rows.filter(t => t.date === selectedDay)
    }
    return rows
  }, [rows, scope, selectedYear, selectedMonth, selectedDay])

  const filteredTrades = useMemo(() => {
    if (!selectedTicker) return filteredRows
    return filteredRows.filter(t => (t.symbol || '').trim().toUpperCase() === selectedTicker)
  }, [filteredRows, selectedTicker])

  useEffect(() => {
    if (!selectedTicker) return
    const hasTicker = filteredRows.some(t => (t.symbol || '').trim().toUpperCase() === selectedTicker)
    if (!hasTicker) {
      setSelectedTicker('')
    }
  }, [filteredRows, selectedTicker])

  const monthly = useMemo(() => aggregateMonthly(filteredRows), [filteredRows])
  const monthlyCumulative = useMemo(() => aggregateMonthlyCumulative(filteredRows), [filteredRows])
  const dailyCumulative = useMemo(() => aggregateDailyCumulative(filteredRows), [filteredRows])
  const kpis = useMemo(() => computeKPIs(filteredRows), [filteredRows])

  const formatPnl = value => {
    const v = Number(value) || 0
    const sign = v > 0 ? '+' : ''
    return `${sign}$${v.toFixed(0)}`
  }

  const formatDayLabel = value => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    const day = String(d.getDate()).padStart(2, '0')
    return day
  }

  const monthChoices = [
    { key: '01', label: 'Jan' },
    { key: '02', label: 'Feb' },
    { key: '03', label: 'Mar' },
    { key: '04', label: 'Apr' },
    { key: '05', label: 'May' },
    { key: '06', label: 'Jun' },
    { key: '07', label: 'Jul' },
    { key: '08', label: 'Aug' },
    { key: '09', label: 'Sep' },
    { key: '10', label: 'Oct' },
    { key: '11', label: 'Nov' },
    { key: '12', label: 'Dec' },
  ]

  const issueRows = useMemo(() => rows.filter(r => r.issues && r.issues.length), [rows])
  const issueCount = issueRows.length

  const tickerLeaders = useMemo(() => {
    const map = {}
    filteredRows.forEach(t => {
      const symbol = (t.symbol || '').trim().toUpperCase()
      if (!symbol) return
      if (!map[symbol]) {
        map[symbol] = { symbol, trades: 0, totalPnl: 0 }
      }
      map[symbol].trades += 1
      map[symbol].totalPnl += t.pnl || 0
    })

    const list = Object.values(map).sort((a, b) => b.totalPnl - a.totalPnl)
    const positives = list.filter(t => t.totalPnl > 0)
    const negatives = list.filter(t => t.totalPnl < 0)
    return {
      top: positives.slice(0, 5),
      bottom: negatives.slice().sort((a, b) => a.totalPnl - b.totalPnl).slice(0, 5),
    }
  }, [filteredRows])

  return (
    <div className="app">
      <header className="header">
        <h1>DayTrade Dashboard</h1>
        <div className="tabs">
          <button
            className={`tab ${tab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab ${tab === 'strategy-stats' ? 'active' : ''}`}
            onClick={() => setTab('strategy-stats')}
          >
            Strategy Stats
          </button>
        </div>
      </header>

      <section className="premium-banner">
        <div className="premium-banner__content">
          <div className="premium-banner__title">Welcome to DayTrade</div>
          <div className="premium-banner__subtitle">
            Intraday, risk-first playbooks focused on momentum, mean reversion, and precise execution.
          </div>
        </div>
      </section>

      {loading && (
        <div className="notice">Loading data...</div>
      )}

      {error && (
        <div className="notice error">Failed to load data: {error}</div>
      )}

      {issueCount > 0 && (
        <div className="notice warning">Warning: {issueCount} rows contain data issues - see Notes column</div>
      )}

      {tab === 'dashboard' && (
        <>
          <section className="filter-bar">
            <div className="filter-group scope-group">
              <div className="filter-label">Scope</div>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${scope === 'all' ? 'active' : ''}`}
                  onClick={() => setScope('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${scope === 'year' ? 'active' : ''}`}
                  onClick={() => setScope('year')}
                >
                  Year
                </button>
                <button
                  className={`filter-btn ${scope === 'month' ? 'active' : ''}`}
                  onClick={() => setScope('month')}
                >
                  Month
                </button>
                <button
                  className={`filter-btn ${scope === 'day' ? 'active' : ''}`}
                  onClick={() => setScope('day')}
                >
                  Day
                </button>
              </div>
            </div>
            {scope === 'year' && (
              <div className="filter-group">
                <div className="filter-label">Year</div>
                <div className="filter-buttons year-buttons">
                  {years.map(y => (
                    <button
                      key={y}
                      className={`filter-btn year-tile ${selectedYear === y ? 'active' : ''} ${yearPnlMap[y] >= 0 ? 'positive' : 'negative'}`}
                      onClick={() => setSelectedYear(y)}
                    >
                      <span className="year-tile-label">{y}</span>
                      <span className="year-tile-value">{formatPnl(yearPnlMap[y])}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {scope === 'month' && (
              <div className="filter-group month-filter">
                <div className="filter-group">
                  <div className="filter-label">Year</div>
                  <div className="filter-buttons year-buttons">
                    {years.map(y => (
                      <button
                        key={y}
                        className={`filter-btn year-tile ${selectedYear === y ? 'active' : ''} ${yearPnlMap[y] >= 0 ? 'positive' : 'negative'}`}
                        onClick={() => setSelectedYear(y)}
                      >
                        <span className="year-tile-label">{y}</span>
                        <span className="year-tile-value">{formatPnl(yearPnlMap[y])}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-group month-buttons">
                  <div className="month-grid">
                    {monthChoices.map(month => {
                      const monthKey = selectedYear ? `${selectedYear}-${month.key}` : ''
                      const available = monthKey && monthsForYear.includes(monthKey)
                      const monthPnl = available ? monthPnlMap[monthKey] || 0 : 0
                      const monthDate = monthKey ? new Date(monthKey + '-01') : null
                      const monthTitle = monthDate
                        ? monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                        : month.label

                      return (
                        <button
                          key={month.key}
                          className={`month-cell ${selectedMonth === monthKey ? 'active' : ''} ${available ? '' : 'disabled'} ${monthPnl >= 0 ? 'positive' : 'negative'}`}
                          onClick={() => available && setSelectedMonth(monthKey)}
                          disabled={!available}
                          title={monthTitle}
                        >
                          <span className="month-cell-label">{month.label}</span>
                          {available && (
                            <span className="month-cell-value">{formatPnl(monthPnl)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            {scope === 'day' && (
              <div className="filter-group month-filter">
                <div className="filter-group">
                  <div className="filter-label">Year</div>
                  <div className="filter-buttons year-buttons">
                    {years.map(y => (
                      <button
                        key={y}
                        className={`filter-btn year-tile ${selectedYear === y ? 'active' : ''} ${yearPnlMap[y] >= 0 ? 'positive' : 'negative'}`}
                        onClick={() => setSelectedYear(y)}
                      >
                        <span className="year-tile-label">{y}</span>
                        <span className="year-tile-value">{formatPnl(yearPnlMap[y])}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-group month-buttons">
                  <div className="month-grid month-grid--compact">
                    {monthChoices.map(month => {
                      const monthKey = selectedYear ? `${selectedYear}-${month.key}` : ''
                      const available = monthKey && monthsForYear.includes(monthKey)
                      const monthPnl = available ? monthPnlMap[monthKey] || 0 : 0
                      const monthDate = monthKey ? new Date(monthKey + '-01') : null
                      const monthTitle = monthDate
                        ? monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                        : month.label

                      return (
                        <button
                          key={month.key}
                          className={`month-cell ${selectedMonth === monthKey ? 'active' : ''} ${available ? '' : 'disabled'} ${monthPnl >= 0 ? 'positive' : 'negative'}`}
                          onClick={() => available && setSelectedMonth(monthKey)}
                          disabled={!available}
                          title={monthTitle}
                        >
                          <span className="month-cell-label">{month.label}</span>
                          {available && (
                            <span className="month-cell-value">{formatPnl(monthPnl)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="filter-group">
                  <div className="filter-label">Day</div>
                  <div className="month-grid day-grid">
                    {dayGrid.map(item => {
                      if (item.empty) {
                        return <div key={item.key} className="month-cell day-cell empty" />
                      }
                      const dayPnl = item.pnl || 0
                      const day = item.date
                      const isAvailable = item.available
                      return (
                        <button
                          key={item.key}
                          className={`month-cell day-cell ${selectedDay === day ? 'active' : ''} ${isAvailable ? '' : 'disabled'} ${dayPnl >= 0 ? 'positive' : 'negative'}`}
                          onClick={() => isAvailable && setSelectedDay(day)}
                          title={day}
                          disabled={!isAvailable}
                        >
                          <span className="month-cell-label">{formatDayLabel(day)}</span>
                          {isAvailable && (
                            <span className="month-cell-value">{formatPnl(dayPnl)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="kpis">
            <div className="kpi">
              <div className="kpi-label">Total P&L</div>
              <div className="kpi-value">${kpis.totalPnl.toFixed(2)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Trades</div>
              <div className="kpi-value">{kpis.trades}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Win Rate</div>
              <div className="kpi-value">{(kpis.winRate * 100).toFixed(1)}%</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">ROI P25</div>
              <div className="kpi-value">
                {kpis.roiP25 === undefined ? 'N/A' : `${kpis.roiP25.toFixed(2)}%`}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">ROI Median</div>
              <div className="kpi-value">
                {kpis.roiP50 === undefined ? 'N/A' : `${kpis.roiP50.toFixed(2)}%`}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">ROI P75</div>
              <div className="kpi-value">
                {kpis.roiP75 === undefined ? 'N/A' : `${kpis.roiP75.toFixed(2)}%`}
              </div>
            </div>
          </section>

          <section className="chart-card">
            <h3>Risk vs PnL Scatter</h3>
            <div className="chart-container">
              <RiskPnLScatter
                data={filteredRows}
                selectedTicker={selectedTicker}
                onSelectTicker={setSelectedTicker}
              />
            </div>
          </section>

          {scope === 'month' ? (
            <section className="strategy-breakdown">
              <h3>
                Cumulative P&L by Day for{' '}
                {selectedMonth
                  ? new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                  : 'Selected Month'}
              </h3>
              {dailyCumulative.length === 0 ? (
                <div className="no-data">No trades in this month.</div>
              ) : (
                <div className="chart-card">
                  <DailyCumulativeChart data={dailyCumulative} />
                </div>
              )}
            </section>
          ) : scope !== 'day' ? (
            <section className="charts">
              <div className="chart-card">
                <h3>Monthly P&L</h3>
                <MonthlyBarChart data={monthly} />
              </div>
              <div className="chart-card">
                <h3>Cumulative P&L by Month</h3>
                <YearlyLineChart data={monthlyCumulative} />
              </div>
            </section>
          ) : null}

          <section className="trades">
            <div className="trades-header">
              <h3>Trades</h3>
              {selectedTicker && (
                <button
                  type="button"
                  className="ticker-filter-pill"
                  onClick={() => setSelectedTicker('')}
                >
                  {selectedTicker} ✕
                </button>
              )}
            </div>
            <div className="trade-leaders">
              <div className="leader-card">
                <div className="leader-title">Top Tickers by P&amp;L</div>
                {tickerLeaders.top.length === 0 ? (
                  <div className="no-data">No ticker data.</div>
                ) : (
                  <ul className="leader-list">
                    {tickerLeaders.top.map(t => (
                      <li key={t.symbol}>
                        <span
                          className={`leader-symbol ticker-select ${selectedTicker === t.symbol ? 'active' : ''}`}
                          onClick={() => setSelectedTicker(selectedTicker === t.symbol ? '' : t.symbol)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setSelectedTicker(selectedTicker === t.symbol ? '' : t.symbol)
                            }
                          }}
                        >
                          {t.symbol}
                        </span>
                        <span className={`leader-pnl ${t.totalPnl >= 0 ? 'positive' : 'negative'}`}>
                          {formatPnl(t.totalPnl)}
                        </span>
                        <span className="leader-meta">{t.trades} trades</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="leader-card">
                <div className="leader-title">Worst Tickers by P&amp;L</div>
                {tickerLeaders.bottom.length === 0 ? (
                  <div className="no-data">No ticker data.</div>
                ) : (
                  <ul className="leader-list">
                    {tickerLeaders.bottom.map(t => (
                      <li key={t.symbol}>
                        <span
                          className={`leader-symbol ticker-select ${selectedTicker === t.symbol ? 'active' : ''}`}
                          onClick={() => setSelectedTicker(selectedTicker === t.symbol ? '' : t.symbol)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setSelectedTicker(selectedTicker === t.symbol ? '' : t.symbol)
                            }
                          }}
                        >
                          {t.symbol}
                        </span>
                        <span className={`leader-pnl ${t.totalPnl >= 0 ? 'positive' : 'negative'}`}>
                          {formatPnl(t.totalPnl)}
                        </span>
                        <span className="leader-meta">{t.trades} trades</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Exit Date</th>
                  <th>Symbol</th>
                  <th>Strategy</th>
                  <th>P&L</th>
                  <th>ROI</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.slice().reverse().map((t, i) => (
                  <tr key={i}>
                    <td>{t.date}</td>
                    <td>
                      <span
                        className={`ticker-select ${selectedTicker === (t.symbol || '').toUpperCase() ? 'active' : ''}`}
                        onClick={() => {
                          const symbol = (t.symbol || '').trim().toUpperCase()
                          if (!symbol) return
                          setSelectedTicker(selectedTicker === symbol ? '' : symbol)
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            const symbol = (t.symbol || '').trim().toUpperCase()
                            if (!symbol) return
                            setSelectedTicker(selectedTicker === symbol ? '' : symbol)
                          }
                        }}
                      >
                        {(t.symbol || '').toUpperCase()}
                      </span>
                    </td>
                    <td>{t.strategy}</td>
                    <td className={t.pnl >= 0 ? 'positive' : 'negative'}>${(t.pnl || 0).toFixed(2)}</td>
                    <td className={t.roi !== undefined ? (t.roi >= 0 ? 'positive' : 'negative') : ''}>
                      {t.roi !== undefined ? `${t.roi.toFixed(2)}%` : '--'}
                    </td>
                    <td className="notes">{t.issues && t.issues.length ? t.issues.join('; ') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === 'strategy-stats' && (
        <section className="strategy-stats-section">
          <h2>Strategy Performance</h2>
          <StrategyStats data={rows} />
        </section>
      )}
    </div>
  )
}






