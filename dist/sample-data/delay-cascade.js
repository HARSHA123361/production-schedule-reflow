"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayCascadeWorkOrders = exports.delayCascadeManufacturingOrders = exports.delayCascadeWorkCenters = void 0;
exports.delayCascadeWorkCenters = [
    {
        docId: 'wc-line-1',
        docType: 'workCenter',
        data: {
            name: 'Extrusion Line 1',
            shifts: [
                { dayOfWeek: 1, startHour: 8, endHour: 17 },
                { dayOfWeek: 2, startHour: 8, endHour: 17 },
                { dayOfWeek: 3, startHour: 8, endHour: 17 },
                { dayOfWeek: 4, startHour: 8, endHour: 17 },
                { dayOfWeek: 5, startHour: 8, endHour: 17 },
            ],
            maintenanceWindows: [],
        },
    },
];
exports.delayCascadeManufacturingOrders = [
    {
        docId: 'mo-1',
        docType: 'manufacturingOrder',
        data: {
            manufacturingOrderNumber: 'MO-1',
            itemId: 'PIPE-50',
            quantity: 100,
            dueDate: '2025-01-02T17:00:00.000Z',
        },
    },
];
exports.delayCascadeWorkOrders = [
    {
        docId: 'wo-A',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-A',
            manufacturingOrderId: 'mo-1',
            workCenterId: 'wc-line-1',
            startDate: '2025-01-01T10:00:00.000Z',
            endDate: '2025-01-01T12:00:00.000Z',
            durationMinutes: 120,
            isMaintenance: false,
            dependsOnWorkOrderIds: [],
        },
    },
    {
        docId: 'wo-B',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-B',
            manufacturingOrderId: 'mo-1',
            workCenterId: 'wc-line-1',
            startDate: '2025-01-01T10:00:00.000Z',
            endDate: '2025-01-01T12:00:00.000Z',
            durationMinutes: 120,
            isMaintenance: false,
            dependsOnWorkOrderIds: ['wo-A'],
        },
    },
    {
        docId: 'wo-C',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-C',
            manufacturingOrderId: 'mo-1',
            workCenterId: 'wc-line-1',
            startDate: '2025-01-01T13:00:00.000Z',
            endDate: '2025-01-01T15:00:00.000Z',
            durationMinutes: 120,
            isMaintenance: false,
            dependsOnWorkOrderIds: ['wo-B'],
        },
    },
];
//# sourceMappingURL=delay-cascade.js.map