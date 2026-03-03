## Production Schedule Reflow
TypeScript implementation of a production schedule reflow algorithm for manufacturing work orders. It reschedules work orders when disruptions occur while respecting dependencies, work center capacity, shift boundaries, and maintenance windows.

### How to run

- **Install dependencies**

```bash
npm install
```

- **Run scenarios (using ts-node)**

```bash
# Run both original scenarios
npm start

# Run all 4 bonus scenarios (Setup, Holiday, Multi-Line, Cycle)
npm start bonus

# Delay cascade scenario only
npm run scenario:delay-cascade

# Shift and maintenance scenario only
npm run scenario:shift-maintenance
```

*Each scenario prints total delay and per-work-center utilization metrics.*

- **Run tests**

```bash
npm test
```

### High-level algorithm

- **Data model**
  - `workOrder`: belongs to a `workCenter`, has `startDate`, `endDate`, `durationMinutes`, optional `setupTimeMinutes`, `isMaintenance`, and `dependsOnWorkOrderIds` (by `docId`).
  - `workCenter`: has weekly `shifts` (dayOfWeek, startHour, endHour) and concrete `maintenanceWindows` (blocked time ranges).
  - `manufacturingOrder`: provides context such as item, quantity, and `dueDate`.

- **Reflow steps**
  - Build a dependency graph over work orders (edges from parent to child) and perform a topological sort.
    - *A dedicated circular dependency scenario demonstrates explicit cycle detection and error reporting.*
  - For each work center, maintain the next free time after the last scheduled work order.
  - Process work orders in topological order:
    - For maintenance work orders (`isMaintenance = true`), keep their original start and end times and block their work center accordingly.
    - For normal work orders:
      - Compute the earliest possible start considering:
        - Original planned start.
        - Latest parent end time.
        - Next free time on the assigned work center.
      - Snap this candidate start forward to the next valid working minute within shifts and outside maintenance windows.
      - Use `calculateEndDateWithShifts` to walk working minutes (within shifts, skipping maintenance) and compute the new end time, including optional `setupTimeMinutes`.
      - Update the work center’s next free time and record the change (original vs new times, delay in minutes, reasons).
  - After scheduling all work orders, run `validateSchedule` to check for:
    - Dependency violations (child starting before parent end).
    - Work center conflicts (overlapping intervals on the same center).
  - If validation fails, throw an error with all detected violations; otherwise, return:
    - `updatedWorkOrders` with new `startDate` and `endDate`.
    - `changes` describing per-work-order movement.
    - A human-readable `explanation` summary.

### Architecture Outline

```text
ReflowService
 ├── buildGraph()
 ├── topologicalSort()
 ├── calculateEndDateWithShifts()
 └── validateSchedule()
```

### Files of interest

- `src/reflow/types.ts`: Core TypeScript types for documents and reflow results.
- `src/utils/date-utils.ts`: Shift-aware date helpers using Luxon, including `calculateEndDateWithShifts`.
- `src/reflow/constraint-checker.ts`: Basic constraint validation (dependencies and work center conflicts).
- `src/reflow/reflow.service.ts`: Main reflow algorithm (`ReflowService`).
- `src/sample-data/delay-cascade.ts`: Scenario where delays propagate through dependent work orders.
- `src/sample-data/shift-maintenance.ts`: Scenario involving shift boundaries and maintenance windows.
- `src/run-scenarios.ts`: Simple CLI runner for the scenarios.
- `tests/reflow.service.test.ts`: Jest tests covering the two main scenarios.

### Notes and assumptions

- All dates are treated as UTC ISO-8601 strings.
- `dependsOnWorkOrderIds` refer to work order `docId` values.
- Shift logic uses a simple minute-by-minute walk within a safety limit, which is sufficient for the sample scenarios and keeps the implementation straightforward.
- Maintenance work orders (`isMaintenance = true`) are treated as fixed and never rescheduled.
- Circular dependencies result in an explicit error and are demonstrated in the bonus cycle scenario.

### Trade-offs and Known Limitations

- **Topological Sort**: The current DFS-based topological sort provides cycle detection (`@upgrade: switch to Kahn's algorithm for O(V+E) if DAG becomes exceptionally large`).
- **Shift Calculation**: Shift calculations advance minute-by-minute (`isWorkingTime` check). For very long durations, this `O(N)` approach is simple but computationally heavier than computing working intervals algebraically.
  - `@upgrade: implement interval-based mathematics for O(1) jump calculations across days and weeks`.
- **Setup Times**: `setupTimeMinutes` is treated identically to typical working time (i.e. if interrupted by a shift boundary, it resumes next shift). In reality, setup might need to be contiguous or restart if interrupted.
  - `@upgrade: add logic requiring setup times to be fully contiguous within a single shift bounds`.
- **Utilization Tracking**: Utilization tracks purely Active Working Minutes / Available Shift Minutes strictly bounded by the (`minStart`, `maxEnd`) of scheduled work on that center. It does not measure true global utilization spanning globally empty weeks.

