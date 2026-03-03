"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftMaintenanceWorkOrders = exports.shiftMaintenanceManufacturingOrders = exports.shiftMaintenanceWorkCenters = void 0;
exports.shiftMaintenanceWorkCenters = [
    {
        docId: 'wc-line-2',
        docType: 'workCenter',
        data: {
            name: 'Extrusion Line 2',
            shifts: [
                { dayOfWeek: 1, startHour: 8, endHour: 17 },
                { dayOfWeek: 2, startHour: 8, endHour: 17 },
                { dayOfWeek: 3, startHour: 8, endHour: 17 },
                { dayOfWeek: 4, startHour: 8, endHour: 17 },
                { dayOfWeek: 5, startHour: 8, endHour: 17 },
            ],
            maintenanceWindows: [
                {
                    startDate: '2025-01-01T13:00:00.000Z',
                    endDate: '2025-01-01T14:00:00.000Z',
                    reason: 'Planned maintenance',
                },
            ],
        },
    },
];
exports.shiftMaintenanceManufacturingOrders = [
    {
        docId: 'mo-2',
        docType: 'manufacturingOrder',
        data: {
            manufacturingOrderNumber: 'MO-2',
            itemId: 'PIPE-100',
            quantity: 200,
            dueDate: '2025-01-03T17:00:00.000Z',
        },
    },
];
exports.shiftMaintenanceWorkOrders = [
    {
        docId: 'wo-SHIFT-SPAN',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-SHIFT-SPAN',
            manufacturingOrderId: 'mo-2',
            workCenterId: 'wc-line-2',
            startDate: '2025-01-01T15:30:00.000Z',
            endDate: '2025-01-01T17:30:00.000Z',
            durationMinutes: 120,
            isMaintenance: false,
            dependsOnWorkOrderIds: [],
        },
    },
    {
        docId: 'wo-MAINTENANCE',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-MAINTENANCE',
            manufacturingOrderId: 'mo-2',
            workCenterId: 'wc-line-2',
            startDate: '2025-01-01T13:00:00.000Z',
            endDate: '2025-01-01T14:00:00.000Z',
            durationMinutes: 60,
            isMaintenance: true,
            dependsOnWorkOrderIds: [],
        },
    },
    {
        docId: 'wo-AFTER-MAINT',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-AFTER-MAINT',
            manufacturingOrderId: 'mo-2',
            workCenterId: 'wc-line-2',
            startDate: '2025-01-01T13:00:00.000Z',
            endDate: '2025-01-01T15:00:00.000Z',
            durationMinutes: 120,
            isMaintenance: false,
            dependsOnWorkOrderIds: ['wo-MAINTENANCE'],
        },
    },
];
//# sourceMappingURL=shift-maintenance.js.map