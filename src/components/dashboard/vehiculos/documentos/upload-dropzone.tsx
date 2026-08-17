"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Loader2, AlertCircle, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateAndUpload = async (fileList: FileList | File[]) => {
    setErrorMsg(null);
    const files = Array.from(fileList);
    if (!files.length) return;

    const maxBytes = maxSizeMB * 1024 * 1024;
    const oversized = files.filter((f) => f.size > maxBytes);

    if (oversized.length > 0) {
      setErrorMsg(
        `El archivo "${oversized[0].name}" excede el límite máximo de ${maxSizeMB}MB.`
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
      setErrorMsg(msg);
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
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer select-none",
          "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
          isDragOver &&
            "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.01]",
          isUploading && "pointer-events-none opacity-60 bg-muted/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Subiendo documentos...
              </p>
              <p className="text-xs text-muted-foreground">
                Almacenando de forma segura en MinIO
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200",
                isDragOver
                  ? "scale-110 bg-primary text-primary-foreground"
                  : "group-hover:scale-105"
              )}
            >
              {isDragOver ? (
                <FileUp className="h-6 w-6" />
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

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs text-destructive hover:bg-destructive/20"
            onClick={() => setErrorMsg(null)}
          >
            Cerrar
          </Button>
        </div>
      )}
    </div>
  );
}

export default UploadDropzone;
