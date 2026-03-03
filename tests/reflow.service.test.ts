import { ReflowService } from '../src/reflow/reflow.service';
import {
  delayCascadeManufacturingOrders,
  delayCascadeWorkCenters,
  delayCascadeWorkOrders,
} from '../src/sample-data/delay-cascade';
import {
  shiftMaintenanceManufacturingOrders,
  shiftMaintenanceWorkCenters,
  shiftMaintenanceWorkOrders,
} from '../src/sample-data/shift-maintenance';

describe('ReflowService', () => {
  it('respects dependency ordering and avoids overlaps in delay cascade scenario', () => {
    const service = new ReflowService(
      delayCascadeWorkCenters,
      delayCascadeManufacturingOrders,
    );

    const result = service.reflow({
      workOrders: delayCascadeWorkOrders,
    });

    const byId = new Map(result.updatedWorkOrders.map((wo) => [wo.docId, wo]));
    const a = byId.get('wo-A')!;
    const b = byId.get('wo-B')!;
    const c = byId.get('wo-C')!;

    expect(a.data.endDate <= b.data.startDate).toBe(true);
    expect(b.data.endDate <= c.data.startDate).toBe(true);
  });

  it('respects maintenance window and shift boundaries in shift/maintenance scenario', () => {
    const service = new ReflowService(
      shiftMaintenanceWorkCenters,
      shiftMaintenanceManufacturingOrders,
    );

    const result = service.reflow({
      workOrders: shiftMaintenanceWorkOrders,
    });

    const byId = new Map(result.updatedWorkOrders.map((wo) => [wo.docId, wo]));
    const maintenance = byId.get('wo-MAINTENANCE')!;

    expect(maintenance.data.startDate).toBe('2025-01-01T13:00:00.000Z');
    expect(maintenance.data.endDate).toBe('2025-01-01T14:00:00.000Z');
  });
});

