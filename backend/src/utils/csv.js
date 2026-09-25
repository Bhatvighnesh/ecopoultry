/** Minimal CSV helpers - no external dependency needed for this scope. */

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value instanceof Date ? value.toISOString() : value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsvSection(title, columns, rows) {
  const header = `# ${title}`;
  if (!rows.length) return `${header}\n(no data)\n`;
  const headerRow = columns.join(',');
  const dataRows = rows.map((row) => columns.map((col) => escapeCell(row[col])).join(','));
  return [header, headerRow, ...dataRows].join('\n') + '\n';
}

module.exports = { toCsvSection };
