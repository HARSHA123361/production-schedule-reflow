"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bonusHolidayWorkOrders = exports.bonusHolidayOrders = exports.bonusHolidayWorkCenters = void 0;
exports.bonusHolidayWorkCenters = [
    {
        docId: 'wc-holiday',
        docType: 'workCenter',
        data: {
            name: 'Assembly Holiday',
            shifts: [
                { dayOfWeek: 1, startHour: 8, endHour: 17 },
                { dayOfWeek: 2, startHour: 8, endHour: 17 },
                { dayOfWeek: 3, startHour: 8, endHour: 17 },
                { dayOfWeek: 4, startHour: 8, endHour: 17 },
                { dayOfWeek: 5, startHour: 8, endHour: 17 },
            ],
            maintenanceWindows: [
                {
                    // Wednesday Jan 1 2025 is a company holiday
                    startDate: '2025-01-01T00:00:00.000Z',
                    endDate: '2025-01-02T00:00:00.000Z',
                    reason: 'New Years Holiday',
                }
            ],
        },
    },
];
exports.bonusHolidayOrders = [
    {
        docId: 'mo-holiday',
        docType: 'manufacturingOrder',
        data: {
            manufacturingOrderNumber: 'MO-HOLIDAY',
            itemId: 'DESK',
            quantity: 200,
            dueDate: '2025-01-06T17:00:00.000Z',
        },
    },
];
exports.bonusHolidayWorkOrders = [
    {
        docId: 'wo-holiday',
        docType: 'workOrder',
        data: {
            workOrderNumber: 'WO-HOLIDAY',
            manufacturingOrderId: 'mo-holiday',
            workCenterId: 'wc-holiday',
            startDate: '2025-01-01T08:00:00.000Z', // starts right on holiday
            endDate: '2025-01-01T12:00:00.000Z',
            durationMinutes: 240,
            isMaintenance: false,
            dependsOnWorkOrderIds: [],
        },
    },
];
//# sourceMappingURL=bonus-holiday.js.map