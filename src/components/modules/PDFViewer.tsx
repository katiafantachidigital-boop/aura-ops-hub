import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, X, ExternalLink, FileText, Loader2 } from "lucide-react";

interface PDFViewerProps {
  url: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PDFViewer({ url, title, open, onOpenChange }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = title || "documento.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg truncate pr-4">
              <FileText className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{title}</span>
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenNewTab}
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Nova Aba
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Baixar arquivo"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative bg-muted min-h-0">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando documento...</p>
              </div>
            </div>
          )}
          
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Não foi possível carregar o PDF</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu dispositivo pode não suportar visualização de PDFs no navegador.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleOpenNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0"
              title={title}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component to use for document content viewing
interface DocumentViewerButtonProps {
  url: string;
  title: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}

export function DocumentViewerButton({ 
  url, 
  title, 
  variant = "ghost", 
  size = "sm",
  showLabel = false 
}: DocumentViewerButtonProps) {
  const [open, setOpen] = useState(false);
  
  // Check if it's a PDF
  const isPDF = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');

  const handleClick = () => {
    if (isPDF) {
      setOpen(true);
    } else {
      // For non-PDF documents, open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        title={isPDF ? "Visualizar documento" : "Abrir documento"}
      >
        <FileText className="h-4 w-4" />
        {showLabel && <span className="ml-2">Ver</span>}
      </Button>
      
      {isPDF && (
        <PDFViewer
          url={url}
          title={title}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
