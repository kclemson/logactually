

# Update Response Text Color and Delete Button Style

## Changes

### 1. `src/components/FeedbackMessageBody.tsx`
- Change the response text from `text-muted-foreground` to no color class (inherits `text-foreground` / white in dark mode) so it matches the user message styling.

### 2. `src/components/FeedbackForm.tsx`
- Change the Delete button from `text-muted-foreground hover:text-destructive` to `text-destructive` so it appears red by default instead of looking disabled.

## Technical details

**FeedbackMessageBody.tsx** -- remove `text-muted-foreground` from the response `<p>` tag (line 25):
```tsx
// Before
<p className="text-xs whitespace-pre-wrap text-muted-foreground mt-0.5">{response}</p>
// After
<p className="text-xs whitespace-pre-wrap mt-0.5">{response}</p>
```

**FeedbackForm.tsx** -- update Delete button class (around line 167):
```tsx
// Before
<button className="text-muted-foreground hover:text-destructive flex items-center gap-1">
// After
<button className="text-destructive flex items-center gap-1">
```

Two files, two one-line changes each.

