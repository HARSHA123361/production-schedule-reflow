"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchedule = validateSchedule;
const date_utils_1 = require("../utils/date-utils");
function getWorkCenterMap(workCenters) {
    const map = new Map();
    for (const wc of workCenters) {
        map.set(wc.docId, wc);
    }
    return map;
}
function validateDependencies(workOrders) {
    const byId = new Map();
    for (const wo of workOrders) {
        byId.set(wo.docId, wo);
    }
    const violations = [];
    for (const wo of workOrders) {
        const start = (0, date_utils_1.parseUtc)(wo.data.startDate);
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
            const parentEnd = (0, date_utils_1.parseUtc)(parent.data.endDate);
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
function validateWorkCenterConflicts(workOrders, workCenters) {
    var _a;
    const byCenter = new Map();
    for (const wo of workOrders) {
        const list = (_a = byCenter.get(wo.data.workCenterId)) !== null && _a !== void 0 ? _a : [];
        list.push(wo);
        byCenter.set(wo.data.workCenterId, list);
    }
    const violations = [];
    const wcMap = getWorkCenterMap(workCenters);
    for (const [centerId, list] of byCenter.entries()) {
        if (!wcMap.has(centerId)) {
            continue;
        }
        const sorted = list
            .map((wo) => ({
            wo,
            start: (0, date_utils_1.parseUtc)(wo.data.startDate),
            end: (0, date_utils_1.parseUtc)(wo.data.endDate),
        }))
            .sort((a, b) => a.start.toMillis() - b.start.toMillis());
        for (let i = 1; i < sorted.length; i += 1) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
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
function validateSchedule(input) {
    const { workOrders, workCenters } = input;
    const violations = [];
    violations.push(...validateDependencies(workOrders));
    violations.push(...validateWorkCenterConflicts(workOrders, workCenters));
    // Shift and maintenance correctness are enforced during scheduling via date-utils.
    // Additional validation can be added here if needed.
    return violations;
}
//# sourceMappingURL=constraint-checker.js.map