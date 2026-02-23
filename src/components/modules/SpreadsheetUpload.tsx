import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface SpreadsheetUploadProps {
  onDataLoaded: (title: string, data: string[][]) => void;
}

export function SpreadsheetUpload({ onDataLoaded }: SpreadsheetUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      if (jsonData.length === 0) {
        toast({ title: "Planilha vazia", description: "O arquivo não contém dados.", variant: "destructive" });
        setUploading(false);
        return;
      }

      const maxCols = Math.max(...jsonData.map(r => r.length), 1);
      const normalizedData = jsonData.map(row => {
        const newRow = row.map(cell => String(cell ?? ""));
        while (newRow.length < maxCols) newRow.push("");
        return newRow;
      });

      const title = file.name.replace(/\.(xlsx|xls|csv)$/i, "") || "Planilha Importada";
      onDataLoaded(title, normalizedData);
      toast({ title: "Planilha importada com sucesso!" });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Erro ao ler o arquivo", description: "Verifique se é um arquivo Excel ou CSV válido.", variant: "destructive" });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="h-4 w-4 mr-1" />
        {uploading ? "Importando..." : "Importar Excel"}
      </Button>
    </>
  );
}
