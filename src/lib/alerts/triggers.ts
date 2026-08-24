import { db } from "@/db";
import {
  vehicles,
  maintenancePlans,
  vehicleDocuments,
} from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { dispatchAlert, getCompanyAlertConfig } from "@/lib/alerts/dispatcher";
import type {
  AlertModule,
  AlertSeverity,
  DispatchAlertResult,
} from "@/types/alerts";
import { mockVehiculos } from "@/lib/mock-vehicles";
import { mockDocumentsStore } from "@/lib/mock-documents";
import { DEMO_EMPRESA_ID } from "@/lib/demo-mode";

export interface MockMaintenancePlan {
  id: number;
  vehicleId: number;
  empresaId: number;
  patente?: string;
  modelo?: string;
  marca?: string;
  componente: string;
  intervaloKm: number;
  ultimoServiceKm: number;
  kilometrajeActual?: number;
}

export interface MockTriggerDocument {
  id: number;
  vehicleId: number;
  empresaId: number;
  patente?: string;
  title: string;
  fechaVencimiento: Date | string | null;
}

export interface TriggerEvaluationResult {
  tipo: string;
  modulo: AlertModule;
  severidad: AlertSeverity;
  patente: string;
  vehiculoId?: number;
  titulo: string;
  mensaje: string;
  dispatchResult: DispatchAlertResult;
  metadata?: Record<string, any>;
}

export interface FleetScanSummary {
  empresaId: number;
  scannedAt: Date;
  maintenance: TriggerEvaluationResult[];
  documents: TriggerEvaluationResult[];
  totalTriggered: number;
}

export interface GeofenceAlertTriggerParams {
  empresaId: number;
  vehicleId?: number;
  patente: string;
  geofenceId?: number;
  geofenceName: string;
  eventType: "EXIT" | "ENTER" | "SPEED_LIMIT";
  currentSpeed?: number;
  speedLimit?: number;
}

export interface ScheduleAlertTriggerParams {
  empresaId: number;
  vehicleId?: number;
  patente: string;
  scheduleId?: number;
  scheduleName: string;
  violationReason: string;
  currentSpeed?: number;
  lat?: number;
  lng?: number;
}

// In-memory mock stores for tests & offline fallback
const DEFAULT_MOCK_MAINTENANCE_PLANS: MockMaintenancePlan[] = [
  {
    id: 1,
    vehicleId: 1,
    empresaId: 1,
    patente: "AB 123 CD",
    modelo: "Ranger",
    marca: "Ford",
    componente: "Aceite y Filtros",
    intervaloKm: 10000,
    ultimoServiceKm: 115000,
    kilometrajeActual: 125430, // Exceeded by 430 km -> SERVICE_VENCIDO
  },
  {
    id: 2,
    vehicleId: 3,
    empresaId: 1,
    patente: "IJ 789 KL",
    modelo: "Kangoo",
    marca: "Renault",
    componente: "Pastillas de Freno",
    intervaloKm: 20000,
    ultimoServiceKm: 25500,
    kilometrajeActual: 45100, // Due at 45500 (400 km remaining <= 500 km tolerance) -> SERVICE_PROXIMO
  },
  {
    id: 3,
    vehicleId: 5,
    empresaId: 1,
    patente: "QR 345 ST",
    modelo: "Cronos",
    marca: "Fiat",
    componente: "Correa de Distribución",
    intervaloKm: 60000,
    ultimoServiceKm: 20000,
    kilometrajeActual: 67900, // Due at 80000 -> Normal
  },
];

let mockMaintenancePlansStore: MockMaintenancePlan[] | null = null;
let mockTriggerDocumentsStore: MockTriggerDocument[] | null = null;

export function setMockMaintenancePlans(plans: MockMaintenancePlan[]): void {
  mockMaintenancePlansStore = [...plans];
}

export function resetMockMaintenancePlans(): void {
  mockMaintenancePlansStore = null;
}

export function setMockTriggerDocuments(docs: MockTriggerDocument[]): void {
  mockTriggerDocumentsStore = [...docs];
}

export function resetMockTriggerDocuments(): void {
  mockTriggerDocumentsStore = null;
}

function isDbAvailable(): boolean {
  if ((process.env.NODE_ENV === "test" || process.env.VITEST) && !process.env.DATABASE_URL) {
    const isMocked =
      typeof (db?.select as any)?._isMockFunction === "boolean" ||
      typeof (db?.select as any)?.mock === "object";
    return isMocked;
  }
  return true;
}

/**
 * Evaluates preventative and overdue maintenance service intervals for all vehicles in a company.
 * Dispatches SERVICE_VENCIDO (ALTA) or SERVICE_PROXIMO (MEDIA) alerts.
 */
export async function evaluateMaintenanceAlerts(
  empresaId: number
): Promise<TriggerEvaluationResult[]> {
  const config = await getCompanyAlertConfig(empresaId);
  const toleranciaKm = config.toleranciaKm ?? 500;
  const triggered: TriggerEvaluationResult[] = [];

  let plansToEvaluate: Array<{
    id: number;
    vehicleId: number;
    patente: string;
    modelo?: string;
    marca?: string;
    componente: string;
    intervaloKm: number;
    ultimoServiceKm: number;
    kilometrajeActual: number;
  }> = [];

  if (mockMaintenancePlansStore !== null) {
    plansToEvaluate = mockMaintenancePlansStore
      .filter((p) => p.empresaId === empresaId)
      .map((p) => ({
        id: p.id,
        vehicleId: p.vehicleId,
        patente: p.patente || "DESCONOCIDO",
        modelo: p.modelo,
        marca: p.marca,
        componente: p.componente,
        intervaloKm: p.intervaloKm,
        ultimoServiceKm: p.ultimoServiceKm,
        kilometrajeActual: p.kilometrajeActual ?? 0,
      }));
  } else if (isDbAvailable()) {
    try {
      const rows = await db
        .select({
          id: maintenancePlans.id,
          vehicleId: vehicles.id,
          patente: vehicles.patente,
          modelo: vehicles.modelo,
          marca: vehicles.marca,
          componente: maintenancePlans.componente,
          intervaloKm: maintenancePlans.intervaloKm,
          ultimoServiceKm: maintenancePlans.ultimoServiceKm,
          kilometrajeActual: vehicles.kilometrajeActual,
        })
        .from(maintenancePlans)
        .innerJoin(vehicles, eq(maintenancePlans.vehicleId, vehicles.id))
        .where(eq(vehicles.empresaId, empresaId));

      if (rows && rows.length > 0) {
        plansToEvaluate = rows;
      }
    } catch {
      // Fall back to default mock maintenance plans
    }
  }

  if (
    plansToEvaluate.length === 0 &&
    mockMaintenancePlansStore === null &&
    empresaId === DEMO_EMPRESA_ID
  ) {
    plansToEvaluate = DEFAULT_MOCK_MAINTENANCE_PLANS.filter(
      (p) => p.empresaId === empresaId
    ).map((p) => ({
      id: p.id,
      vehicleId: p.vehicleId,
      patente: p.patente || "DESCONOCIDO",
      modelo: p.modelo,
      marca: p.marca,
      componente: p.componente,
      intervaloKm: p.intervaloKm,
      ultimoServiceKm: p.ultimoServiceKm,
      kilometrajeActual: p.kilometrajeActual ?? 0,
    }));
  }

  for (const plan of plansToEvaluate) {
    const proximoServiceKm = plan.ultimoServiceKm + plan.intervaloKm;
    const kmRestantes = proximoServiceKm - plan.kilometrajeActual;
    const kmExcedidos = plan.kilometrajeActual - proximoServiceKm;

    if (plan.kilometrajeActual >= proximoServiceKm) {
      // Vencido
      const titulo = `Service Vencido: ${plan.patente} - ${plan.componente}`;
      const mensaje = `El vehículo ${plan.patente} ha superado el intervalo de service para "${
        plan.componente
      }" por ${kmExcedidos.toLocaleString("es-AR")} km (Km actual: ${plan.kilometrajeActual.toLocaleString(
        "es-AR"
      )} km, Venció a los: ${proximoServiceKm.toLocaleString("es-AR")} km).`;

      const metadata = {
        planId: plan.id,
        vehicleId: plan.vehicleId,
        patente: plan.patente,
        componente: plan.componente,
        kilometrajeActual: plan.kilometrajeActual,
        proximoServiceKm,
        kmExcedidos,
      };

      const dispatchResult = await dispatchAlert({
        empresaId,
        modulo: "MANTENIMIENTO",
        tipo: "SERVICE_VENCIDO",
        severidad: "ALTA",
        titulo,
        mensaje,
        vehiculoId: plan.vehicleId,
        patente: plan.patente,
        metadata,
      });

      triggered.push({
        tipo: "SERVICE_VENCIDO",
        modulo: "MANTENIMIENTO",
        severidad: "ALTA",
        patente: plan.patente,
        vehiculoId: plan.vehicleId,
        titulo,
        mensaje,
        dispatchResult,
        metadata,
      });
    } else if (kmRestantes <= toleranciaKm) {
      // Próximo a vencer
      const titulo = `Próximo Service: ${plan.patente} - ${plan.componente}`;
      const mensaje = `El vehículo ${plan.patente} está próximo a su service de "${
        plan.componente
      }" en ${kmRestantes.toLocaleString("es-AR")} km (Km actual: ${plan.kilometrajeActual.toLocaleString(
        "es-AR"
      )} km, Service a los: ${proximoServiceKm.toLocaleString("es-AR")} km).`;

      const metadata = {
        planId: plan.id,
        vehicleId: plan.vehicleId,
        patente: plan.patente,
        componente: plan.componente,
        kilometrajeActual: plan.kilometrajeActual,
        proximoServiceKm,
        kmRestantes,
      };

      const dispatchResult = await dispatchAlert({
        empresaId,
        modulo: "MANTENIMIENTO",
        tipo: "SERVICE_PROXIMO",
        severidad: "MEDIA",
        titulo,
        mensaje,
        vehiculoId: plan.vehicleId,
        patente: plan.patente,
        metadata,
      });

      triggered.push({
        tipo: "SERVICE_PROXIMO",
        modulo: "MANTENIMIENTO",
        severidad: "MEDIA",
        patente: plan.patente,
        vehiculoId: plan.vehicleId,
        titulo,
        mensaje,
        dispatchResult,
        metadata,
      });
    }
  }

  return triggered;
}

/**
 * Evaluates document and RTO expiration dates for all vehicles in a company.
 * Dispatches DOC_VENCIDO (ALTA) or DOC_POR_VENCER (MEDIA) alerts.
 */
export async function evaluateDocumentAlerts(
  empresaId: number
): Promise<TriggerEvaluationResult[]> {
  const config = await getCompanyAlertConfig(empresaId);
  const toleranciaDias = config.toleranciaDias ?? 15;
  const triggered: TriggerEvaluationResult[] = [];

  let docsToEvaluate: Array<{
    id: number;
    vehicleId: number;
    patente: string;
    title: string;
    fechaVencimiento: Date;
  }> = [];

  if (mockTriggerDocumentsStore !== null) {
    docsToEvaluate = mockTriggerDocumentsStore
      .filter((d) => d.empresaId === empresaId && d.fechaVencimiento)
      .map((d) => ({
        id: d.id,
        vehicleId: d.vehicleId,
        patente: d.patente || "DESCONOCIDO",
        title: d.title,
        fechaVencimiento: new Date(d.fechaVencimiento!),
      }));
  } else if (isDbAvailable()) {
    try {
      // 1. Vehicle documents
      const docRows = await db
        .select({
          id: vehicleDocuments.id,
          vehicleId: vehicleDocuments.vehicleId,
          patente: vehicles.patente,
          title: vehicleDocuments.title,
          fechaVencimiento: vehicleDocuments.fechaVencimiento,
        })
        .from(vehicleDocuments)
        .innerJoin(vehicles, eq(vehicleDocuments.vehicleId, vehicles.id))
        .where(
          and(
            eq(vehicleDocuments.empresaId, empresaId),
            isNotNull(vehicleDocuments.fechaVencimiento)
          )
        );

      if (docRows && docRows.length > 0) {
        docsToEvaluate.push(
          ...docRows.map((r) => ({
            id: r.id,
            vehicleId: r.vehicleId,
            patente: r.patente,
            title: r.title,
            fechaVencimiento: new Date(r.fechaVencimiento!),
          }))
        );
      }

      // 2. Vehicles RTO
      const rtoRows = await db
        .select({
          id: vehicles.id,
          patente: vehicles.patente,
          rto: vehicles.rto,
        })
        .from(vehicles)
        .where(and(eq(vehicles.empresaId, empresaId), isNotNull(vehicles.rto)));

      if (rtoRows && rtoRows.length > 0) {
        docsToEvaluate.push(
          ...rtoRows.map((r) => ({
            id: r.id + 10000,
            vehicleId: r.id,
            patente: r.patente,
            title: "Revisión Técnica Obligatoria (RTO / VTV)",
            fechaVencimiento: new Date(r.rto!),
          }))
        );
      }
    } catch {
      // Fall back to mock documents
    }
  }

  if (
    docsToEvaluate.length === 0 &&
    mockTriggerDocumentsStore === null &&
    empresaId === DEMO_EMPRESA_ID
  ) {
    // Default fallback from mock-documents.ts & mock-vehicles.ts (solo cuenta demo)
    // Default fallback from mock-documents.ts & mock-vehicles.ts
    const mockDocs = mockDocumentsStore.filter(
      (d) => d.empresaId === empresaId && d.fechaVencimiento
    );
    for (const doc of mockDocs) {
      const veh = mockVehiculos.find((v) => v.id === doc.vehicleId);
      docsToEvaluate.push({
        id: doc.id,
        vehicleId: doc.vehicleId,
        patente: veh ? veh.patente : "DESCONOCIDO",
        title: doc.title,
        fechaVencimiento: new Date(doc.fechaVencimiento!),
      });
    }

    const mockRtoVehs = mockVehiculos.filter((v) => v.rto);
    for (const veh of mockRtoVehs) {
      docsToEvaluate.push({
        id: veh.id + 10000,
        vehicleId: veh.id,
        patente: veh.patente,
        title: "Revisión Técnica Obligatoria (RTO / VTV)",
        fechaVencimiento: new Date(veh.rto!),
      });
    }
  }

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;

  for (const doc of docsToEvaluate) {
    const diffMs = doc.fechaVencimiento.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / msPerDay);
    const dateFormatted = doc.fechaVencimiento.toLocaleDateString("es-AR");

    if (diffMs < 0) {
      // Expired document
      const diasVencido = Math.abs(diffDays);
      const titulo = `Documento Vencido: ${doc.patente} - ${doc.title}`;
      const mensaje = `El documento "${doc.title}" del vehículo ${doc.patente} se encuentra vencido desde ${dateFormatted} (${diasVencido} días vencido).`;

      const metadata = {
        docId: doc.id,
        vehicleId: doc.vehicleId,
        patente: doc.patente,
        title: doc.title,
        fechaVencimiento: doc.fechaVencimiento.toISOString(),
        diasVencido,
      };

      const dispatchResult = await dispatchAlert({
        empresaId,
        modulo: "DOCUMENTACION",
        tipo: "DOC_VENCIDO",
        severidad: "ALTA",
        titulo,
        mensaje,
        vehiculoId: doc.vehicleId,
        patente: doc.patente,
        metadata,
      });

      triggered.push({
        tipo: "DOC_VENCIDO",
        modulo: "DOCUMENTACION",
        severidad: "ALTA",
        patente: doc.patente,
        vehiculoId: doc.vehicleId,
        titulo,
        mensaje,
        dispatchResult,
        metadata,
      });
    } else if (diffDays <= toleranciaDias) {
      // Expiring soon
      const titulo = `Documento por Vencer: ${doc.patente} - ${doc.title}`;
      const mensaje = `El documento "${doc.title}" del vehículo ${doc.patente} vencerá en ${diffDays} días (${dateFormatted}).`;

      const metadata = {
        docId: doc.id,
        vehicleId: doc.vehicleId,
        patente: doc.patente,
        title: doc.title,
        fechaVencimiento: doc.fechaVencimiento.toISOString(),
        diasRestantes: diffDays,
      };

      const dispatchResult = await dispatchAlert({
        empresaId,
        modulo: "DOCUMENTACION",
        tipo: "DOC_POR_VENCER",
        severidad: "MEDIA",
        titulo,
        mensaje,
        vehiculoId: doc.vehicleId,
        patente: doc.patente,
        metadata,
      });

      triggered.push({
        tipo: "DOC_POR_VENCER",
        modulo: "DOCUMENTACION",
        severidad: "MEDIA",
        patente: doc.patente,
        vehiculoId: doc.vehicleId,
        titulo,
        mensaje,
        dispatchResult,
        metadata,
      });
    }
  }

  return triggered;
}

/**
 * Triggers an immediate geofence alert (Exit, Enter, Speed Limit)
 */
export async function triggerGeofenceAlert(
  params: GeofenceAlertTriggerParams
): Promise<DispatchAlertResult> {
  const severidad: AlertSeverity = params.eventType === "ENTER" ? "MEDIA" : "ALTA";
  const tipo = `GEOCERCA_${params.eventType}`;

  let titulo = "";
  let mensaje = "";

  if (params.eventType === "EXIT") {
    titulo = `Salida de Geocerca: ${params.patente} en ${params.geofenceName}`;
    mensaje = `El vehículo ${params.patente} ha salido del perímetro de la geocerca "${params.geofenceName}".`;
  } else if (params.eventType === "ENTER") {
    titulo = `Entrada a Geocerca: ${params.patente} en ${params.geofenceName}`;
    mensaje = `El vehículo ${params.patente} ha ingresado al perímetro de la geocerca "${params.geofenceName}".`;
  } else if (params.eventType === "SPEED_LIMIT") {
    titulo = `Exceso de Velocidad en Geocerca: ${params.patente} en ${params.geofenceName}`;
    mensaje = `El vehículo ${params.patente} excedió el límite de velocidad en "${
      params.geofenceName
    }" registrando ${params.currentSpeed ?? 0} km/h (Límite: ${params.speedLimit ?? 0} km/h).`;
  }

  return dispatchAlert({
    empresaId: params.empresaId,
    modulo: "GEOCERCAS",
    tipo,
    severidad,
    titulo,
    mensaje,
    vehiculoId: params.vehicleId,
    patente: params.patente,
    metadata: {
      geofenceId: params.geofenceId,
      geofenceName: params.geofenceName,
      eventType: params.eventType,
      currentSpeed: params.currentSpeed,
      speedLimit: params.speedLimit,
      triggeredAt: new Date().toISOString(),
    },
  });
}

/**
 * Triggers an immediate schedule violation alert (CRITICA)
 */
export async function triggerScheduleAlert(
  params: ScheduleAlertTriggerParams
): Promise<DispatchAlertResult> {
  const titulo = `Uso no autorizado fuera de horario (${params.scheduleName}): ${params.patente}`;
  const speedDetail =
    params.currentSpeed !== undefined ? `. Velocidad: ${params.currentSpeed} km/h` : "";
  const mensaje = `El vehículo ${params.patente} registró actividad no autorizada en el horario "${params.scheduleName}". Motivo: ${params.violationReason}${speedDetail}.`;

  return dispatchAlert({
    empresaId: params.empresaId,
    modulo: "HORARIOS",
    tipo: "HORARIO_NO_AUTORIZADO",
    severidad: "CRITICA",
    titulo,
    mensaje,
    vehiculoId: params.vehicleId,
    patente: params.patente,
    metadata: {
      scheduleId: params.scheduleId,
      scheduleName: params.scheduleName,
      violationReason: params.violationReason,
      currentSpeed: params.currentSpeed,
      lat: params.lat,
      lng: params.lng,
      triggeredAt: new Date().toISOString(),
    },
  });
}

/**
 * Scans all preventative maintenance plans and document expirations across the fleet,
 * dispatching corresponding alerts and returning a consolidated summary.
 */
export async function scanAllFleetAlerts(
  empresaId: number
): Promise<FleetScanSummary> {
  const maintenance = await evaluateMaintenanceAlerts(empresaId);
  const documents = await evaluateDocumentAlerts(empresaId);

  return {
    empresaId,
    scannedAt: new Date(),
    maintenance,
    documents,
    totalTriggered: maintenance.length + documents.length,
  };
}
