import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const csvPath = path.resolve('docs', 'PremiumExtract Strategy.csv')

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(cell => (cell || '').toString().trim().toLowerCase())
    if (row.includes('date placed') || row.includes('date') && row.includes('ticker')) {
      return i
    }
    if (row.includes('ticker') && (row.includes('p&l') || row.includes('pnl') || row.includes('pnL'.toLowerCase()))) return i
  }
  return -1
}

function normalizeRow(rawRow, headerMap) {
  const obj = {}
  for (const key in headerMap) obj[key] = rawRow[headerMap[key]] !== undefined ? rawRow[headerMap[key]] : ''

  const mapped = {
    date: obj['Date placed'] || obj['date placed'] || obj['date'] || obj['Date'] || '',
    symbol: obj['Ticker'] || obj['ticker'] || '',
    quantity: obj['contracts'] ? Number(obj['contracts']) : obj['contracts'] === '' ? undefined : Number(obj['contracts']),
    pnl: (() => {
      const p = obj['P&L'] !== undefined ? obj['P&L'] : obj['PnL'] !== undefined ? obj['PnL'] : obj['p&l'] !== undefined ? obj['p&l'] : ''
      if (p === '' || p === undefined) return undefined
      const num = Number(p)
      return Number.isNaN(num) ? p : num
    })(),
    strategy: obj['strategy type'] || obj['Strategy'] || obj['strategy'] || '',
    raw: obj,
  }

  if (mapped.date) {
    const parsed = new Date(mapped.date)
    if (!Number.isNaN(parsed.getTime())) mapped.date = parsed.toISOString().slice(0, 10)
  }

  return mapped
}

try {
  const text = fs.readFileSync(csvPath, 'utf8')
  const parsed = Papa.parse(text, { skipEmptyLines: true, dynamicTyping: false })
  const rows = parsed.data
  console.log(`Total rows parsed (including intro rows): ${rows.length}`)

  const headerIdx = findHeaderRow(rows)
  console.log('Detected header row index:', headerIdx)

  const headerRow = headerIdx >= 0 ? rows[headerIdx] : rows[0]
  console.log('Header sample:', headerRow.map(h => (h || '').toString().trim()).join(' | '))

  const headers = headerRow.map(h => (h || '').toString().trim())
  const headerMap = {}
  headers.forEach((h, i) => (headerMap[h] = i))

  const dataRows = rows.slice(headerIdx >= 0 ? headerIdx + 1 : 1)
  console.log('Data rows detected:', dataRows.length)

  const mapped = dataRows.map(r => normalizeRow(r, headerMap))

  const haveSymbol = mapped.filter(r => r.symbol).length
  const haveDate = mapped.filter(r => r.date).length
  const havePnl = mapped.filter(r => r.pnl !== undefined).length
  const haveQty = mapped.filter(r => r.quantity !== undefined).length

  console.log('Mapped rows with symbol:', haveSymbol)
  console.log('Mapped rows with date:', haveDate)
  console.log('Mapped rows with pnl:', havePnl)
  console.log('Mapped rows with quantity:', haveQty)

  console.log('\nFirst 5 mapped rows:')
  mapped.slice(0, 5).forEach((r, i) => console.log(i + 1, JSON.stringify(r)))

} catch (err) {
  console.error('Failed to inspect CSV:', err.message)
  process.exit(1)
}
