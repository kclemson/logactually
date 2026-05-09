## Bump initial exercise chart count to keep the grid even

### Context
The exercise charts grid (`grid grid-cols-2`) previously held: Volume + Calorie Burn + 4 exercises = 6 cells (3 even rows). With Volume hidden, it's now Calorie Burn + 4 exercises = 5 cells, leaving an awkward half-empty row before the "Show more" button.

### Change
In `src/pages/Trends.tsx` line 76, change the initial `visibleExerciseCount` from `4` to `5`.

Result: Calorie Burn + 5 exercises = 6 cells, three full rows. The "Show more" increment (+10) stays unchanged since 10 is even.

No other files affected.