interface ChartDataTableColumn<Row> {
  label: string
  value: (row: Row) => string
}

interface ChartDataTableProps<Row> {
  caption: string
  rowHeaderLabel: string
  rowHeader: (row: Row) => string
  columns: ChartDataTableColumn<Row>[]
  rows: Row[]
}

// Text alternative for a chart (WCAG 1.1.1): hidden on screen, read by screen readers.
export function ChartDataTable<Row>({ caption, rowHeaderLabel, rowHeader, columns, rows }: ChartDataTableProps<Row>) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{rowHeaderLabel}</th>
            {columns.map((column) => (
              <th key={column.label} scope="col">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowHeader(row)}>
              <th scope="row">{rowHeader(row)}</th>
              {columns.map((column) => (
                <td key={column.label}>{column.value(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
