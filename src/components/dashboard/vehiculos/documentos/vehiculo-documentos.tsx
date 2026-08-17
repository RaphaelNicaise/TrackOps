"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FolderPlus,
  Search,
  RotateCw,
  Files,
  CalendarClock,
  FolderTree,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";
import { isBefore, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DocumentCategory,
  VehicleDocumentItem,
} from "./types";
import { CategoriaDropzone } from "./categoria-dropzone";
import { UploadDropzone } from "./upload-dropzone";
import { NuevaCategoriaDialog } from "./nueva-categoria-dialog";

export interface VehiculoDocumentosProps {
  vehicleId: number;
  empresaId?: number | null;
  className?: string;
}

export function VehiculoDocumentos({
  vehicleId,
  className,
}: VehiculoDocumentosProps) {
  const [documents, setDocuments] = useState<VehicleDocumentItem[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-clear notification after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Load documents and categories
  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const [docsRes, catsRes] = await Promise.all([
          fetch(`/api/vehicles/${vehicleId}/documents`),
          fetch(`/api/vehicles/${vehicleId}/categories`),
        ]);

        if (!docsRes.ok) {
          throw new Error("No se pudieron cargar los documentos del vehículo.");
        }
        if (!catsRes.ok) {
          throw new Error("No se pudieron cargar las categorías de documentos.");
        }

        const [docsData, catsData] = await Promise.all([
          docsRes.json(),
          catsRes.json(),
        ]);

        setDocuments(docsData);
        setCategories(catsData);
      } catch (err: unknown) {
        console.error("Error fetching documentos data:", err);
        const msg =
          err instanceof Error
            ? err.message
            : "Ocurrió un error al cargar la información documental.";
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [vehicleId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Move document to a category (Optimistic)
  const handleMoveCategory = async (
    docId: number,
    targetCategoryId: number | null
  ) => {
    const previousDocuments = [...documents];

    // Optimistic update
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, categoryId: targetCategoryId } : d
      )
    );

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: targetCategoryId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || "No se pudo actualizar la categoría del documento."
        );
      }

      const targetCat = categories.find((c) => c.id === targetCategoryId);
      setNotification({
        type: "success",
        message: targetCat
          ? `Documento asignado a "${targetCat.nombre}".`
          : "Documento movido a Sin categoría.",
      });
    } catch (err: unknown) {
      console.error("Error moving document category:", err);
      setDocuments(previousDocuments);
      const msg =
        err instanceof Error
          ? err.message
          : "Error al actualizar la categoría del documento.";
      setNotification({ type: "error", message: msg });
    }
  };

  // Upload files handler
  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch(`/api/vehicles/${vehicleId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || "Error al subir los documentos al almacenamiento."
        );
      }

      const createdDocs: VehicleDocumentItem[] = await res.json();
      setDocuments((prev) => [...createdDocs, ...prev]);

      setNotification({
        type: "success",
        message:
          files.length === 1
            ? "1 documento subido exitosamente."
            : `${files.length} documentos subidos exitosamente.`,
      });
    } catch (err: unknown) {
      console.error("Error uploading documents:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al subir los archivos.";
      setNotification({ type: "error", message: msg });
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Delete document (Optimistic)
  const handleDeleteDoc = async (docId: number) => {
    const previousDocuments = [...documents];

    // Optimistic delete
    setDocuments((prev) => prev.filter((d) => d.id !== docId));

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || "No se pudo eliminar el documento de almacenamiento."
        );
      }

      setNotification({
        type: "success",
        message: "Documento eliminado correctamente.",
      });
    } catch (err: unknown) {
      console.error("Error deleting document:", err);
      setDocuments(previousDocuments);
      const msg =
        err instanceof Error
          ? err.message
          : "Error al eliminar el documento.";
      setNotification({ type: "error", message: msg });
    }
  };

  // Create new category handler
  const handleCreateCategory = async (nombre: string, color: string) => {
    const res = await fetch(`/api/vehicles/${vehicleId}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, color }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData.error || "No se pudo crear la categoría de documentos."
      );
    }

    const createdCat: DocumentCategory = await res.json();
    setCategories((prev) => [...prev, createdCat]);
    setNotification({
      type: "success",
      message: `Categoría "${nombre}" creada correctamente.`,
    });
  };

  // Filter documents by search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase().trim();
    return documents.filter((doc) => {
      const titleMatch = doc.title?.toLowerCase().includes(q);
      const fileMatch = doc.fileName.toLowerCase().includes(q);
      const notesMatch = doc.notas?.toLowerCase().includes(q);
      return titleMatch || fileMatch || notesMatch;
    });
  }, [documents, searchQuery]);

  // Documents without category (or category that doesn't exist)
  const uncategorizedDocs = useMemo(() => {
    const validCategoryIds = new Set(categories.map((c) => c.id));
    return filteredDocuments.filter(
      (doc) => doc.categoryId === null || !validCategoryIds.has(doc.categoryId)
    );
  }, [filteredDocuments, categories]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = documents.length;
    let expiredOrSoon = 0;
    const now = new Date();
    const soonThreshold = addDays(now, 30);

    documents.forEach((d) => {
      if (d.fechaVencimiento) {
        const exp = new Date(d.fechaVencimiento);
        if (isBefore(exp, soonThreshold)) {
          expiredOrSoon++;
        }
      }
    });

    return {
      total,
      categoriesCount: categories.length,
      expiredOrSoon,
    };
  }, [documents, categories]);

  // Skeleton loading view
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-64 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>

        {/* Board Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5 xl:col-span-4">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7 xl:col-span-8">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Top Header Controls & Metrics */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search & Filter */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-8 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Limpiar búsqueda</span>
              </button>
            )}
          </div>

          {/* Badges Metrics */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="h-7 gap-1.5 px-2.5 text-xs font-normal">
              <Files className="h-3.5 w-3.5 text-primary" />
              <span>
                <strong className="font-semibold">{metrics.total}</strong>{" "}
                {metrics.total === 1 ? "documento" : "documentos"}
              </span>
            </Badge>

            <Badge variant="outline" className="h-7 gap-1.5 px-2.5 text-xs font-normal">
              <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                <strong className="font-semibold">{metrics.categoriesCount}</strong>{" "}
                categorías
              </span>
            </Badge>

            {metrics.expiredOrSoon > 0 && (
              <Badge
                variant="outline"
                className="h-7 gap-1.5 border-amber-300 bg-amber-50 px-2.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
              >
                <CalendarClock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>
                  {metrics.expiredOrSoon} con alerta de vencimiento
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            title="Recargar documentos"
          >
            <RotateCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")}
            />
            <span className="sr-only">Actualizar</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="h-9 gap-1.5"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Nueva categoría</span>
          </Button>
        </div>
      </div>

      {/* Inline Feedback Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "flex items-center justify-between rounded-lg border p-3 text-sm shadow-xs",
              notification.type === "success"
                ? "border-emerald-200 bg-emerald-50/90 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50"
            )}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar notificación</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Error Banner if initial fetch or general state failed */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            className="h-8 border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Search Filter No-Results Feedback */}
      {searchQuery && filteredDocuments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
          <Search className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">
            No se encontraron documentos con el criterio &quot;{searchQuery}&quot;
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Probá con otro término o limpiá la búsqueda para ver todos los archivos.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="mt-2 h-auto p-0 text-xs"
          >
            Limpiar búsqueda
          </Button>
        </div>
      )}

      {/* Main Fluid Grid Board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Upload Dropzone + "Sin categoría" Inbox */}
        <div className="space-y-4 lg:col-span-5 xl:col-span-4">
          {/* Upload Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Carga de archivos
              </h2>
            </div>
            <UploadDropzone
              onUpload={handleUpload}
              isUploading={isUploading}
            />
          </div>

          {/* Uncategorized Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bandeja de entrada
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Arrastrá a una categoría
              </span>
            </div>
            <CategoriaDropzone
              category={null}
              docs={uncategorizedDocs}
              categories={categories}
              onDropDoc={handleMoveCategory}
              onMoveCategory={handleMoveCategory}
              onDeleteDoc={handleDeleteDoc}
              className="border-slate-300/80 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/20"
            />
          </div>
        </div>

        {/* Right Column: Categorized Cards Grid */}
        <div className="space-y-4 lg:col-span-7 xl:col-span-8">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categorías de la Flota ({categories.length})
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Tablero interactivo Drag & Drop
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center bg-card">
              <Sparkles className="h-8 w-8 text-primary/60 mb-2 animate-pulse" />
              <h3 className="text-sm font-semibold text-foreground">
                Aún no creaste categorías personalizadas
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Creá categorías como Seguro, Cédula Verde, RTO o Service para clasificar los documentos con facilidad.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 gap-1.5"
                onClick={() => setIsDialogOpen(true)}
              >
                <FolderPlus className="h-4 w-4" />
                Crear primera categoría
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
              {categories.map((cat) => {
                const catDocs = filteredDocuments.filter(
                  (d) => d.categoryId === cat.id
                );
                return (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CategoriaDropzone
                      category={cat}
                      docs={catDocs}
                      categories={categories}
                      onDropDoc={handleMoveCategory}
                      onMoveCategory={handleMoveCategory}
                      onDeleteDoc={handleDeleteDoc}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Nueva Categoria Dialog */}
      <NuevaCategoriaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreate={handleCreateCategory}
      />
    </div>
  );
}

export default VehiculoDocumentos;
