function protectSpreadsheetFormula(value) {
  const text = value == null ? '' : String(value)
  return /^[=+\-@]/.test(text) ? `'${text}` : text
}

export function csvCell(value) {
  return `"${protectSpreadsheetFormula(value).replaceAll('"', '""')}"`
}

export function downloadCsv(filename, headers, rows) {
  const content = [headers, ...rows]
    // Excel Indonesia umumnya memakai titik koma sebagai pemisah kolom.
    .map((row) => row.map(csvCell).join(';'))
    .join('\r\n')
  const blob = new Blob([`\ufeffsep=;\r\n${content}\r\n`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function formatExportDate(value) {
  if (!value) return ''
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value)
}
import * as XLSX from 'xlsx'


export function downloadXlsx(filename, sheetName, headers, rows, widths = []) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  worksheet['!cols'] = widths.map((width) => ({ wch: width }))
  worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: headers.length - 1 } }) }
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
  XLSX.writeFile(workbook, filename)
}
