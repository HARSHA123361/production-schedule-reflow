# Prompt for Algorithm Design (DAG + Scheduling Logic)

```markdown
Please help me design a production scheduling engine in TypeScript. 
The system needs to do the following:
1. Accept input defining `WorkCenters`, `ManufacturingOrders`, and `WorkOrders`.
2. Model dependencies between `WorkOrders` as a Directed Acyclic Graph (DAG).
3. Validate the DAG by performing topological sorting and throw explicit errors if cyclical dependencies are found.
4. Calculate new start and end times for the work orders, making sure to explicitly check for `shifts` and `maintenanceWindows` (so work spans across shifts properly if interrupted).
5. Advance start dates to the next working minute, and distribute `durationMinutes` (and `setupTimeMinutes` if applicable) only during valid working hours.
6. Provide an explanation of what changed, and output total scenario delay and work center utilization.

Provide the solution emphasizing strict typescript definitions, separate business logic for date utilities (e.g. `isWorkingTime`, `advanceToNextWorkingMinute`), and the core `ReflowService` that coordinates the graph traversal and scheduling logic.
```
