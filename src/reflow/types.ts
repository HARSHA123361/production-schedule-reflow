export type DocType = 'workOrder' | 'workCenter' | 'manufacturingOrder';

export interface BaseDocument<TDocType extends DocType, TData> {
  docId: string;
  docType: TDocType;
  data: TData;
}

export interface WorkOrderData {
  workOrderNumber: string;
  manufacturingOrderId: string;
  workCenterId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  isMaintenance: boolean;
  dependsOnWorkOrderIds: string[];
  setupTimeMinutes?: number;
}

export type WorkOrderDoc = BaseDocument<'workOrder', WorkOrderData>;

export interface WorkCenterShift {
  dayOfWeek: number; // 0-6, Sunday = 0
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface WorkCenterMaintenanceWindow {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface WorkCenterData {
  name: string;
  shifts: WorkCenterShift[];
  maintenanceWindows: WorkCenterMaintenanceWindow[];
}

export type WorkCenterDoc = BaseDocument<'workCenter', WorkCenterData>;

export interface ManufacturingOrderData {
  manufacturingOrderNumber: string;
  itemId: string;
  quantity: number;
  dueDate: string;
}

export type ManufacturingOrderDoc = BaseDocument<'manufacturingOrder', ManufacturingOrderData>;

export interface ReflowInput {
  workOrders: WorkOrderDoc[];
  workCenters: WorkCenterDoc[];
  manufacturingOrders: ManufacturingOrderDoc[];
}

export interface ReflowChange {
  workOrderId: string;
  originalStartDate: string;
  originalEndDate: string;
  newStartDate: string;
  newEndDate: string;
  delayMinutes: number;
  reasons: string[];
}

export interface WorkCenterUtilization {
  workCenterId: string;
  totalAvailableMinutes: number;
  totalActiveMinutes: number;
  utilizationPercentage: number;
}

export interface ReflowResult {
  updatedWorkOrders: WorkOrderDoc[];
  changes: ReflowChange[];
  utilizations: WorkCenterUtilization[];
  explanation: string;
}

