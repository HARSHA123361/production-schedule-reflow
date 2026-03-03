import {
  ManufacturingOrderDoc,
  ReflowChange,
  ReflowInput,
  ReflowResult,
  WorkCenterDoc,
  WorkCenterUtilization,
  WorkOrderDoc,
} from './types';
import {
  calculateEndDateWithShifts,
  advanceToNextWorkingMinute,
  parseUtc,
  toUtcString,
  isWorkingTime,
} from '../utils/date-utils';
import { validateSchedule } from './constraint-checker';

interface DependencyGraph {
  order: WorkOrderDoc[];
}

function buildDependencyGraph(workOrders: WorkOrderDoc[]): DependencyGraph {
  const byId = new Map<string, WorkOrderDoc>();
  for (const wo of workOrders) {
    byId.set(wo.docId, wo);
  }

  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const wo of workOrders) {
    inDegree.set(wo.docId, 0);
  }

  for (const wo of workOrders) {
    for (const parentId of wo.data.dependsOnWorkOrderIds) {
      if (!byId.has(parentId)) {
        // Missing parents are handled in validation, treat as no edge for ordering.
        continue;
      }
      const list = adjacency.get(parentId) ?? [];
      list.push(wo.docId);
      adjacency.set(parentId, list);
      inDegree.set(wo.docId, (inDegree.get(wo.docId) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const ordered: WorkOrderDoc[] = [];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    const node = byId.get(id);
    if (node) {
      ordered.push(node);
    }
    const neighbors = adjacency.get(id) ?? [];
    for (const neighbor of neighbors) {
      const nextDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, nextDeg);
      if (nextDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (ordered.length !== workOrders.length) {
    const visited = new Set<string>();
    const path = new Set<string>();
    const order: string[] = [];

    const dfs = (nodeId: string): boolean => {
      if (path.has(nodeId)) {
        order.push(nodeId);
        return true;
      }
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      path.add(nodeId);
      order.push(nodeId);

      const deps = adjacency.get(nodeId) || [];
      for (const childId of deps) {
        if (dfs(childId)) return true;
      }

      path.delete(nodeId);
      order.pop();
      return false;
    };

    for (const wo of workOrders) {
      if (!visited.has(wo.docId)) {
        if (dfs(wo.docId)) {
          const lastNode = order[order.length - 1] as string;
          const cycleStart = order.indexOf(lastNode);
          const cyclePath = order.slice(cycleStart).join(' -> ');
          throw new Error(`Detected circular dependency among work orders: ${cyclePath}`);
        }
      }
    }
    throw new Error('Detected circular dependency among work orders.');
  }

  return { order: ordered };
}

function getWorkCenterMap(workCenters: WorkCenterDoc[]): Map<string, WorkCenterDoc> {
  const map = new Map<string, WorkCenterDoc>();
  for (const wc of workCenters) {
    map.set(wc.docId, wc);
  }
  return map;
}

function getLatestParentEnd(
  workOrder: WorkOrderDoc,
  scheduled: Map<string, WorkOrderDoc>,
  originalById: Map<string, WorkOrderDoc>,
): string | undefined {
  let latest: string | undefined;

  for (const parentId of workOrder.data.dependsOnWorkOrderIds) {
    const parent =
      scheduled.get(parentId) ??
      originalById.get(parentId);
    if (!parent) {
      continue;
    }
    const parentEnd = parent.data.endDate;
    if (!latest || parseUtc(parentEnd) > parseUtc(latest)) {
      latest = parentEnd;
    }
  }

  return latest;
}

export class ReflowService {
  private readonly workCentersById: Map<string, WorkCenterDoc>;

  constructor(
    private readonly workCenters: WorkCenterDoc[],
    private readonly manufacturingOrders: ManufacturingOrderDoc[],
  ) {
    this.workCentersById = getWorkCenterMap(workCenters);
  }

  public reflow(input: Omit<ReflowInput, 'workCenters' | 'manufacturingOrders'>): ReflowResult {
    const fullInput: ReflowInput = {
      workOrders: input.workOrders,
      workCenters: this.workCenters,
      manufacturingOrders: this.manufacturingOrders,
    };

    const graph = buildDependencyGraph(fullInput.workOrders);
    const ordered = graph.order.slice();

    const originalById = new Map<string, WorkOrderDoc>();
    for (const wo of fullInput.workOrders) {
      originalById.set(wo.docId, JSON.parse(JSON.stringify(wo)));
    }

    const nextFreeTimeByCenter = new Map<string, string>();
    const scheduledById = new Map<string, WorkOrderDoc>();
    const changes: ReflowChange[] = [];

    for (const wo of ordered) {
      const original = originalById.get(wo.docId);
      if (!original) {
        continue;
      }

      const workCenter = this.workCentersById.get(wo.data.workCenterId);
      if (!workCenter) {
        throw new Error(`Missing work center ${wo.data.workCenterId} for work order ${wo.docId}.`);
      }

      if (wo.data.isMaintenance) {
        scheduledById.set(wo.docId, { ...wo });
        changes.push({
          workOrderId: wo.docId,
          originalStartDate: original.data.startDate,
          originalEndDate: original.data.endDate,
          newStartDate: original.data.startDate,
          newEndDate: original.data.endDate,
          delayMinutes: 0,
          reasons: ['Maintenance work order; not rescheduled.'],
        });
        const currentNextFree = nextFreeTimeByCenter.get(wo.data.workCenterId);
        const originalEnd = original.data.endDate;
        if (!currentNextFree || parseUtc(originalEnd) > parseUtc(currentNextFree)) {
          nextFreeTimeByCenter.set(wo.data.workCenterId, originalEnd);
        }
        continue;
      }

      const parentLatestEnd = getLatestParentEnd(wo, scheduledById, originalById);

      let earliestStart = original.data.startDate;
      if (parentLatestEnd && parseUtc(parentLatestEnd) > parseUtc(earliestStart)) {
        earliestStart = parentLatestEnd;
      }

      const centerNextFree = nextFreeTimeByCenter.get(wo.data.workCenterId);
      if (centerNextFree && parseUtc(centerNextFree) > parseUtc(earliestStart)) {
        earliestStart = centerNextFree;
      }

      const startCandidate = parseUtc(earliestStart);
      const workingStart = advanceToNextWorkingMinute(
        startCandidate,
        workCenter.data.shifts,
        workCenter.data.maintenanceWindows,
      );

      const totalDuration =
        (wo.data.setupTimeMinutes ?? 0) + wo.data.durationMinutes;

      const newEnd = calculateEndDateWithShifts(
        toUtcString(workingStart),
        totalDuration,
        workCenter.data.shifts,
        workCenter.data.maintenanceWindows,
      );

      const updated: WorkOrderDoc = {
        ...wo,
        data: {
          ...wo.data,
          startDate: toUtcString(workingStart),
          endDate: newEnd,
        },
      };

      scheduledById.set(wo.docId, updated);
      nextFreeTimeByCenter.set(wo.data.workCenterId, newEnd);

      const delayMillis = parseUtc(newEnd).toMillis() - parseUtc(original.data.endDate).toMillis();
      const delayMinutes = Math.max(0, Math.round(delayMillis / (60 * 1000)));

      const reasons: string[] = [];
      if (parentLatestEnd && parseUtc(parentLatestEnd) > parseUtc(original.data.startDate)) {
        reasons.push('Delayed due to parent dependency finishing later than planned.');
      }
      if (centerNextFree && parseUtc(centerNextFree) > parseUtc(original.data.startDate)) {
        reasons.push('Delayed due to previous work on the same work center.');
      }

      if (reasons.length === 0 && delayMinutes > 0) {
        reasons.push('Work spans outside shift hours; paused and resumed next shift.');
      } else if (reasons.length === 0 && delayMinutes === 0) {
        reasons.push('No change from original schedule.');
      }

      changes.push({
        workOrderId: wo.docId,
        originalStartDate: original.data.startDate,
        originalEndDate: original.data.endDate,
        newStartDate: updated.data.startDate,
        newEndDate: updated.data.endDate,
        delayMinutes,
        reasons,
      });
    }

    const updatedWorkOrders = [...scheduledById.values()];

    const utilizations: WorkCenterUtilization[] = [];

    for (const wc of this.workCenters) {
      const centerOrders = updatedWorkOrders.filter(wo => wo.data.workCenterId === wc.docId && !wo.data.isMaintenance);
      if (centerOrders.length === 0) {
        utilizations.push({
          workCenterId: wc.docId,
          totalAvailableMinutes: 0,
          totalActiveMinutes: 0,
          utilizationPercentage: 0,
        });
        continue;
      }

      const firstOrder = centerOrders[0];
      if (!firstOrder) continue;

      let minStart = parseUtc(firstOrder.data.startDate);
      let maxEnd = parseUtc(firstOrder.data.endDate);
      let totalActiveMinutes = 0;

      for (const wo of centerOrders) {
        const start = parseUtc(wo.data.startDate);
        const end = parseUtc(wo.data.endDate);
        if (start < minStart) minStart = start;
        if (end > maxEnd) maxEnd = end;
        totalActiveMinutes += (wo.data.setupTimeMinutes ?? 0) + wo.data.durationMinutes;
      }

      let totalAvailableMinutes = 0;
      let curr = minStart;
      while (curr < maxEnd) {
        if (isWorkingTime(curr, wc.data.shifts, wc.data.maintenanceWindows)) {
          totalAvailableMinutes++;
        }
        curr = curr.plus({ minutes: 1 });
      }

      utilizations.push({
        workCenterId: wc.docId,
        totalAvailableMinutes,
        totalActiveMinutes,
        utilizationPercentage: totalAvailableMinutes > 0 ? (totalActiveMinutes / totalAvailableMinutes) * 100 : 0
      });
    }

    const violations = validateSchedule({
      workOrders: updatedWorkOrders,
      workCenters: this.workCenters,
      manufacturingOrders: this.manufacturingOrders,
    });
    if (violations.length > 0) {
      const details = violations.map((v) => v.message).join(' | ');
      throw new Error(`Reflow produced invalid schedule: ${details}`);
    }

    const explanationLines: string[] = [];
    explanationLines.push('Reflow completed. Key changes:');
    for (const change of changes) {
      explanationLines.push(
        `- Work order ${change.workOrderId} moved by ${change.delayMinutes} minutes. Reasons: ${change.reasons.join(
          '; ',
        )}`,
      );
    }

    const explanation = explanationLines.join('\n');

    return {
      updatedWorkOrders,
      changes,
      utilizations,
      explanation,
    };
  }
}

