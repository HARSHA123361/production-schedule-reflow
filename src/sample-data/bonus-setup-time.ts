import {
    ManufacturingOrderDoc,
    WorkCenterDoc,
    WorkOrderDoc,
} from '../reflow/types';

export const bonusSetupWorkCenters: WorkCenterDoc[] = [
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

export const bonusSetupOrders: ManufacturingOrderDoc[] = [
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

export const bonusSetupWorkOrders: WorkOrderDoc[] = [
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
