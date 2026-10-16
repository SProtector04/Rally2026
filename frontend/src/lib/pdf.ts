import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

interface TablePdfOptions {
  statusColumn?: number
}

/**
 * Generates a client-side PDF report with a header band, title block and a
 * grid table, then triggers a download via `jsPDF` + `jspdf-autotable`.
 */
export function downloadTablePdf(
  title: string,
  subtitle: string,
  headers: string[],
  rows: string[][],
  filename = 'reporte.pdf',
  options: TablePdfOptions = {},
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(2, 132, 199)
  doc.rect(0, 0, pageWidth, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Rally2026', 14, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Plataforma de monitoreo ambiental', 14, 18)

  doc.setTextColor(15, 47, 46)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, 14, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(79, 115, 116)
  doc.text(subtitle, 14, 40)
  doc.text(`Generado el ${new Date().toLocaleString('es-AR')}`, 14, 46)

  autoTable(doc, {
    startY: 52,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [224, 242, 254], textColor: [7, 89, 133], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 248, 247] },
    didParseCell: (data) => {
      if (
        data.section === 'body' &&
        options.statusColumn !== undefined &&
        data.column.index === options.statusColumn
      ) {
        const value = String(data.cell.raw)
        if (value === 'Alerta') {
          data.cell.styles.textColor = [225, 29, 72]
          data.cell.styles.fontStyle = 'bold'
        } else if (value === 'Atención') {
          data.cell.styles.textColor = [180, 83, 9]
          data.cell.styles.fontStyle = 'bold'
        } else if (value === 'Normal') {
          data.cell.styles.textColor = [5, 150, 105]
        }
      }
    },
  })

  doc.save(filename)
}
