"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Loader2, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { appAlert } from "@/lib/alerts";

export interface UploadDropzoneProps {
  onUpload: (files: File[]) => Promise<void> | void;
  isUploading?: boolean;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

const DEFAULT_ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function UploadDropzone({
  onUpload,
  isUploading = false,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 25,
  className,
}: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    const maxBytes = maxSizeMB * 1024 * 1024;
    const oversized = files.filter((f) => f.size > maxBytes);

    if (oversized.length > 0) {
      appAlert.error(
        `El archivo "${oversized[0].name}" excede el límite máximo de ${maxSizeMB}MB.`,
        "Archivo demasiado grande"
      );
      return;
    }

    try {
      await onUpload(files);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al subir los archivos.";
      appAlert.error(msg, "Error al subir");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await validateAndUpload(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await validateAndUpload(e.target.files);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick();
          }
        }}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer select-none",
          isDragOver
            ? "border-primary bg-primary/10 scale-[1.01] shadow-md ring-2 ring-primary/20"
            : "border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
          isUploading && "pointer-events-none opacity-60 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2.5 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Subiendo y procesando documentos...
              </p>
              <p className="text-xs text-muted-foreground">
                Guardando en el almacenamiento seguro de la flota
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200",
                isDragOver
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
              )}
            >
              {isDragOver ? (
                <FileUp className="h-6 w-6 animate-bounce" />
              ) : (
                <UploadCloud className="h-6 w-6" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isDragOver ? (
                  <span className="text-primary font-semibold">
                    Soltá los archivos aquí
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-primary underline underline-offset-2">
                      Hacé click para explorar
                    </span>{" "}
                    o arrastrá archivos aquí
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, imágenes, Word, Excel (hasta {maxSizeMB}MB por archivo)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadDropzone;
