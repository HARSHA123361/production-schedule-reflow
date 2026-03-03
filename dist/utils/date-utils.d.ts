import { DateTime } from 'luxon';
import { WorkCenterMaintenanceWindow, WorkCenterShift } from '../reflow/types';
export declare function parseUtc(date: string): DateTime;
export declare function toUtcString(dt: DateTime): string;
export declare function isWorkingTime(dt: DateTime, shifts: WorkCenterShift[], maintenanceWindows: WorkCenterMaintenanceWindow[]): boolean;
export declare function advanceToNextWorkingMinute(dt: DateTime, shifts: WorkCenterShift[], maintenanceWindows: WorkCenterMaintenanceWindow[], safetyLimitMinutes?: number): DateTime;
export declare function calculateEndDateWithShifts(startDateIso: string, durationMinutes: number, shifts: WorkCenterShift[], maintenanceWindows: WorkCenterMaintenanceWindow[]): string;
//# sourceMappingURL=date-utils.d.ts.map