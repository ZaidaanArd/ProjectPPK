export function csvCell(value: string | number) {
  const raw = String(value)
  // Spreadsheet applications may evaluate cells beginning with these characters.
  const safe = /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replaceAll('"', '""')}"`
}

export function csvDocument(headers: string[], rows: (string | number)[][]) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}`
}
