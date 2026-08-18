"use client";

import { useEffect, useState } from "react";
import {
  appAlert,
  ModalAlertOptions,
  ToastAlertOptions,
} from "@/lib/alerts";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function AppAlertProvider() {
  const [modal, setModal] = useState<ModalAlertOptions | null>(null);
  const [toasts, setToasts] = useState<ToastAlertOptions[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const unsubModal = appAlert.subscribeModal((options) => {
      setModal(options);
      setIsConfirming(false);
    });

    const unsubToast = appAlert.subscribeToast((toast) => {
      setToasts((prev) => [...prev, toast]);

      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    });

    return () => {
      unsubModal();
      unsubToast();
    };
  }, []);

  const handleConfirm = async () => {
    if (!modal) return;
    if (modal.onConfirm) {
      try {
        setIsConfirming(true);
        await modal.onConfirm();
      } catch (err) {
        console.error("Error in modal onConfirm handler:", err);
      } finally {
        setIsConfirming(false);
      }
    }
    setModal(null);
  };

  const handleCancel = () => {
    if (!modal) return;
    if (modal.onCancel) {
      modal.onCancel();
    }
    setModal(null);
  };

  const removeToast = (id?: string) => {
    if (!id) return;
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {/* 1. Modal Overlay Alert (Fixed on Top of Everything) */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl z-10"
              role="alertdialog"
              aria-modal="true"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 pt-0.5">
                  {modal.type === "success" && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  )}
                  {modal.type === "error" && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                  )}
                  {modal.type === "warning" && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  )}
                  {(!modal.type || modal.type === "info") && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Info className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {modal.title && (
                    <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">
                      {modal.title}
                    </h3>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {modal.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                {modal.cancelText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isConfirming}
                    className="h-9 px-4 rounded-lg"
                  >
                    {modal.cancelText}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={modal.type === "error" ? "destructive" : "default"}
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="h-9 px-5 rounded-lg shadow-sm"
                >
                  {isConfirming
                    ? "Procesando..."
                    : modal.confirmText || "Aceptar"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Floating Top-Right Toast Notifications Stack (Overlays viewport without shifting DOM) */}
      <div className="fixed top-5 right-5 z-[9990] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border/80 bg-background/95 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="shrink-0 pt-0.5">
                {t.type === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                {t.type === "error" && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {t.type === "warning" && (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                {(!t.type || t.type === "info") && (
                  <Info className="h-5 w-5 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-0.5">
                    {t.title}
                  </p>
                )}
                <p className="text-sm text-foreground/90 leading-snug">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 -mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
