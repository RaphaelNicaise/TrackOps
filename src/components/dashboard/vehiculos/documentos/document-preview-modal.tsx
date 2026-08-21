"use client";

import React, { useState } from "react";
import { Download, FileText, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, getFileIconType } from "@/lib/storage";
import type { VehicleDocumentItem } from "./types";

interface DocumentPreviewModalProps {
  doc: VehicleDocumentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getPreviewType(mimeType: string, fileName: string): "image" | "pdf" | "unsupported" {
  const type = getFileIconType(mimeType, fileName);
  if (type === "image") return "image";
  if (type === "pdf") return "pdf";
  // Verificación directa por mime para pdf
  if (mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return "unsupported";
}

export function DocumentPreviewModal({ doc, open, onOpenChange }: DocumentPreviewModalProps) {
  const [imgError, setImgError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  if (!doc) return null;

  const previewType = getPreviewType(doc.mimeType, doc.fileName);
  const viewUrl = `/api/documents/${doc.id}/view`;
  const downloadUrl = `/api/documents/${doc.id}/download`;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setImgError(false);
      setIframeLoading(true);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="px-6 py-4 border-b shrink-0 space-y-1.5 text-left">
          <DialogTitle className="text-base font-semibold truncate pr-8" title={doc.title || doc.fileName}>
            {doc.title || doc.fileName}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
            <span>{doc.fileName}</span>
            <span className="text-muted-foreground">•</span>
            <span>{formatFileSize(doc.fileSize)}</span>
            <Badge variant="outline" className="h-5 px-1.5 text-[11px] font-normal capitalize">
              {doc.mimeType.split("/").pop() || doc.mimeType}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/20 relative overflow-hidden flex flex-col">
          {previewType === "image" && !imgError && (
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-[#F6F4EE]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewUrl}
                alt={doc.title || doc.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg border bg-white"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          {previewType === "image" && imgError && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">No se pudo cargar la imagen</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                El archivo puede estar dañado o el formato no es compatible. Probá descargarlo.
              </p>
              <Button asChild size="sm" className="mt-2">
                <a href={downloadUrl} download={doc.fileName}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Descargar archivo
                </a>
              </Button>
            </div>
          )}

          {previewType === "pdf" && (
            <div className="flex-1 relative bg-white">
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Cargando PDF...</span>
                  </div>
                </div>
              )}
              <iframe
                src={viewUrl}
                title={doc.title || doc.fileName}
                className="w-full h-full border-0"
                onLoad={() => setIframeLoading(false)}
                onError={() => setIframeLoading(false)}
              />
            </div>
          )}

          {previewType === "unsupported" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-[#F6F4EE]">
              <div className="h-16 w-16 rounded-2xl bg-white border shadow-sm flex items-center justify-center">
                <FileText className="h-8 w-8 text-[#1E2227]/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#1E2227]">Previsualización no disponible</p>
                <p className="text-xs text-[#1E2227]/60 max-w-sm">
                  Este tipo de archivo (<span className="font-mono">{doc.fileName.split(".").pop()?.toUpperCase()}</span>) no se puede
                  previsualizar en el navegador. Descargalo para verlo.
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button asChild size="sm" className="bg-[#1E2227] hover:bg-[#1E2227]/90 text-[#F6F4EE]">
                  <a href={downloadUrl} download={doc.fileName}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Descargar archivo
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                    Abrir en pestaña nueva
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground hidden sm:block">
            Vista previa en modal — sin salir de la documentación
          </span>
          <div className="flex gap-2 ml-auto">
            <Button asChild variant="outline" size="sm" className="h-8">
              <a href={downloadUrl} download={doc.fileName}>
                <Download className="h-4 w-4 mr-1.5" />
                Descargar
              </a>
            </Button>
            <Button variant="default" size="sm" className="h-8" onClick={() => handleOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
