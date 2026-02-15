

# Update Help Tips + Add Feedback Changelog Entry

## 1. Update Tips (src/pages/Help.tsx)

Modify the `HELP_CONTENT.tips.items` array:

- **Bullet 1** (changelog): Keep as-is
- **Bullet 2** (braindump): Add "photo" to the list -- "via text, voice, photo, or scan a barcode"
- **Bullet 3** (editing): Rewrite to also mention portion scaling -- "Once an item's logged, click or tap on it to make changes. Adjust portions with the +/- controls, or edit calories to auto-scale protein, carbs, and fat proportionally."
- **Bullet 4** (save it): Keep as-is
- **Bullet 5** (Settings): Rewrite to be broader -- "There's a lot you can customize in Settings — dark theme, calorie targets, estimated exercise burn, weight units, CSV export, and more."
- **Bullet 6** (pin to home screen): Keep as-is
- **New bullet** (Ask AI): "Have questions about your data? Use Ask AI on the Trends page to spot patterns, get insights, and ask questions about your food and exercise history in plain language."
- **New bullet** (Custom logs): "Track more than food and exercise — enable Custom Logs in Settings to log things like body weight, blood pressure, sleep, or anything else you want to track over time."

## 2. Add Changelog Entry (src/pages/Changelog.tsx)

Copy the uploaded screenshot to `public/changelog/feedback.png`, then add a new entry at the top of `CHANGELOG_ENTRIES` and update `LAST_UPDATED` to `"Feb-15-26"`.

Proposed changelog text (matching the existing tone -- short, direct, no fluff):

```
{ date: "Feb-15", text: "Added a feedback system — submit bug reports, feature requests, or questions directly from the Help page. You'll see responses and status updates inline, and can reply or re-open resolved items.", image: "feedback.png" },
```

## Technical Details

- **Files modified**: `src/pages/Help.tsx`, `src/pages/Changelog.tsx`
- **File copied**: `user-uploads://image-856.png` to `public/changelog/feedback.png`
- **No database or backend changes**

