"use client";

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Eye,
  Download,
  Trash2,
  FolderSymlink,
  CalendarClock,
  Clock,
  GripVertical,
  Check,
  AlertTriangle,
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFileSize, getFileIconType } from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  DocumentCategory,
  VehicleDocumentItem,
  getCategoryColor,
} from "./types";
import { DocumentPreviewModal } from "./document-preview-modal";

export interface DocumentoCardProps {
  doc: VehicleDocumentItem;
  categories: DocumentCategory[];
  onMoveCategory?: (docId: number, targetCategoryId: number | null) => void;
  onDelete?: (docId: number) => void;
  className?: string;
}

function getFileIcon(mimeType: string, fileName: string) {
  const type = getFileIconType(mimeType, fileName);
  switch (type) {
    case "pdf":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          <FileText className="h-5 w-5" />
        </div>
      );
    case "image":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-400">
          <FileImage className="h-5 w-5" />
        </div>
      );
    case "word":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
          <FileText className="h-5 w-5" />
        </div>
      );
    case "excel":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
      );
    default:
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
          <File className="h-5 w-5" />
        </div>
      );
  }
}

export function DocumentoCard({
  doc,
  categories,
  onMoveCategory,
  onDelete,
  className,
}: DocumentoCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", String(doc.id));
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ docId: doc.id, categoryId: doc.categoryId })
    );
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const fechaCarga = doc.createdAt
    ? format(new Date(doc.createdAt), "dd/MM/yyyy", { locale: es })
    : null;

  let vencimientoInfo: {
    text: string;
    isExpired: boolean;
    isExpiringSoon: boolean;
  } | null = null;

  if (doc.fechaVencimiento) {
    const expDate = new Date(doc.fechaVencimiento);
    const isExpired = isBefore(expDate, new Date());
    const isExpiringSoon = !isExpired && isBefore(expDate, addDays(new Date(), 30));
    const formattedExp = format(expDate, "dd/MM/yyyy", { locale: es });
    vencimientoInfo = {
      text: formattedExp,
      isExpired,
      isExpiringSoon,
    };
  }

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          "group relative flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md",
          "cursor-grab active:cursor-grabbing select-none",
          isDragging && "opacity-40 border-primary scale-[0.98]",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Drag Handle Indicator */}
          <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0">
            <GripVertical className="h-4 w-4" />
          </div>

          {/* File Icon */}
          {getFileIcon(doc.mimeType, doc.fileName)}

          {/* Title & Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="font-medium text-sm text-foreground truncate block"
                title={doc.title || doc.fileName}
              >
                {doc.title || doc.fileName}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
              <span>{formatFileSize(doc.fileSize)}</span>
              {fechaCarga && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fechaCarga}
                  </span>
                </>
              )}
              {vencimientoInfo && (
                <>
                  <span>•</span>
                  {vencimientoInfo.isExpired ? (
                    <Badge
                      variant="destructive"
                      className="h-4 px-1 text-[10px] font-normal"
                    >
                      <CalendarClock className="mr-0.5 h-2.5 w-2.5" />
                      Vencido {vencimientoInfo.text}
                    </Badge>
                  ) : vencimientoInfo.isExpiringSoon ? (
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[10px] font-normal border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700"
                    >
                      <CalendarClock className="mr-0.5 h-2.5 w-2.5" />
                      Vence {vencimientoInfo.text}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">
                      Vence: {vencimientoInfo.text}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Preview Modal Button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Previsualizar"
            onClick={(e) => {
              e.stopPropagation();
              setShowPreview(true);
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Previsualizar documento</span>
          </Button>

          {/* Download Button */}
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Descargar archivo"
          >
            <a
              href={`/api/documents/${doc.id}/download`}
              download={doc.fileName}
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Descargar documento</span>
            </a>
          </Button>

          {/* Move to Category Menu (1-tap mobile & desktop categorization) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Mover a otra categoría"
                onClick={(e) => e.stopPropagation()}
              >
                <FolderSymlink className="h-4 w-4" />
                <span className="sr-only">Mover categoría</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Mover a categoría
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center justify-between text-xs cursor-pointer"
                onClick={() => onMoveCategory?.(doc.id, null)}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>Sin categoría</span>
                </div>
                {doc.categoryId === null && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>

              {categories.map((cat) => {
                const colorConfig = getCategoryColor(cat.color);
                const isSelected = doc.categoryId === cat.id;
                return (
                  <DropdownMenuItem
                    key={cat.id}
                    className="flex items-center justify-between text-xs cursor-pointer"
                    onClick={() => onMoveCategory?.(doc.id, cat.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-2 w-2 rounded-full", colorConfig.dot)}
                      />
                      <span className="truncate">{cat.nombre}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Eliminar documento"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar documento</span>
          </Button>
        </div>
      </div>

      <DocumentPreviewModal doc={doc} open={showPreview} onOpenChange={setShowPreview} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ¿Eliminar documento?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-foreground">
                {doc.title || doc.fileName}
              </span>
              ? Esta acción no se puede deshacer y el archivo se borrará permanentemente de MinIO.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(false);
                onDelete?.(doc.id);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default DocumentoCard;
