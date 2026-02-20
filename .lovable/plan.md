
## Fix: "Screenshot this page" on the Help page is always self-referential

### The problem

`FeedbackForm` lives on `/help`. When a user clicks "Screenshot this page", `html2canvas` captures the `<main>` element — which is the Help & Feedback page itself. That screenshot is almost never what the user wants; they want to capture their food log, trends, or weight page.

### The solution: a page picker

Instead of auto-capturing the current page (which is always `/help`), show a small inline picker of the app's main pages so the user can say "screenshot my Food Log" or "screenshot my Trends". When they pick one, the app:

1. Navigates a hidden iframe (or uses `history.pushState` + `html2canvas` on the live DOM) to that route
2. Captures it

**Simpler, better approach — navigate away, capture, come back:**

The cleanest UX is a dropdown/select of named pages. When the user picks one:

1. Use `window.history.pushState` to silently change the URL to the target route (e.g. `/`)
2. Re-render triggers React Router to mount the target page's content in `<main>`
3. Call `html2canvas` on `<main>` after a short `requestAnimationFrame` delay
4. Use `window.history.pushState` to restore `/help`

This is actually elegant — React Router renders the route immediately, no iframes needed.

**Alternatively (even simpler):** Just rename and reframe the button. Show a labelled picker: `📷 Capture page` → dropdown with named options. On selection, navigate away briefly, capture, return. This is fully self-contained in `FeedbackForm.tsx`.

### The named pages available

From `App.tsx`:
- `/` → Food Log
- `/weights` → Exercise Log  
- `/trends` → Trends
- `/history` → History
- `/custom` → Custom Log

### Implementation details

#### `src/components/FeedbackForm.tsx`

1. Replace the plain "Screenshot this page" button with a small inline selector:
   - A button labelled "Capture a page screenshot"
   - On click, shows a compact list of 5 named page options (Food Log, Exercise Log, Trends, History, Custom Log)
2. When a page option is selected:
   - Use `useNavigate` from `react-router-dom` to navigate to the target route
   - Wait one animation frame for React Router to render the new route's content in `<main>`
   - Call `html2canvas` on `<main>` 
   - Navigate back to `/help`
   - Set the captured image as the attachment
3. The picker dismisses after selection (or on clicking elsewhere)

#### State additions
- `showPagePicker: boolean` — controls whether the page list is shown
- `isCapturing: boolean` — replaces `isScreenshoting`, shows "Capturing…" during the async flow

#### No new dependencies needed
`useNavigate` is already available from `react-router-dom` (already installed). `html2canvas` is already installed.

### Files changed

| File | Change |
|---|---|
| `src/components/FeedbackForm.tsx` | Replace "Screenshot this page" with a page-picker flow using `useNavigate` + `html2canvas` |

### UX flow

```text
User types feedback on /help
  ↓
Clicks "📷 Capture a page screenshot"
  ↓
Compact inline list appears:
  • Food Log
  • Exercise Log
  • Trends
  • History
  • Custom Log
  ↓
User taps "Food Log"
  ↓
App navigates to /, waits one frame, captures <main>, navigates back to /help
  ↓
Thumbnail preview appears in form
  ↓
User sends feedback with screenshot attached
```

### Edge case: navigation delay

Some pages (Food Log, Trends) load data asynchronously. To handle this, after navigating we wait ~400ms (a `setTimeout`) before capturing — long enough for the skeleton/loading state to pass in most cases, short enough to feel instant. We can also show "Capturing Food Log…" during this wait.
