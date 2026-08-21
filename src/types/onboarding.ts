export interface TenantOnboardingStep {
  id: "alerts" | "vehicles" | "users" | "maintenance";
  title: string;
  description: string;
  completed: boolean;
  href: string;
  actionLabel: string;
  badgeText?: string;
}

export interface TenantOnboardingStatus {
  isCompleted: boolean;
  progressPercent: number;
  empresaNombre: string;
  empresaId: number;
  completedStepsCount: number;
  totalStepsCount: number;
  steps: {
    alerts: boolean;
    vehicles: boolean;
    users: boolean;
    maintenance: boolean;
  };
  stepItems: TenantOnboardingStep[];
  counts: {
    vehicles: number;
    users: number;
    hasAlertConfig: boolean;
    maintenancePlans: number;
  };
}
