import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportTableToPDF, exportTableToXLSX } from "@/lib/export-utils";

/**
 * Botones rápidos de exportación PDF + Excel para listados.
 * Visible solo cuando hay filas. Sin estados internos.
 */
export function ExportButtons({
  filename,
  title,
  subtitle,
  head,
  rows,
  size = "sm",
  disabled,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  head: string[];
  rows: (string | number | null | undefined)[][];
  size?: "sm" | "default";
  disabled?: boolean;
}) {
  const empty = disabled || rows.length === 0;
  return (
    <div className="flex items-center gap-2">
      <Button
        size={size}
        variant="outline"
        disabled={empty}
        onClick={() => exportTableToPDF({ filename, title, subtitle, head, rows })}
        title="Descargar PDF"
      >
        <FileDown className="mr-1 h-4 w-4" /> PDF
      </Button>
      <Button
        size={size}
        variant="outline"
        disabled={empty}
        onClick={() => exportTableToXLSX({ filename, head, rows, sheetName: title.slice(0, 28) })}
        title="Descargar Excel"
      >
        <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
      </Button>
    </div>
  );
}
