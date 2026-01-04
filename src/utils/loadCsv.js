import Papa from 'papaparse'

const CANDIDATES = [
  '/docs/DayTrade Strategy.csv',
  '/docs/DayTrade%20Strategy.csv',
]

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(cell => (cell || '').toString().trim().toLowerCase())
    if (row.includes('date placed') || row.includes('date placed'.toLowerCase()) || row.includes('date')) {
      // very likely the header
      return i
    }
    if (row.includes('ticker') && row.includes('p&l')) return i
  }
  return -1
}

function normalizeRow(rawRow, headerMap) {
  const obj = {}
  for (const key in headerMap) {
    obj[key] = rawRow[headerMap[key]] !== undefined ? rawRow[headerMap[key]] : ''
  }

  // Map to app fields - use Date as primary date
  const mapped = {
    date: obj['Date'] || obj['date'] || '',
    symbol: obj['Ticker'] || obj['ticker'] || '',
    entry: obj['Entry'] !== undefined ? Number(obj['Entry']) : undefined,
    exit: obj['Exit'] !== undefined ? Number(obj['Exit']) : undefined,
    pnl: obj['PnL'] !== undefined ? Number(obj['PnL']) : obj['P&L'] !== undefined ? Number(obj['P&L']) : undefined,
    roi: obj['% Return'] !== undefined ? Number(String(obj['% Return']).replace('%', '')) : undefined,
    cumPnlDay: obj['Cum PnL (Day)'] !== undefined ? Number(obj['Cum PnL (Day)']) : undefined,
    notes: obj['Notes'] || obj['notes'] || '',
    raw: obj,
  }

  // basic data-quality checks and compute ROI when possible
  const issues = []
  if (mapped.pnl === undefined || Number.isNaN(mapped.pnl)) issues.push('Missing PnL')
  if (mapped.roi !== undefined && Number.isNaN(mapped.roi)) issues.push('Invalid % Return')

  if (mapped.roi === undefined && issues.length === 0) {
    mapped.roi = undefined
  }

  mapped.issues = issues

  // Parse exit date to YYYY-MM-DD
  if (mapped.date) {
    const parsed = new Date(mapped.date)
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear()
      const m = String(parsed.getMonth() + 1).padStart(2, '0')
      const d = String(parsed.getDate()).padStart(2, '0')
      mapped.date = `${y}-${m}-${d}`
    }
  }

  return mapped
}

export async function loadLocalCsv() {
  // Try known candidate paths
  for (const path of CANDIDATES) {
    try {
      const res = await fetch(path)
      if (!res.ok) continue
      const text = await res.text()
      const parsed = Papa.parse(text, { skipEmptyLines: true, dynamicTyping: false })
      const rows = parsed.data

      if (!rows || !rows.length) throw new Error('Empty CSV')

      const headerIdx = findHeaderRow(rows)
      if (headerIdx === -1) {
        // fallback to first non-empty row as header
        if (rows.length < 2) throw new Error('No header row found')
        const headerRow = rows[0]
        const headers = headerRow.map(h => (h || '').toString().trim())
        const headerMap = {}
        headers.forEach((h, i) => (headerMap[h] = i))
        const dataRows = rows.slice(1)
        return dataRows.map(r => normalizeRow(r, headerMap)).filter(r => (r.symbol || r.date))
      }

      const headerRow = rows[headerIdx]
      const headers = headerRow.map(h => (h || '').toString().trim())
      const headerMap = {}
      headers.forEach((h, i) => (headerMap[h] = i))
      const dataRows = rows.slice(headerIdx + 1)
      return dataRows.map(r => normalizeRow(r, headerMap)).filter(r => (r.symbol || r.date))
    } catch (err) {
      // try next
      // console.warn('Failed to load CSV at', path, err)
    }
  }
  throw new Error('No local CSV found in /docs')
}


