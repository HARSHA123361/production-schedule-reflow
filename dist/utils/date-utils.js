"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUtc = parseUtc;
exports.toUtcString = toUtcString;
exports.isWorkingTime = isWorkingTime;
exports.advanceToNextWorkingMinute = advanceToNextWorkingMinute;
exports.calculateEndDateWithShifts = calculateEndDateWithShifts;
const luxon_1 = require("luxon");
function parseUtc(date) {
    return luxon_1.DateTime.fromISO(date, { zone: 'utc' });
}
function toUtcString(dt) {
    const iso = dt.toUTC().toISO();
    if (!iso) {
        throw new Error('Failed to format DateTime as ISO string.');
    }
    return iso;
}
function isWithinShift(dt, shifts) {
    const weekday = dt.weekday === 7 ? 0 : dt.weekday; // luxon: Monday=1..Sunday=7, spec: Sunday=0
    const hour = dt.hour;
    return shifts.some((shift) => shift.dayOfWeek === weekday &&
        hour >= shift.startHour &&
        hour < shift.endHour);
}
function isWithinMaintenance(dt, maintenanceWindows) {
    return maintenanceWindows.some((mw) => {
        const start = parseUtc(mw.startDate);
        const end = parseUtc(mw.endDate);
        return dt >= start && dt < end;
    });
}
function isWorkingTime(dt, shifts, maintenanceWindows) {
    return isWithinShift(dt, shifts) && !isWithinMaintenance(dt, maintenanceWindows);
}
function advanceToNextWorkingMinute(dt, shifts, maintenanceWindows, safetyLimitMinutes = 60 * 24 * 30) {
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
function calculateEndDateWithShifts(startDateIso, durationMinutes, shifts, maintenanceWindows) {
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
//# sourceMappingURL=date-utils.js.map