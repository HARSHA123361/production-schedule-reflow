import { ReflowInput } from './types';
interface ConstraintViolation {
    type: 'dependency' | 'workCenterConflict' | 'shift' | 'maintenance';
    message: string;
    workOrderId?: string;
}
export declare function validateSchedule(input: ReflowInput): ConstraintViolation[];
export {};
//# sourceMappingURL=constraint-checker.d.ts.map