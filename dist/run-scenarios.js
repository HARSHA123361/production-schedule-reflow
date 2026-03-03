"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reflow_service_1 = require("./reflow/reflow.service");
const delay_cascade_1 = require("./sample-data/delay-cascade");
const shift_maintenance_1 = require("./sample-data/shift-maintenance");
const bonus_holiday_1 = require("./sample-data/bonus-holiday");
const bonus_multi_line_1 = require("./sample-data/bonus-multi-line");
const bonus_setup_time_1 = require("./sample-data/bonus-setup-time");
const bonus_cycle_1 = require("./sample-data/bonus-cycle");
function logUtilizations(utilizations) {
    if (utilizations && utilizations.length > 0) {
        console.log('Work Center Utilizations:');
        console.table(utilizations.map((u) => ({
            id: u.workCenterId,
            availableMin: u.totalAvailableMinutes,
            activeMin: u.totalActiveMinutes,
            utilization: u.utilizationPercentage.toFixed(2) + '%',
        })));
    }
}
function runDelayCascade() {
    console.log('=== Scenario: Delay Cascade ===');
    const service = new reflow_service_1.ReflowService(delay_cascade_1.delayCascadeWorkCenters, delay_cascade_1.delayCascadeManufacturingOrders);
    const result = service.reflow({
        workOrders: delay_cascade_1.delayCascadeWorkOrders,
    });
    console.log('Updated work orders:');
    console.table(result.updatedWorkOrders.map((wo) => ({
        id: wo.docId,
        start: wo.data.startDate,
        end: wo.data.endDate,
        wc: wo.data.workCenterId,
    })));
    console.log('Changes:');
    console.table(result.changes.map((c) => ({
        id: c.workOrderId,
        delayMinutes: c.delayMinutes,
        reasons: c.reasons.join('; '),
    })));
    const totalDelayMinutes = result.changes.reduce((sum, c) => sum + c.delayMinutes, 0);
    console.log(`\nTotal delay for scenario: ${totalDelayMinutes} minutes\n`);
    console.log('Explanation:');
    console.log(result.explanation);
    console.log('\n');
    logUtilizations(result.utilizations);
}
function runShiftMaintenance() {
    console.log('=== Scenario: Shift / Maintenance ===');
    const service = new reflow_service_1.ReflowService(shift_maintenance_1.shiftMaintenanceWorkCenters, shift_maintenance_1.shiftMaintenanceManufacturingOrders);
    const result = service.reflow({
        workOrders: shift_maintenance_1.shiftMaintenanceWorkOrders,
    });
    console.log('Updated work orders:');
    console.table(result.updatedWorkOrders.map((wo) => ({
        id: wo.docId,
        start: wo.data.startDate,
        end: wo.data.endDate,
        wc: wo.data.workCenterId,
    })));
    console.log('Changes:');
    console.table(result.changes.map((c) => ({
        id: c.workOrderId,
        delayMinutes: c.delayMinutes,
        reasons: c.reasons.join('; '),
    })));
    const totalDelayMinutes = result.changes.reduce((sum, c) => sum + c.delayMinutes, 0);
    console.log(`\nTotal delay for scenario: ${totalDelayMinutes} minutes\n`);
    console.log('Explanation:');
    console.log(result.explanation);
    console.log('\n');
    logUtilizations(result.utilizations);
}
function runBonusScenarios() {
    console.log('\n=== Scenario: Bonus Setup Time ===');
    const setupService = new reflow_service_1.ReflowService(bonus_setup_time_1.bonusSetupWorkCenters, bonus_setup_time_1.bonusSetupOrders);
    const setupResult = setupService.reflow({ workOrders: bonus_setup_time_1.bonusSetupWorkOrders });
    console.table(setupResult.changes.map((c) => ({
        id: c.workOrderId,
        delay: c.delayMinutes,
        reasons: c.reasons.join('; '),
    })));
    logUtilizations(setupResult.utilizations);
    console.log('\n=== Scenario: Bonus Holiday Delay ===');
    const holidayService = new reflow_service_1.ReflowService(bonus_holiday_1.bonusHolidayWorkCenters, bonus_holiday_1.bonusHolidayOrders);
    const holidayResult = holidayService.reflow({ workOrders: bonus_holiday_1.bonusHolidayWorkOrders });
    console.table(holidayResult.changes.map((c) => ({
        id: c.workOrderId,
        delay: c.delayMinutes,
        reasons: c.reasons.join('; '),
    })));
    logUtilizations(holidayResult.utilizations);
    console.log('\n=== Scenario: Bonus Multi-Line Cross Dependency ===');
    const multiService = new reflow_service_1.ReflowService(bonus_multi_line_1.bonusMultiLineCenters, bonus_multi_line_1.bonusMultiLineOrders);
    // Note in the data: wo-cnc-urgent takes the CNC from 8-10.
    // wo-cnc-1 originally started at 8, so it gets pushed to 10-14.
    // wo-assembly-1 originally started at 12, depends on wo-cnc-1, so gets pushed to 14, finishes at 17 (1 hr into next day if 16 is end of shift!).
    const multiResult = multiService.reflow({ workOrders: bonus_multi_line_1.bonusMultiLineWorkOrders });
    console.table(multiResult.changes.map((c) => ({
        id: c.workOrderId,
        delay: c.delayMinutes,
        reasons: c.reasons.join('; '),
    })));
    logUtilizations(multiResult.utilizations);
    console.log('\n=== Scenario: Bonus DAG Circular Dependency ===');
    try {
        const cycleService = new reflow_service_1.ReflowService(bonus_cycle_1.bonusCycleWorkCenters, bonus_cycle_1.bonusCycleOrders);
        cycleService.reflow({ workOrders: bonus_cycle_1.bonusCycleWorkOrders });
        console.log('FAIL: Circular dependency was NOT caught!');
    }
    catch (error) {
        if (error instanceof Error) {
            console.log('SUCCESS! Caught expected circular dependency error:');
            console.error(error.message);
        }
    }
}
function main() {
    var _a;
    const scenario = (_a = process.argv[2]) !== null && _a !== void 0 ? _a : 'all';
    if (scenario === 'delay-cascade') {
        runDelayCascade();
    }
    else if (scenario === 'shift-maintenance') {
        runShiftMaintenance();
    }
    else if (scenario === 'bonus') {
        runBonusScenarios();
    }
    else {
        runDelayCascade();
        console.log('\n');
        runShiftMaintenance();
        console.log('\n');
        runBonusScenarios();
    }
}
main();
//# sourceMappingURL=run-scenarios.js.map