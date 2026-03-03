import { DateTime } from 'luxon';
import { WorkCenterMaintenanceWindow, WorkCenterShift } from '../reflow/types';

export function parseUtc(date: string): DateTime {
  return DateTime.fromISO(date, { zone: 'utc' });
}

export function toUtcString(dt: DateTime): string {
  const iso = dt.toUTC().toISO();
  if (!iso) {
    throw new Error('Failed to format DateTime as ISO string.');
  }
  return iso;
}

function isWithinShift(dt: DateTime, shifts: WorkCenterShift[]): boolean {
  const weekday = dt.weekday === 7 ? 0 : dt.weekday; // luxon: Monday=1..Sunday=7, spec: Sunday=0
  const hour = dt.hour;
  return shifts.some(
    (shift) =>
      shift.dayOfWeek === weekday &&
      hour >= shift.startHour &&
      hour < shift.endHour,
  );
}

function isWithinMaintenance(
  dt: DateTime,
  maintenanceWindows: WorkCenterMaintenanceWindow[],
): boolean {
  return maintenanceWindows.some((mw) => {
    const start = parseUtc(mw.startDate);
    const end = parseUtc(mw.endDate);
    return dt >= start && dt < end;
  });
}

export function isWorkingTime(
  dt: DateTime,
  shifts: WorkCenterShift[],
  maintenanceWindows: WorkCenterMaintenanceWindow[],
): boolean {
  return isWithinShift(dt, shifts) && !isWithinMaintenance(dt, maintenanceWindows);
}

export function advanceToNextWorkingMinute(
  dt: DateTime,
  shifts: WorkCenterShift[],
  maintenanceWindows: WorkCenterMaintenanceWindow[],
  safetyLimitMinutes = 60 * 24 * 30,
): DateTime {
  let current = dt;
  let walked = 0;

  while (!isWorkingTime(current, shifts, maintenanceWindows)) {
    current = current.plus({ minutes: 1 });
    walked += 1;
    if (walked > safetyLimitMinutes) {
      throw new Error('Unable to find next working minute within safety limit.');
    }
  }

  return current;
}

export function calculateEndDateWithShifts(
  startDateIso: string,
  durationMinutes: number,
  shifts: WorkCenterShift[],
  maintenanceWindows: WorkCenterMaintenanceWindow[],
): string {
  if (durationMinutes <= 0) {
    return startDateIso;
  }

  let current = parseUtc(startDateIso);
  current = advanceToNextWorkingMinute(current, shifts, maintenanceWindows);

  let remaining = durationMinutes;
  let walked = 0;
  const safetyLimitMinutes = durationMinutes + 60 * 24 * 30;

  while (remaining > 0) {
    if (!isWorkingTime(current, shifts, maintenanceWindows)) {
      current = advanceToNextWorkingMinute(current, shifts, maintenanceWindows);
      continue;
    }

    current = current.plus({ minutes: 1 });
    remaining -= 1;
    walked += 1;

    if (walked > safetyLimitMinutes) {
      throw new Error('Shift calculation exceeded safety limit; schedule may be impossible.');
    }
  }

  return toUtcString(current);
}

