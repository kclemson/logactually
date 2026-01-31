

## Changelog Page Implementation

### Summary

Create a simple, publicly accessible changelog page with an optional feedback form for authenticated users. The page will be dead-simple to edit manually.

### New File: `src/pages/Changelog.tsx`

A standalone page following the Privacy page pattern with these key features:

**Structure optimized for manual editing:**
```tsx
// ============================================
// CHANGELOG ENTRIES - Add new entries at the top
// Each entry is one line: { date: "Mon-DD", text: "description" }
// ============================================
const CHANGELOG_ENTRIES = [
{ date: "Jan-31", text: "Added support for Google authentication" },
{ date: "Jan-30", text: "Added minimal support for cardio exercises - instead of erroring out, it will now log the items and show a 'cardio' label, with minimal support on the Trends page for cardio charts. Running/walking/cycling charts also support switching between time-based view and mph-based view." },
{ date: "Jan-28", text: "Added user setting to show weights in Kg vs Lbs" },
{ date: "Jan-27", text: "Added support for logging weight lifting exercises, saved routines, charts, and exporting the full weight lifting log to CSV" },
{ date: "Jan-25", text: "Added feature for being able to save meals & quickly add saved meals to the log" },
{ date: "Jan-24", text: "Added support for dark theme" },
{ date: "Jan-23", text: "v1 of app published with support for food logging, basic charts for trends over time" },
];

const LAST_UPDATED = "Jan-31-26";
// ============================================
```

**Why this format:**
- No nested objects or complex structures
- Each entry is one line - just copy/paste and modify
- No indentation issues with JSX templates
- Date format matches your preference (Mon-DD)
- Last updated date is a simple string at the top

**Page layout:**
- "Changelog" title
- "Last updated: Jan-31-26" in smaller muted text
- Bullet list with dates in muted color, description in foreground
- Close button (goes to `/auth` if not logged in, `/` if logged in - same as Privacy)

### Shared Feedback Component: `src/components/FeedbackForm.tsx`

Extract the feedback form from Help.tsx into a reusable component:
- Takes no props (self-contained)
- Uses existing `useSubmitFeedback` hook
- Renders the title, textarea, and submit button
- Shows success message after submission

**Future-proofing for responding to feedback:**
- The existing `feedback` table already has `user_id`, which allows you to identify who submitted feedback
- When you want to add responses, you would add a `response` column (or a separate `feedback_responses` table) and display it in this component
- The component structure makes it easy to add a "You have a response!" indicator later

### Updates to Existing Pages

**1. Auth.tsx (login page)**

Add below the card, after the Privacy link:
```tsx
<Link
  to="/changelog"
  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
>
  Changelog
</Link>
```

Both links on the same row separated by a dot: `Privacy & Security · Changelog`

**2. Settings.tsx (About section)**

Add Changelog link below Privacy & Security link:
```tsx
<Link
  to="/changelog"
  className="text-sm text-foreground hover:underline underline-offset-2 transition-colors"
>
  Changelog
</Link>
```

**3. Help.tsx**

Replace the single Privacy link with both links on one row:
```tsx
<div className="pt-4 text-center">
  <Link to="/privacy" className="...">Privacy & Security</Link>
  <span className="text-muted-foreground"> · </span>
  <Link to="/changelog" className="...">Changelog</Link>
</div>
```

Also refactor to use the shared FeedbackForm component.

**4. App.tsx (routing)**

Add the new route outside protected routes (like Privacy):
```tsx
<Route path="/changelog" element={<Changelog />} />
```

### File Changes Summary

| File | Change |
|------|--------|
| `src/pages/Changelog.tsx` | New file - the changelog page |
| `src/components/FeedbackForm.tsx` | New file - extracted feedback form |
| `src/pages/Auth.tsx` | Add changelog link in footer |
| `src/pages/Settings.tsx` | Add changelog link in About section |
| `src/pages/Help.tsx` | Replace footer, use FeedbackForm component |
| `src/App.tsx` | Add `/changelog` route |

### Conditional Feedback on Changelog

The Changelog page will check `useAuth()` to see if user is logged in:
- **Logged out**: Just shows the changelog entries
- **Logged in**: Shows changelog entries + the FeedbackForm at the bottom

This keeps anonymous users from seeing a form they can't use, while giving authenticated users a convenient way to share thoughts right from the changelog.

