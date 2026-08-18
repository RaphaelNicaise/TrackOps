export type AlertType = "success" | "error" | "warning" | "info";

export interface ModalAlertOptions {
  type?: AlertType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ToastAlertOptions {
  id?: string;
  type?: AlertType;
  title?: string;
  message: string;
  duration?: number; // ms
}

type ModalListener = (options: ModalAlertOptions | null) => void;
type ToastListener = (toast: ToastAlertOptions) => void;

class AlertManager {
  private modalListeners: Set<ModalListener> = new Set();
  private toastListeners: Set<ToastListener> = new Set();

  subscribeModal(listener: ModalListener) {
    this.modalListeners.add(listener);
    return () => {
      this.modalListeners.delete(listener);
    };
  }

  subscribeToast(listener: ToastListener) {
    this.toastListeners.add(listener);
    return () => {
      this.toastListeners.delete(listener);
    };
  }

  // Open modal alert overlay
  modal(options: ModalAlertOptions) {
    this.modalListeners.forEach((listener) => listener(options));
  }

  closeModal() {
    this.modalListeners.forEach((listener) => listener(null));
  }

  // Show floating toast alert
  toast(options: ToastAlertOptions) {
    const toastData: ToastAlertOptions = {
      id: options.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      duration: options.duration ?? 4000,
      ...options,
    };
    this.toastListeners.forEach((listener) => listener(toastData));
  }

  // Quick helper methods
  success(message: string, title = "Operación exitosa") {
    this.toast({ type: "success", title, message });
  }

  error(message: string, title = "Error") {
    this.toast({ type: "error", title, message, duration: 6000 });
  }

  warning(message: string, title = "Atención") {
    this.toast({ type: "warning", title, message, duration: 5000 });
  }

  info(message: string, title = "Información") {
    this.toast({ type: "info", title, message });
  }

  // Modal helpers for critical prompts / errors
  modalError(message: string, title = "Error") {
    this.modal({ type: "error", title, message, confirmText: "Entendido" });
  }

  modalSuccess(message: string, title = "Completado") {
    this.modal({ type: "success", title, message, confirmText: "Aceptar" });
  }

  confirm(message: string, onConfirm: () => void | Promise<void>, title = "¿Estás seguro?") {
    this.modal({
      type: "warning",
      title,
      message,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      onConfirm,
    });
  }
}

export const appAlert = new AlertManager();
