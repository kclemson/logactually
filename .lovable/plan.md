

## Add "Pinned" Entry Point to Trends Section Headers

### What changes

Each section header currently shows just "Ask AI" as a text link. When pinned chats exist, a "Pinned (N)" link will appear alongside it, separated by a dot. Tapping it opens the Ask AI dialog directly to the pinned chats view.

```text
Food Trends                     Ask AI · Pinned (3)
Exercise Trends                 Ask AI · Pinned (3)
```

When there are 0 pinned chats, only "Ask AI" shows (no change from current behavior).

Since pinned chats combine both food and exercise, both sections show the same count and open the same shared pinned view. The dialog opens in the mode of whichever section the user tapped from.

### Technical Details

#### 1. Add `initialView` prop to `AskTrendsAIDialog`

- New optional prop: `initialView?: 'ask' | 'pinned'` (default: `'ask'`)
- The existing `view` state initializes from this prop
- When `open` changes to `true`, reset `view` to `initialView` so reopening respects the intended view

#### 2. Update `src/pages/Trends.tsx`

- Import `usePinnedChats` hook to get `pinCount`
- Track which dialog should open in pinned view vs ask view (add `foodInitialView` / `exerciseInitialView` state, or simpler: a single `initialView` state that gets set before opening)
- Update each section's `headerAction` to render both links:

```text
<span className="flex items-center gap-1.5 text-xs">
  <button onClick={openAskAI}>Ask AI</button>
  {pinCount > 0 && (
    <>
      <span className="text-muted-foreground">·</span>
      <button onClick={openPinned}>
        <Pin className="h-3 w-3 inline" /> {pinCount}
      </button>
    </>
  )}
</span>
```

- Pass `initialView` to `AskTrendsAIDialog`

#### 3. Files to modify

- `src/components/AskTrendsAIDialog.tsx` -- add `initialView` prop, use it to set initial `view` state on open
- `src/pages/Trends.tsx` -- add pinned link to section headers, pass `initialView` to dialog

