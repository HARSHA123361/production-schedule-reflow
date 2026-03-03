"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bonusCycleWorkOrders = exports.bonusCycleOrders = exports.bonusCycleWorkCenters = void 0;
exports.bonusCycleWorkCenters = [
    {
        docId: 'wc-cycle',
        docType: 'workCenter',
        data: {
            name: 'Looping Line',
            shifts: [{ dayOfWeek: 1, startHour: 8, endHour: 17 }],
            maintenanceWindows: [],
        },
    },
];
exports.bonusCycleOrders = [
    {
        docId: 'mo-cycle',
        docType: 'manufacturingOrder',
        data: {
            manufacturingOrderNumber: 'MO-CYCLE',
            itemId: 'LOOP',
            quantity: 1,
            dueDate: '2025-01-05T17:00:00.000Z',
        },
    },
];
exports.bonusCycleWorkOrders = [
    {
        docId: 'wo-cycle-1',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-CYC-1',
            manufacturingOrderId: 'mo-cycle',
            workCenterId: 'wc-cycle',
            startDate: '2025-01-01T08:00:00.000Z',
            endDate: '2025-01-01T10:00:00.000Z',
            durationMinutes: 120,
            isMaintenance: false,
            dependsOnWorkOrderIds: ['wo-cycle-2'], // 1 depends on 2
        },
    },
    {
        docId: 'wo-cycle-2',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-CYC-2',
            manufacturingOrderId: 'mo-cycle',
            workCenterId: 'wc-cycle',
            startDate: '2025-01-01T10:00:00.000Z',
            endDate: '2025-01-01T12:00:00.000Z',
            durationMinutes: 120,
            isMaintenance: false,
            dependsOnWorkOrderIds: ['wo-cycle-1'], // 2 depends on 1 (CYCLE!)
        },
    },
];
//# sourceMappingURL=bonus-cycle.js.map