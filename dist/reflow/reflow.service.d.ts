import { ManufacturingOrderDoc, ReflowInput, ReflowResult, WorkCenterDoc } from './types';
export declare class ReflowService {
    private readonly workCenters;
    private readonly manufacturingOrders;
    private readonly workCentersById;
    constructor(workCenters: WorkCenterDoc[], manufacturingOrders: ManufacturingOrderDoc[]);
    reflow(input: Omit<ReflowInput, 'workCenters' | 'manufacturingOrders'>): ReflowResult;
}
//# sourceMappingURL=reflow.service.d.ts.map