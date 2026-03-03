import { ReflowService } from './reflow/reflow.service';
import {
  delayCascadeManufacturingOrders,
  delayCascadeWorkCenters,
  delayCascadeWorkOrders,
} from './sample-data/delay-cascade';
import {
  shiftMaintenanceManufacturingOrders,
  shiftMaintenanceWorkCenters,
  shiftMaintenanceWorkOrders,
} from './sample-data/shift-maintenance';
import { bonusHolidayOrders, bonusHolidayWorkCenters, bonusHolidayWorkOrders } from './sample-data/bonus-holiday';
import { bonusMultiLineCenters, bonusMultiLineOrders, bonusMultiLineWorkOrders } from './sample-data/bonus-multi-line';
import { bonusSetupOrders, bonusSetupWorkCenters, bonusSetupWorkOrders } from './sample-data/bonus-setup-time';
import { bonusCycleOrders, bonusCycleWorkCenters, bonusCycleWorkOrders } from './sample-data/bonus-cycle';

function logUtilizations(utilizations: any[]) {
  if (utilizations && utilizations.length > 0) {
    console.log('Work Center Utilizations:');
    console.table(
      utilizations.map((u) => ({
        id: u.workCenterId,
        availableMin: u.totalAvailableMinutes,
        activeMin: u.totalActiveMinutes,
        utilization: u.utilizationPercentage.toFixed(2) + '%',
      })),
    );
  }
}

function runDelayCascade() {
  console.log('=== Scenario: Delay Cascade ===');
  const service = new ReflowService(
    delayCascadeWorkCenters,
    delayCascadeManufacturingOrders,
  );

  const result = service.reflow({
    workOrders: delayCascadeWorkOrders,
  });

  console.log('Updated work orders:');
  console.table(
    result.updatedWorkOrders.map((wo) => ({
      id: wo.docId,
      start: wo.data.startDate,
      end: wo.data.endDate,
      wc: wo.data.workCenterId,
    })),
  );

  console.log('Changes:');
  console.table(
    result.changes.map((c) => ({
      id: c.workOrderId,
      delayMinutes: c.delayMinutes,
      reasons: c.reasons.join('; '),
    })),
  );

  const totalDelayMinutes = result.changes.reduce((sum, c) => sum + c.delayMinutes, 0);
  console.log(`\nTotal delay for scenario: ${totalDelayMinutes} minutes\n`);

  console.log('Explanation:');
  console.log(result.explanation);
  console.log('\n');
  logUtilizations(result.utilizations);
}

function runShiftMaintenance() {
  console.log('=== Scenario: Shift / Maintenance ===');
  const service = new ReflowService(
    shiftMaintenanceWorkCenters,
    shiftMaintenanceManufacturingOrders,
  );

  const result = service.reflow({
    workOrders: shiftMaintenanceWorkOrders,
  });

  console.log('Updated work orders:');
  console.table(
    result.updatedWorkOrders.map((wo) => ({
      id: wo.docId,
      start: wo.data.startDate,
      end: wo.data.endDate,
      wc: wo.data.workCenterId,
    })),
  );

  console.log('Changes:');
  console.table(
    result.changes.map((c) => ({
      id: c.workOrderId,
      delayMinutes: c.delayMinutes,
      reasons: c.reasons.join('; '),
    })),
  );

  const totalDelayMinutes = result.changes.reduce((sum, c) => sum + c.delayMinutes, 0);
  console.log(`\nTotal delay for scenario: ${totalDelayMinutes} minutes\n`);

  console.log('Explanation:');
  console.log(result.explanation);
  console.log('\n');
  logUtilizations(result.utilizations);
}

function runBonusScenarios() {
  console.log('\n=== Scenario: Bonus Setup Time ===');
  const setupService = new ReflowService(bonusSetupWorkCenters, bonusSetupOrders);
  const setupResult = setupService.reflow({ workOrders: bonusSetupWorkOrders });
  console.table(
    setupResult.changes.map((c) => ({
      id: c.workOrderId,
      delay: c.delayMinutes,
      reasons: c.reasons.join('; '),
    })),
  );
  logUtilizations(setupResult.utilizations);

  console.log('\n=== Scenario: Bonus Holiday Delay ===');
  const holidayService = new ReflowService(bonusHolidayWorkCenters, bonusHolidayOrders);
  const holidayResult = holidayService.reflow({ workOrders: bonusHolidayWorkOrders });
  console.table(
    holidayResult.changes.map((c) => ({
      id: c.workOrderId,
      delay: c.delayMinutes,
      reasons: c.reasons.join('; '),
    })),
  );
  logUtilizations(holidayResult.utilizations);

  console.log('\n=== Scenario: Bonus Multi-Line Cross Dependency ===');
  const multiService = new ReflowService(bonusMultiLineCenters, bonusMultiLineOrders);

  // Note in the data: wo-cnc-urgent takes the CNC from 8-10.
  // wo-cnc-1 originally started at 8, so it gets pushed to 10-14.
  // wo-assembly-1 originally started at 12, depends on wo-cnc-1, so gets pushed to 14, finishes at 17 (1 hr into next day if 16 is end of shift!).
  const multiResult = multiService.reflow({ workOrders: bonusMultiLineWorkOrders });
  console.table(
    multiResult.changes.map((c) => ({
      id: c.workOrderId,
      delay: c.delayMinutes,
      reasons: c.reasons.join('; '),
    })),
  );
  logUtilizations(multiResult.utilizations);

  console.log('\n=== Scenario: Bonus DAG Circular Dependency ===');
  try {
    const cycleService = new ReflowService(bonusCycleWorkCenters, bonusCycleOrders);
    cycleService.reflow({ workOrders: bonusCycleWorkOrders });
    console.log('FAIL: Circular dependency was NOT caught!');
  } catch (error) {
    if (error instanceof Error) {
      console.log('SUCCESS! Caught expected circular dependency error:');
      console.error(error.message);
    }
  }
}

function main() {
  const scenario = process.argv[2] ?? 'all';
  if (scenario === 'delay-cascade') {
    runDelayCascade();
  } else if (scenario === 'shift-maintenance') {
    runShiftMaintenance();
  } else if (scenario === 'bonus') {
    runBonusScenarios();
  } else {
    runDelayCascade();
    console.log('\n');
    runShiftMaintenance();
    console.log('\n');
    runBonusScenarios();
  }
}

main();

