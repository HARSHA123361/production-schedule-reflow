# Prompt for Shift Calculation Helpers

```markdown
I need standalone TypeScript utility functions for date calculations involving shifts and maintenance windows without using heavy graph logic. 
Requirements:
1. Use `luxon` for time handling (expecting UTC strings ISO).
2. Given a date, a set of shifts (day of week, start hour, end hour), and maintenance windows (start date, end date).
3. Function `isWorkingTime` to return boolean if the date falls strictly inside a predefined shift AND strictly outside any maintenance window.
4. Function `advanceToNextWorkingMinute` to iterate through minutes until it finds the next valid working minute. Put a safety limit so it doesn't loop infinitely if no shift exists.
5. Function `calculateEndDateWithShifts` given a start date and duration in minutes, return the end date by continually accounting for only valid working minutes (skipping maintenance or off-shift periods).

Please provide standard, well-tested functions that I can inject into my broader scheduling engine.
```
