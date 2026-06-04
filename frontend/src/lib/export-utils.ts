/**
 * Utilidades de exportación PDF/Excel para TalentForge.
 * Diseño corporativo consistente: encabezado con gradiente, pie con fecha.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const BRAND = "TalentForge";
const BRAND_COLOR: [number, number, number] = [99, 102, 241]; // indigo-500
const ACCENT: [number, number, number] = [168, 85, 247]; // violet-500

function header(doc: jsPDF, title: string, subtitle?: string) {
  const w = doc.internal.pageSize.getWidth();
  // Banda superior
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, w, 28, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(w - 70, 0, 70, 28, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(BRAND, 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma corporativa de talento", 14, 21);
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, 14, 40);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(subtitle, 14, 47);
  }
  doc.setDrawColor(229);
  doc.line(14, 51, w - 14, 51);
  doc.setTextColor(40);
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Generado el ${new Date().toLocaleString()}`, 14, h - 8);
    doc.text(`Página ${i} de ${pageCount}`, w - 14, h - 8, { align: "right" });
  }
}

function kvSection(doc: jsPDF, startY: number, title: string, rows: [string, string][]) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text(title, 14, startY);
  autoTable(doc, {
    startY: startY + 3,
    body: rows.map(([k, v]) => [k, v]),
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2, textColor: 50 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold", textColor: 90 },
      1: { cellWidth: "auto" },
    },
  });
  return (doc as any).lastAutoTable.finalY + 6;
}

/* ============== PROCESO DE CONTRATACIÓN ============== */

export type ProcesoPDFData = {
  postulacion: {
    id: string;
    estado: string;
    createdAt: string;
    notas?: string | null;
  };
  candidato: {
    fullName: string;
    email: string;
    phone?: string | null;
    location?: string | null;
    headline?: string | null;
  };
  vacante: {
    titulo: string;
    departamento: string;
    modalidad: string;
    ubicacion?: string;
  };
  eventos: Array<{
    createdAt: string;
    estado?: string | null;
    tipo: string;
    nota?: string | null;
    autorNombre?: string | null;
    autorRol?: string | null;
  }>;
  entrevistas?: Array<{
    programadaPara: string;
    modalidad: string;
    estado: string;
    link?: string | null;
    ubicacion?: string | null;
    notas?: string | null;
  }>;
  asignaciones?: Array<{
    titulo: string;
    tipo: string;
    estado: string;
    score?: number | null;
    maxScore?: number | null;
    observaciones?: string | null;
  }>;
  mensajes?: Array<{
    autorNombre: string;
    autorRol: string;
    createdAt: string;
    mensaje: string;
  }>;
  estadoLabel?: Record<string, string>;
};

export function exportProcesoPDF(d: ProcesoPDFData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  // jsPDF default unit is mm — recreate with mm for autotable comfort
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  header(pdf, "Reporte del proceso de selección", `Postulación #${d.postulacion.id.slice(0, 8)}`);

  let y = 58;
  y = kvSection(pdf, y, "Candidato", [
    ["Nombre", d.candidato.fullName],
    ["Correo", d.candidato.email],
    ["Teléfono", d.candidato.phone || "—"],
    ["Ubicación", d.candidato.location || "—"],
    ...(d.candidato.headline ? [["Perfil", d.candidato.headline]] as [string, string][] : []),
  ]);
  y = kvSection(pdf, y, "Vacante", [
    ["Título", d.vacante.titulo],
    ["Departamento", d.vacante.departamento],
    ["Modalidad", d.vacante.modalidad],
    ...(d.vacante.ubicacion ? [["Ubicación", d.vacante.ubicacion]] as [string, string][] : []),
  ]);
  y = kvSection(pdf, y, "Estado actual", [
    ["Estado", d.estadoLabel?.[d.postulacion.estado] ?? d.postulacion.estado],
    ["Fecha de postulación", new Date(d.postulacion.createdAt).toLocaleString()],
    ...(d.postulacion.notas ? [["Notas internas", d.postulacion.notas]] as [string, string][] : []),
  ]);

  // Timeline
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
  pdf.text("Línea de tiempo del proceso", 14, y);
  autoTable(pdf, {
    startY: y + 3,
    head: [["Fecha", "Tipo", "Estado / Evento", "Autor", "Detalle"]],
    body: d.eventos.map((e) => [
      new Date(e.createdAt).toLocaleString(),
      e.tipo,
      e.estado ? (d.estadoLabel?.[e.estado] ?? e.estado) : "—",
      e.autorNombre ? `${e.autorNombre} (${e.autorRol})` : "—",
      e.nota || "—",
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  y = (pdf as any).lastAutoTable.finalY + 8;

  // Entrevistas
  if (d.entrevistas && d.entrevistas.length) {
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
    pdf.text("Entrevistas", 14, y);
    autoTable(pdf, {
      startY: y + 3,
      head: [["Fecha", "Modalidad", "Estado", "Lugar / Enlace", "Notas"]],
      body: d.entrevistas.map((e) => [
        new Date(e.programadaPara).toLocaleString(),
        e.modalidad, e.estado,
        e.link || e.ubicacion || "—",
        e.notas || "—",
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: ACCENT, textColor: 255, fontSize: 9 },
    });
    y = (pdf as any).lastAutoTable.finalY + 8;
  }

  // Evaluaciones / Tests
  if (d.asignaciones && d.asignaciones.length) {
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
    pdf.text("Evaluaciones aplicadas", 14, y);
    autoTable(pdf, {
      startY: y + 3,
      head: [["Test", "Tipo", "Estado", "Resultado", "Observaciones"]],
      body: d.asignaciones.map((a) => {
        const max = Number(a.maxScore ?? 0);
        const sc = Number(a.score ?? 0);
        const pct = max ? Math.round((sc / max) * 100) : 0;
        return [
          a.titulo, a.tipo, a.estado,
          max ? `${sc}/${max} (${pct}%)` : "—",
          a.observaciones || "—",
        ];
      }),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontSize: 9 },
    });
    y = (pdf as any).lastAutoTable.finalY + 8;
  }

  // Comentarios / chat
  if (d.mensajes && d.mensajes.length) {
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
    pdf.text("Comentarios y conversación", 14, y);
    autoTable(pdf, {
      startY: y + 3,
      head: [["Fecha", "Autor (rol)", "Mensaje"]],
      body: d.mensajes.map((m) => [
        new Date(m.createdAt).toLocaleString(),
        `${m.autorNombre} (${m.autorRol})`,
        m.mensaje,
      ]),
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: ACCENT, textColor: 255, fontSize: 9 },
      columnStyles: { 2: { cellWidth: 110 } },
    });
  }

  footer(pdf);
  pdf.save(`TalentForge_Proceso_${d.candidato.fullName.replace(/\s+/g, "_")}.pdf`);
}

/* ============== EVALUACIÓN INDIVIDUAL ============== */

export type EvalPDFData = {
  candidato: { fullName: string; email: string };
  test: { titulo: string; tipo: string; categoria?: string | null };
  asignacion: {
    estado: string;
    score?: number | null;
    maxScore?: number | null;
    observaciones?: string | null;
    completadoAt?: string | null;
    createdAt: string;
    respuestas?: Record<string, string | string[]> | null;
    preguntas?: Array<{
      id: string;
      enunciado: string;
      tipo: string;
      opciones?: Array<{ id: string; texto: string; correcta?: boolean }>;
    }>;
  };
};

export function exportEvaluacionPDF(d: EvalPDFData) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  header(pdf, "Reporte de evaluación", d.test.titulo);

  const max = Number(d.asignacion.maxScore ?? 0);
  const sc = Number(d.asignacion.score ?? 0);
  const pct = max ? Math.round((sc / max) * 100) : 0;

  let y = 58;
  y = kvSection(pdf, y, "Datos generales", [
    ["Candidato", d.candidato.fullName],
    ["Correo", d.candidato.email],
    ["Evaluación", d.test.titulo],
    ["Tipo", d.test.tipo],
    ["Categoría", d.test.categoria || "—"],
    ["Estado", d.asignacion.estado],
    ["Asignada", new Date(d.asignacion.createdAt).toLocaleString()],
    ["Completada", d.asignacion.completadoAt ? new Date(d.asignacion.completadoAt).toLocaleString() : "—"],
    ["Resultado", max ? `${sc}/${max} (${pct}%)` : "Cualitativo"],
    ...(d.asignacion.observaciones ? [["Observaciones", d.asignacion.observaciones]] as [string, string][] : []),
  ]);

  pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
  pdf.text("Preguntas y respuestas", 14, y);
  const rows: any[] = [];
  (d.asignacion.preguntas ?? []).forEach((q, i) => {
    const correctas = (q.opciones ?? []).filter((o) => o.correcta).map((o) => String(o.id));
    const r = d.asignacion.respuestas?.[q.id];
    const sel = r == null ? [] : (Array.isArray(r) ? r.map(String) : [String(r)]);
    const label = (id: string) => q.opciones?.find((o) => String(o.id) === id)?.texto ?? id;
    const respTxt = sel.length === 0 ? "(sin responder)" : q.tipo === "texto" ? sel[0] : sel.map(label).join(", ");
    const okTxt = correctas.length ? correctas.map(label).join(", ") : "—";
    rows.push([String(i + 1), q.enunciado, respTxt, okTxt]);
  });
  autoTable(pdf, {
    startY: y + 3,
    head: [["#", "Pregunta", "Respuesta del candidato", "Respuesta correcta"]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontSize: 9 },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 70 }, 2: { cellWidth: 55 }, 3: { cellWidth: 50 } },
  });

  footer(pdf);
  pdf.save(`TalentForge_Evaluacion_${d.candidato.fullName.replace(/\s+/g, "_")}.pdf`);
}

/* ============== REPORTES GENÉRICOS ============== */

export function exportTableToPDF(opts: {
  filename: string;
  title: string;
  subtitle?: string;
  head: string[];
  rows: (string | number | null | undefined)[][];
}) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  header(pdf, opts.title, opts.subtitle);
  autoTable(pdf, {
    startY: 58,
    head: [opts.head],
    body: opts.rows.map((r) => r.map((c) => (c == null ? "—" : String(c)))),
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: BRAND_COLOR, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  footer(pdf);
  pdf.save(`${opts.filename}.pdf`);
}

export function exportTableToXLSX(opts: {
  filename: string;
  sheetName?: string;
  head: string[];
  rows: (string | number | null | undefined)[][];
}) {
  const aoa = [opts.head, ...opts.rows.map((r) => r.map((c) => (c == null ? "" : c)))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Auto-widths
  const widths = opts.head.map((h, i) => {
    const maxLen = Math.max(h.length, ...opts.rows.map((r) => String(r[i] ?? "").length));
    return { wch: Math.min(60, Math.max(10, maxLen + 2)) };
  });
  (ws as any)["!cols"] = widths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (opts.sheetName || "Datos").slice(0, 31));
  XLSX.writeFile(wb, `${opts.filename}.xlsx`);
}
