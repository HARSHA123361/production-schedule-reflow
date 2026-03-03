"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reflow_service_1 = require("../src/reflow/reflow.service");
const delay_cascade_1 = require("../src/sample-data/delay-cascade");
const shift_maintenance_1 = require("../src/sample-data/shift-maintenance");
describe('ReflowService', () => {
    it('respects dependency ordering and avoids overlaps in delay cascade scenario', () => {
        const service = new reflow_service_1.ReflowService(delay_cascade_1.delayCascadeWorkCenters, delay_cascade_1.delayCascadeManufacturingOrders);
        const result = service.reflow({
            workOrders: delay_cascade_1.delayCascadeWorkOrders,
        });
        const byId = new Map(result.updatedWorkOrders.map((wo) => [wo.docId, wo]));
        const a = byId.get('wo-A');
        const b = byId.get('wo-B');
        const c = byId.get('wo-C');
        expect(a.data.endDate <= b.data.startDate).toBe(true);
        expect(b.data.endDate <= c.data.startDate).toBe(true);
    });
    it('respects maintenance window and shift boundaries in shift/maintenance scenario', () => {
        const service = new reflow_service_1.ReflowService(shift_maintenance_1.shiftMaintenanceWorkCenters, shift_maintenance_1.shiftMaintenanceManufacturingOrders);
        const result = service.reflow({
            workOrders: shift_maintenance_1.shiftMaintenanceWorkOrders,
        });
        const byId = new Map(result.updatedWorkOrders.map((wo) => [wo.docId, wo]));
        const maintenance = byId.get('wo-MAINTENANCE');
        expect(maintenance.data.startDate).toBe('2025-01-01T13:00:00.000Z');
        expect(maintenance.data.endDate).toBe('2025-01-01T14:00:00.000Z');
    });
});
//# sourceMappingURL=reflow.service.test.js.map