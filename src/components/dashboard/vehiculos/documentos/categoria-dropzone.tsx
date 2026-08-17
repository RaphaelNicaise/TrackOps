"use client";

import React, { useState } from "react";
import { Folder, FolderOpen, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentoCard } from "./documento-card";
import {
  DocumentCategory,
  VehicleDocumentItem,
  getCategoryColor,
} from "./types";
import { cn } from "@/lib/utils";

export interface CategoriaDropzoneProps {
  category: DocumentCategory | null; // null = Sin categoría
  docs: VehicleDocumentItem[];
  categories: DocumentCategory[];
  onDropDoc?: (docId: number, targetCategoryId: number | null) => void;
  onMoveCategory?: (docId: number, targetCategoryId: number | null) => void;
  onDeleteDoc?: (docId: number) => void;
  className?: string;
}

export function CategoriaDropzone({
  category,
  docs,
  categories,
  onDropDoc,
  onMoveCategory,
  onDeleteDoc,
  className,
}: CategoriaDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const raw = e.dataTransfer.getData("text/plain");
    const docId = Number(raw);

    if (!isNaN(docId) && docId > 0) {
      onDropDoc?.(docId, category ? category.id : null);
    }
  };

  const colorConfig = category ? getCategoryColor(category.color) : null;
  const isUncategorized = category === null;

  return (
    <Card
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col transition-all duration-200 overflow-hidden",
        isDragOver
          ? "border-primary ring-2 ring-primary/40 bg-primary/5 shadow-md scale-[1.01]"
          : "border-border/80 bg-card hover:border-border",
        className
      )}
    >
      {/* Category Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b bg-muted/20">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Color Indicator Dot or Icon */}
          {isUncategorized ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Inbox className="h-3.5 w-3.5" />
            </span>
          ) : (
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white font-bold text-xs shadow-xs",
                colorConfig?.activeBg || "bg-primary"
              )}
            >
              {category.nombre.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold truncate flex items-center gap-2">
              <span>{isUncategorized ? "Sin categoría" : category.nombre}</span>
            </CardTitle>
          </div>
        </div>

        {/* Count Badge */}
        <Badge
          variant="secondary"
          className={cn(
            "h-5 px-2 text-xs font-normal shrink-0",
            docs.length > 0
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground"
          )}
        >
          {docs.length} {docs.length === 1 ? "documento" : "documentos"}
        </Badge>
      </CardHeader>

      {/* Documents List & Drop Area */}
      <CardContent className="flex-1 p-3 space-y-2.5 min-h-[120px]">
        {docs.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border border-dashed py-8 px-4 text-center transition-colors",
              isDragOver
                ? "border-primary/50 bg-primary/5 text-primary"
                : "border-muted text-muted-foreground"
            )}
          >
            {isDragOver ? (
              <>
                <FolderOpen className="h-8 w-8 text-primary animate-bounce mb-2" />
                <p className="text-xs font-semibold text-primary">
                  Soltá para mover a{" "}
                  {isUncategorized ? "Sin categoría" : category.nombre}
                </p>
              </>
            ) : (
              <>
                <Folder className="h-7 w-7 text-muted-foreground/40 mb-1.5" />
                <p className="text-xs font-medium text-muted-foreground">
                  No hay documentos asignados
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  Arrastrá un archivo aquí para categorizarlo
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <DocumentoCard
                key={doc.id}
                doc={doc}
                categories={categories}
                onMoveCategory={onMoveCategory}
                onDelete={onDeleteDoc}
              />
            ))}

            {isDragOver && (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 p-3 text-center text-xs font-semibold text-primary animate-pulse">
                Soltá aquí para mover a{" "}
                {isUncategorized ? "Sin categoría" : category.nombre}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CategoriaDropzone;
