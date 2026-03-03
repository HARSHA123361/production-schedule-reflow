import {
  ReflowInput,
  WorkOrderDoc,
  WorkCenterDoc,
} from './types';
import { parseUtc } from '../utils/date-utils';

interface ConstraintViolation {
  type: 'dependency' | 'workCenterConflict' | 'shift' | 'maintenance';
  message: string;
  workOrderId?: string;
}

function getWorkCenterMap(workCenters: WorkCenterDoc[]): Map<string, WorkCenterDoc> {
  const map = new Map<string, WorkCenterDoc>();
  for (const wc of workCenters) {
    map.set(wc.docId, wc);
  }
  return map;
}

function validateDependencies(workOrders: WorkOrderDoc[]): ConstraintViolation[] {
  const byId = new Map<string, WorkOrderDoc>();
  for (const wo of workOrders) {
    byId.set(wo.docId, wo);
  }

  const violations: ConstraintViolation[] = [];

  for (const wo of workOrders) {
    const start = parseUtc(wo.data.startDate);
    for (const parentId of wo.data.dependsOnWorkOrderIds) {
      const parent = byId.get(parentId);
      if (!parent) {
        violations.push({
          type: 'dependency',
          message: `Work order ${wo.docId} depends on missing parent ${parentId}.`,
          workOrderId: wo.docId,
        });
        continue;
      }
      const parentEnd = parseUtc(parent.data.endDate);
      if (parentEnd > start) {
        violations.push({
          type: 'dependency',
          message: `Work order ${wo.docId} starts before parent ${parentId} ends.`,
          workOrderId: wo.docId,
        });
      }
    }
  }

  return violations;
}

function validateWorkCenterConflicts(
  workOrders: WorkOrderDoc[],
  workCenters: WorkCenterDoc[],
): ConstraintViolation[] {
  const byCenter = new Map<string, WorkOrderDoc[]>();
  for (const wo of workOrders) {
    const list = byCenter.get(wo.data.workCenterId) ?? [];
    list.push(wo);
    byCenter.set(wo.data.workCenterId, list);
  }

  const violations: ConstraintViolation[] = [];
  const wcMap = getWorkCenterMap(workCenters);

  for (const [centerId, list] of byCenter.entries()) {
    if (!wcMap.has(centerId)) {
      continue;
    }

    const sorted = list
      .map((wo) => ({
        wo,
        start: parseUtc(wo.data.startDate),
        end: parseUtc(wo.data.endDate),
      }))
      .sort((a, b) => a.start.toMillis() - b.start.toMillis());

    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1]!;
      const curr = sorted[i]!;
      if (curr.start < prev.end) {
        violations.push({
          type: 'workCenterConflict',
          message: `Work orders ${prev.wo.docId} and ${curr.wo.docId} overlap on work center ${centerId}.`,
          workOrderId: curr.wo.docId,
        });
      }
    }
  }

  return violations;
}

export function validateSchedule(input: ReflowInput): ConstraintViolation[] {
  const { workOrders, workCenters } = input;

  const violations: ConstraintViolation[] = [];

  violations.push(...validateDependencies(workOrders));
  violations.push(...validateWorkCenterConflicts(workOrders, workCenters));

  // Shift and maintenance correctness are enforced during scheduling via date-utils.
  // Additional validation can be added here if needed.

  return violations;
}

