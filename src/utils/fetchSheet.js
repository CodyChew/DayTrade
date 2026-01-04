import Papa from 'papaparse'

function parseDate(dateStr) {
  if (!dateStr) return ''
  const trimmed = String(dateStr).trim()
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (dmyMatch) {
    const day = Number(dmyMatch[1])
    const month = Number(dmyMatch[2])
    let year = Number(dmyMatch[3])
    if (year < 100) year += 2000
    const dt = new Date(year, month - 1, day)
    if (!Number.isNaN(dt.getTime())) {
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const d = String(dt.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return trimmed
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const d = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(cell => (cell || '').toString().trim().toLowerCase())
    if (row.includes('date') && row.includes('ticker') && (row.includes('pnl') || row.includes('p&l'))) {
      return i
    }
    if (row.includes('date') && row.includes('ticker') && row.includes('% return')) return i
  }
  return -1
}

function normalizeRow(rawRow, headerMap) {
  const obj = {}
  for (const key in headerMap) {
    obj[key] = rawRow[headerMap[key]] !== undefined ? rawRow[headerMap[key]] : ''
  }

  const p = (obj['PnL'] || obj['P&L']) !== '' ? Number(obj['PnL'] || obj['P&L']) : undefined
  const roiValue = obj['% Return'] !== undefined ? Number(String(obj['% Return']).replace('%', '')) : undefined

  const issues = []
  if (p === undefined || Number.isNaN(p)) issues.push('Missing PnL')
  if (roiValue !== undefined && Number.isNaN(roiValue)) issues.push('Invalid % Return')

  return {
    date: parseDate(obj['Date'] || obj['date'] || ''),
    symbol: obj['Ticker'] || obj['ticker'] || '',
    entry: obj['Entry'] !== undefined ? Number(obj['Entry']) : undefined,
    exit: obj['Exit'] !== undefined ? Number(obj['Exit']) : undefined,
    pnl: p,
    roi: roiValue,
    cumPnlDay: obj['Cum PnL (Day)'] !== undefined ? Number(obj['Cum PnL (Day)']) : undefined,
    notes: obj['Notes'] || obj['notes'] || '',
    issues,
    raw: obj,
  }
}

/**
 * Fetches a public Google Sheet as JSON rows (header row -> keys)
 * @param {string} sheetId - the spreadsheet ID
 * @param {string|number} gid - the sheet gid (defaults to 0)
 * @returns {Promise<Array<Object>>}
 */
export async function fetchSheetAsJson(sheetId, gid = 0) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error('Failed to fetch sheet')
  const text = await res.text()
  const parsed = Papa.parse(text, { skipEmptyLines: true, dynamicTyping: false })
  const rows = parsed.data

  if (!rows || !rows.length) throw new Error('Empty sheet')

  const headerIdx = findHeaderRow(rows)
  if (headerIdx === -1) {
    throw new Error('Could not find header row in sheet (expected: Date, Ticker, PnL, etc.)')
  }

  const headerRow = rows[headerIdx]
  const headers = headerRow.map(h => (h || '').toString().trim())
  const headerMap = {}
  headers.forEach((h, i) => (headerMap[h] = i))

  console.log('Sheet header row detected at index:', headerIdx)
  console.log('Headers found:', headers)
  console.log('First data row raw:', rows[headerIdx + 1])

  const dataRows = rows.slice(headerIdx + 1)
  return dataRows.map(r => normalizeRow(r, headerMap)).filter(r => (r.symbol || r.date))
}
