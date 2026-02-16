

# Update Body Stats Mode Label

## Change
In `src/lib/calorie-target.ts`, update the `body_stats` entry in `TARGET_MODE_OPTIONS` (line 43):

- **Label:** "Estimated from body stats" --> **"Estimated burn rate minus a deficit"**
- **Description:** Keep as **"Calculated from your activity level, weight, and height"** (no change -- "Calculated" here explains _how_ the estimate works, so the word reuse across label/description is fine)

## Why this works
- "Estimated" signals it's an approximation, not exact
- "burn rate" is intuitive and avoids jargon like TDEE/BMR
- "minus a deficit" tells users up front that a deficit is part of this mode
- No word repetition between label and description

