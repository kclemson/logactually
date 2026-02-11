

## Update Default Intensity & "What Affects" Blurb

### Answering your question first (#3)

Yes, both incline and calories burned **do** impact the estimates:
- **Incline**: The code adds a MET bonus of ~0.75 MET per 5% incline grade, which directly increases the calorie estimate.
- **Calories burned**: If the user mentions a device-reported number (e.g. "Apple Watch said 320 cal"), the code uses that exact number instead of estimating. So the current blurb is accurate.

### Changes to `src/components/CalorieBurnDialog.tsx`

**1. Default intensity subtitle (line 471)**

Current: `Used when you don't log effort. Blank = full range.`

The core idea you want: "the effort level assumed when not specified in the workout." Shorter phrasing proposal:

`Assumed when effort isn't specified. Blank = full range.`

This keeps the same two-sentence structure, stays compact, and reads naturally.

**2. "What affects your estimates" blurb (lines 490-497)**

Replace with your proposed text, lightly edited for flow:

> Each of the settings above helps calculate the estimated calorie burn, with body weight and exercise intensity being the two biggest factors. When you log your workouts, including details like "hard effort", "8/10 intensity", or "12% incline" will help narrow the range. If your device reports calories burned (e.g. Apple Watch), mention it and we'll use that number directly.

This keeps the Apple Watch line since it **is** accurate -- the code uses device-reported calories directly.

### Technical details

Text-only edits in `src/components/CalorieBurnDialog.tsx`:
- Line 471: update subtitle string
- Lines 491-496: replace paragraph text

### Files changed
- `src/components/CalorieBurnDialog.tsx`

