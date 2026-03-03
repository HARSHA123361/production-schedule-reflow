"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bonusSetupWorkOrders = exports.bonusSetupOrders = exports.bonusSetupWorkCenters = void 0;
exports.bonusSetupWorkCenters = [
    {
        docId: 'wc-setup',
        docType: 'workCenter',
        data: {
            name: 'Milling Shift',
            shifts: [
                { dayOfWeek: 1, startHour: 8, endHour: 17 },
                { dayOfWeek: 2, startHour: 8, endHour: 17 },
                { dayOfWeek: 3, startHour: 8, endHour: 17 },
            ],
            maintenanceWindows: [],
        },
    },
];
exports.bonusSetupOrders = [
    {
        docId: 'mo-setup',
        docType: 'manufacturingOrder',
        data: {
            manufacturingOrderNumber: 'MO-SETUP',
            itemId: 'GEAR',
            quantity: 50,
            dueDate: '2025-01-05T17:00:00.000Z',
        },
    },
];
exports.bonusSetupWorkOrders = [
    {
        docId: 'wo-setup',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-SETUP',
            manufacturingOrderId: 'mo-setup',
            workCenterId: 'wc-setup',
            startDate: '2025-01-01T16:00:00.000Z', // Starts 16:00 (shifts are 08:00 - 17:00) 
            endDate: '2025-01-01T18:00:00.000Z',
            durationMinutes: 120, // 2 hours
            setupTimeMinutes: 60, // 1 hour setup
            isMaintenance: false,
            dependsOnWorkOrderIds: [],
        },
    },
];
//# sourceMappingURL=bonus-setup-time.js.map