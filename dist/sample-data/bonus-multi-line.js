"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bonusMultiLineWorkOrders = exports.bonusMultiLineOrders = exports.bonusMultiLineCenters = void 0;
exports.bonusMultiLineCenters = [
    {
        docId: 'wc-cnc',
        docType: 'workCenter',
        data: {
            name: 'CNC Machining',
            shifts: [{ dayOfWeek: 1, startHour: 8, endHour: 16 }],
            maintenanceWindows: [],
        },
    },
    {
        docId: 'wc-assembly',
        docType: 'workCenter',
        data: {
            name: 'Assembly Line',
            shifts: [{ dayOfWeek: 1, startHour: 8, endHour: 16 }],
            maintenanceWindows: [],
        },
    },
];
exports.bonusMultiLineOrders = [
    {
        docId: 'mo-multi',
        docType: 'manufacturingOrder',
        data: {
            manufacturingOrderNumber: 'MO-MULTI',
            itemId: 'ENGINE',
            quantity: 10,
            dueDate: '2025-01-10T17:00:00.000Z',
        },
    },
];
exports.bonusMultiLineWorkOrders = [
    {
        docId: 'wo-cnc-1',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-CNC-1',
            manufacturingOrderId: 'mo-multi',
            workCenterId: 'wc-cnc',
            startDate: '2025-01-01T08:00:00.000Z', // 8 AM
            endDate: '2025-01-01T12:00:00.000Z',
            durationMinutes: 240,
            isMaintenance: false,
            dependsOnWorkOrderIds: [],
        },
    },
    {
        docId: 'wo-assembly-1',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-ASSEMBLY-1',
            manufacturingOrderId: 'mo-multi',
            workCenterId: 'wc-assembly',
            // Starts right after CNC finishes at noon, assembly takes 3 hours
            startDate: '2025-01-01T12:00:00.000Z',
            endDate: '2025-01-01T15:00:00.000Z',
            durationMinutes: 180,
            isMaintenance: false,
            dependsOnWorkOrderIds: ['wo-cnc-1'], // Cross center dependency
        },
    },
    // Oh no, another CNC job comes in that delays the first one!
    {
        docId: 'wo-cnc-urgent',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-CNC-URGENT',
            manufacturingOrderId: 'mo-multi',
            workCenterId: 'wc-cnc',
            startDate: '2025-01-01T08:00:00.000Z',
            endDate: '2025-01-01T10:00:00.000Z',
            durationMinutes: 120,
            isMaintenance: false,
            dependsOnWorkOrderIds: [],
        },
    },
];
//# sourceMappingURL=bonus-multi-line.js.map