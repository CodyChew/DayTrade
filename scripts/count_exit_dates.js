import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const csvPath = path.resolve('docs', 'PremiumExtract Strategy.csv')

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(cell => (cell || '').toString().trim().toLowerCase())
    if (row.includes('date placed') || (row.includes('ticker') && row.includes('p&l'))) {
      return i
    }
  }
  return -1
}

try {
  const text = fs.readFileSync(csvPath, 'utf8')
  const parsed = Papa.parse(text, { skipEmptyLines: true, dynamicTyping: false })
  const rows = parsed.data
  console.log(`Total rows parsed: ${rows.length}`)

  const headerIdx = findHeaderRow(rows)
  const headerRow = rows[headerIdx]
  const headers = headerRow.map(h => (h || '').toString().trim())

  console.log('Headers:', headers)

  const exitDateIdx = headers.indexOf('Exit Date')
  const dateIdx = headers.indexOf('Date placed')
  
  console.log('Exit Date column index:', exitDateIdx)
  console.log('Date placed column index:', dateIdx)

  const dataRows = rows.slice(headerIdx + 1)
  
  // Count Aug 2023 by exit date
  const aug2023Exits = dataRows.filter(r => {
    const exitDate = (r[exitDateIdx] || '').toString().trim()
    return exitDate.includes('Aug 2023')
  })

  console.log(`\nTrades with Exit Date in Aug 2023: ${aug2023Exits.length}`)
  console.log('Sample Aug 2023 exits:')
  aug2023Exits.slice(0, 5).forEach((r, i) => {
    console.log(`  ${i+1}. Exit: ${r[exitDateIdx]} | Opened: ${r[dateIdx]} | Symbol: ${r[headers.indexOf('Ticker')]}`)
  })

} catch (err) {
  console.error('Failed:', err.message)
  process.exit(1)
}
