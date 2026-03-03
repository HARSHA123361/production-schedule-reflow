"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReflowService = void 0;
const date_utils_1 = require("../utils/date-utils");
const constraint_checker_1 = require("./constraint-checker");
function buildDependencyGraph(workOrders) {
    var _a, _b, _c, _d;
    const byId = new Map();
    for (const wo of workOrders) {
        byId.set(wo.docId, wo);
    }
    const inDegree = new Map();
    const adjacency = new Map();
    for (const wo of workOrders) {
        inDegree.set(wo.docId, 0);
    }
    for (const wo of workOrders) {
        for (const parentId of wo.data.dependsOnWorkOrderIds) {
            if (!byId.has(parentId)) {
                // Missing parents are handled in validation, treat as no edge for ordering.
                continue;
            }
            const list = (_a = adjacency.get(parentId)) !== null && _a !== void 0 ? _a : [];
            list.push(wo.docId);
            adjacency.set(parentId, list);
            inDegree.set(wo.docId, ((_b = inDegree.get(wo.docId)) !== null && _b !== void 0 ? _b : 0) + 1);
        }
    }
    const queue = [];
    for (const [id, deg] of inDegree.entries()) {
        if (deg === 0) {
            queue.push(id);
        }
    }
    const ordered = [];
    while (queue.length > 0) {
        const id = queue.shift();
        const node = byId.get(id);
        if (node) {
            ordered.push(node);
        }
        const neighbors = (_c = adjacency.get(id)) !== null && _c !== void 0 ? _c : [];
        for (const neighbor of neighbors) {
            const nextDeg = ((_d = inDegree.get(neighbor)) !== null && _d !== void 0 ? _d : 0) - 1;
            inDegree.set(neighbor, nextDeg);
            if (nextDeg === 0) {
                queue.push(neighbor);
            }
        }
    }
    if (ordered.length !== workOrders.length) {
        const visited = new Set();
        const path = new Set();
        const order = [];
        const dfs = (nodeId) => {
            if (path.has(nodeId)) {
                order.push(nodeId);
                return true;
            }
            if (visited.has(nodeId))
                return false;
            visited.add(nodeId);
            path.add(nodeId);
            order.push(nodeId);
            const deps = adjacency.get(nodeId) || [];
            for (const childId of deps) {
                if (dfs(childId))
                    return true;
            }
            path.delete(nodeId);
            order.pop();
            return false;
        };
        for (const wo of workOrders) {
            if (!visited.has(wo.docId)) {
                if (dfs(wo.docId)) {
                    const lastNode = order[order.length - 1];
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
function getWorkCenterMap(workCenters) {
    const map = new Map();
    for (const wc of workCenters) {
        map.set(wc.docId, wc);
    }
    return map;
}
function getLatestParentEnd(workOrder, scheduled, originalById) {
    var _a;
    let latest;
    for (const parentId of workOrder.data.dependsOnWorkOrderIds) {
        const parent = (_a = scheduled.get(parentId)) !== null && _a !== void 0 ? _a : originalById.get(parentId);
        if (!parent) {
            continue;
        }
        const parentEnd = parent.data.endDate;
        if (!latest || (0, date_utils_1.parseUtc)(parentEnd) > (0, date_utils_1.parseUtc)(latest)) {
            latest = parentEnd;
        }
    }
    return latest;
}
class ReflowService {
    constructor(workCenters, manufacturingOrders) {
        this.workCenters = workCenters;
        this.manufacturingOrders = manufacturingOrders;
        this.workCentersById = getWorkCenterMap(workCenters);
    }
    reflow(input) {
        var _a, _b;
        const fullInput = {
            workOrders: input.workOrders,
            workCenters: this.workCenters,
            manufacturingOrders: this.manufacturingOrders,
        };
        const graph = buildDependencyGraph(fullInput.workOrders);
        const ordered = graph.order.slice();
        const originalById = new Map();
        for (const wo of fullInput.workOrders) {
            originalById.set(wo.docId, JSON.parse(JSON.stringify(wo)));
        }
        const nextFreeTimeByCenter = new Map();
        const scheduledById = new Map();
        const changes = [];
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
                if (!currentNextFree || (0, date_utils_1.parseUtc)(originalEnd) > (0, date_utils_1.parseUtc)(currentNextFree)) {
                    nextFreeTimeByCenter.set(wo.data.workCenterId, originalEnd);
                }
                continue;
            }
            const parentLatestEnd = getLatestParentEnd(wo, scheduledById, originalById);
            let earliestStart = original.data.startDate;
            if (parentLatestEnd && (0, date_utils_1.parseUtc)(parentLatestEnd) > (0, date_utils_1.parseUtc)(earliestStart)) {
                earliestStart = parentLatestEnd;
            }
            const centerNextFree = nextFreeTimeByCenter.get(wo.data.workCenterId);
            if (centerNextFree && (0, date_utils_1.parseUtc)(centerNextFree) > (0, date_utils_1.parseUtc)(earliestStart)) {
                earliestStart = centerNextFree;
            }
            const startCandidate = (0, date_utils_1.parseUtc)(earliestStart);
            const workingStart = (0, date_utils_1.advanceToNextWorkingMinute)(startCandidate, workCenter.data.shifts, workCenter.data.maintenanceWindows);
            const totalDuration = ((_a = wo.data.setupTimeMinutes) !== null && _a !== void 0 ? _a : 0) + wo.data.durationMinutes;
            const newEnd = (0, date_utils_1.calculateEndDateWithShifts)((0, date_utils_1.toUtcString)(workingStart), totalDuration, workCenter.data.shifts, workCenter.data.maintenanceWindows);
            const updated = {
                ...wo,
                data: {
                    ...wo.data,
                    startDate: (0, date_utils_1.toUtcString)(workingStart),
                    endDate: newEnd,
                },
            };
            scheduledById.set(wo.docId, updated);
            nextFreeTimeByCenter.set(wo.data.workCenterId, newEnd);
            const delayMillis = (0, date_utils_1.parseUtc)(newEnd).toMillis() - (0, date_utils_1.parseUtc)(original.data.endDate).toMillis();
            const delayMinutes = Math.max(0, Math.round(delayMillis / (60 * 1000)));
            const reasons = [];
            if (parentLatestEnd && (0, date_utils_1.parseUtc)(parentLatestEnd) > (0, date_utils_1.parseUtc)(original.data.startDate)) {
                reasons.push('Delayed due to parent dependency finishing later than planned.');
            }
            if (centerNextFree && (0, date_utils_1.parseUtc)(centerNextFree) > (0, date_utils_1.parseUtc)(original.data.startDate)) {
                reasons.push('Delayed due to previous work on the same work center.');
            }
            if (reasons.length === 0 && delayMinutes > 0) {
                reasons.push('Work spans outside shift hours; paused and resumed next shift.');
            }
            else if (reasons.length === 0 && delayMinutes === 0) {
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
        const utilizations = [];
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
            if (!firstOrder)
                continue;
            let minStart = (0, date_utils_1.parseUtc)(firstOrder.data.startDate);
            let maxEnd = (0, date_utils_1.parseUtc)(firstOrder.data.endDate);
            let totalActiveMinutes = 0;
            for (const wo of centerOrders) {
                const start = (0, date_utils_1.parseUtc)(wo.data.startDate);
                const end = (0, date_utils_1.parseUtc)(wo.data.endDate);
                if (start < minStart)
                    minStart = start;
                if (end > maxEnd)
                    maxEnd = end;
                totalActiveMinutes += ((_b = wo.data.setupTimeMinutes) !== null && _b !== void 0 ? _b : 0) + wo.data.durationMinutes;
            }
            let totalAvailableMinutes = 0;
            let curr = minStart;
            while (curr < maxEnd) {
                if ((0, date_utils_1.isWorkingTime)(curr, wc.data.shifts, wc.data.maintenanceWindows)) {
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
        const violations = (0, constraint_checker_1.validateSchedule)({
            workOrders: updatedWorkOrders,
            workCenters: this.workCenters,
            manufacturingOrders: this.manufacturingOrders,
        });
        if (violations.length > 0) {
            const details = violations.map((v) => v.message).join(' | ');
            throw new Error(`Reflow produced invalid schedule: ${details}`);
        }
        const explanationLines = [];
        explanationLines.push('Reflow completed. Key changes:');
        for (const change of changes) {
            explanationLines.push(`- Work order ${change.workOrderId} moved by ${change.delayMinutes} minutes. Reasons: ${change.reasons.join('; ')}`);
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
exports.ReflowService = ReflowService;
//# sourceMappingURL=reflow.service.js.map