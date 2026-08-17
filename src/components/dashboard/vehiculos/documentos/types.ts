export interface DocumentCategory {
  id: number;
  nombre: string;
  color: string;
  createdAt?: string | Date;
  empresaId?: number;
}

export interface VehicleDocumentItem {
  id: number;
  vehicleId: number;
  empresaId?: number;
  categoryId: number | null;
  title: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  fechaVencimiento?: string | Date | null;
  notas?: string | null;
  createdAt: string | Date;
  category?: DocumentCategory | null;
}

export interface CategoryColorOption {
  value: string;
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  ring: string;
  activeBg: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColorOption> = {
  blue: {
    value: "blue",
    label: "Azul",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/50",
    dot: "bg-blue-500",
    ring: "ring-blue-500",
    activeBg: "bg-blue-500",
  },
  emerald: {
    value: "emerald",
    label: "Esmeralda",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/50",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500",
    activeBg: "bg-emerald-500",
  },
  amber: {
    value: "amber",
    label: "Ámbar",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/50",
    dot: "bg-amber-500",
    ring: "ring-amber-500",
    activeBg: "bg-amber-500",
  },
  purple: {
    value: "purple",
    label: "Violeta",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/50",
    dot: "bg-purple-500",
    ring: "ring-purple-500",
    activeBg: "bg-purple-500",
  },
  rose: {
    value: "rose",
    label: "Rosa",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/50",
    dot: "bg-rose-500",
    ring: "ring-rose-500",
    activeBg: "bg-rose-500",
  },
  indigo: {
    value: "indigo",
    label: "Índigo",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800/50",
    dot: "bg-indigo-500",
    ring: "ring-indigo-500",
    activeBg: "bg-indigo-500",
  },
  cyan: {
    value: "cyan",
    label: "Cian",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800/50",
    dot: "bg-cyan-500",
    ring: "ring-cyan-500",
    activeBg: "bg-cyan-500",
  },
  slate: {
    value: "slate",
    label: "Gris",
    bg: "bg-slate-50 dark:bg-slate-900/30",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800/50",
    dot: "bg-slate-500",
    ring: "ring-slate-500",
    activeBg: "bg-slate-500",
  },
};

export function getCategoryColor(colorKey?: string | null): CategoryColorOption {
  if (!colorKey || !CATEGORY_COLORS[colorKey]) {
    return CATEGORY_COLORS.blue;
  }
  return CATEGORY_COLORS[colorKey];
}
