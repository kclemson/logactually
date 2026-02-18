

## Ask AI Dialog Polish -- 7 Fixes

### 1. Suggestion chips clipping -- use min-height instead of fixed height

The current `h-[10.5rem]` is a fixed height that clips chips when they wrap to more/fewer lines. Change to `min-h-[10.5rem]` so the container grows to fit all 4 chips without clipping, while still reserving minimum space to prevent layout shift.

### 2. Two spinning icons during loading -- merge into single "Analyzing..." button

Currently: the Ask button shows a spinner AND there's a separate "Analyzing your data..." message below. Fix: when `isPending`, hide the textarea and show the submitted question in the same italic style as the response view. Replace the Ask button with a disabled "Analyzing..." button (with spinner inside it). Remove the separate loading indicator below.

### 3. Question styling during loading -- match response view

During loading, show the submitted question as `text-xs text-muted-foreground italic` (same as the response view), not inside the full-size textarea. This means when `isPending`, we hide the textarea and show the question text inline instead.

### 4. Pin button width stability -- use fixed min-width

The "Pin" button changes to "Pinned" which is wider, causing the adjacent button to resize. Fix: set `min-w-[5.5rem]` on the Pin button so it's always wide enough for "Pinned" text and doesn't change width.

### 5. Scroll to expanded pinned chat

When user expands a pinned chat near the bottom, scroll it into view. Use a ref callback with `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on the expanded content container after it renders.

### 6. "Show/Hide answer" to "Show/Hide response"

Replace the word "answer" with "response" in the expand/collapse toggle text.

### 7. Pinned chats header -- use standard back-arrow pattern

The current layout has "Back" button + Pin icon + "Pinned chats" text all crammed together. Better pattern: use the Pin icon as a decorative element in the title, and make the back button a simple left-arrow icon button (no text). Layout: `[<-] Pin Pinned chats` where `<-` is a small icon-only button, keeping it clean and standard.

Actually, a cleaner approach: make the header just show "Pinned chats" with the Pin icon as the dialog title (like the ask view uses Sparkles + title), and put the Back button as a ghost button below or as a simple text link. Looking at the screenshot, the issue is "Back" text + icon + title all on one line. The standard pattern is: icon-only back arrow on the left, then centered or left-aligned title. Let's use: a small `ArrowLeft` icon button on the far left, then `Pin icon + "Pinned chats"` as the title text. This gives a clean navigation feel without the text "Back" taking up space awkwardly.

---

### Technical Details

#### File: `src/components/AskTrendsAIDialog.tsx`

**Chips container (line 182)**: Change `h-[10.5rem]` to `min-h-[10.5rem]`.

**Loading state (lines 198-250)**: Restructure the input/loading section:
- When `isPending`: hide textarea, show submitted question as `<p className="text-xs text-muted-foreground italic">`, show a disabled button with `<Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Analyzing...`
- Remove the separate loading indicator block (lines 245-250)

**Pin button (lines 286-295)**: Add `min-w-[5.5rem]` to the Button className.

#### File: `src/components/PinnedChatsView.tsx`

**Header (lines 18-30)**: Replace the Back button + title layout:
- Use `ArrowLeft` icon from lucide-react as an icon-only ghost button
- Then `Pin` icon + "Pinned chats" as the title span
- Layout: `flex items-center gap-2`

**Expand/collapse text (line 79)**: Change "Hide answer"/"Show answer" to "Hide response"/"Show response".

**Scroll on expand (line 75)**: Add a ref to the card div, and after expanding, call `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on the card element. Use a callback ref or a small timeout to ensure the expanded content has rendered.

### Files to modify
- `src/components/AskTrendsAIDialog.tsx`
- `src/components/PinnedChatsView.tsx`
