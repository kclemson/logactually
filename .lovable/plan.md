
## Feature: Screenshot attachment in feedback

### Overview

Two things need to happen:
1. Users can attach a photo (from their camera roll or files) to a feedback submission
2. Users can capture a screenshot of their current in-app view with a single tap — "attach a screenshot of this page"

Both are achievable cleanly without any complex routing or one-off logic. The "current view screenshot" works by using `html2canvas` to render the live DOM of the app's `<main>` content area to a canvas, then compressing it to JPEG — no browser permissions required.

### Complexity assessment: Low–Medium

- **Photo from gallery**: Reuse the existing `PhotoCapture` component pattern — very low risk
- **In-app screenshot**: Add `html2canvas` (a well-maintained library), target the `<main>` element — low risk, no permissions prompt, no server involvement
- **Storage**: Add a storage bucket and a migration adding `image_url` to `feedback` — straightforward
- **Admin view**: Render the image inline when present — trivial

### Technical changes

#### 1. Database migration — add `image_url` to `feedback`

```sql
ALTER TABLE public.feedback ADD COLUMN image_url text;
```

#### 2. Storage bucket — `feedback-images`

A new private storage bucket with RLS: users can insert their own images, admins can read all, users can read their own.

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-images', 'feedback-images', false);
```

#### 3. New dependency — `html2canvas`

```
npm install html2canvas
```

This is a proven, widely-used library for rendering DOM to canvas. It captures exactly what is rendered — dark mode, custom fonts, current scroll position of the target element.

#### 4. `src/hooks/feedback/FeedbackSubmit.ts`

Change the `mutationFn` signature to accept `{ message: string; imageUrl?: string }` and include `image_url` in the insert.

#### 5. `src/components/FeedbackForm.tsx`

Add below the textarea:

- A **"📎 Attach photo"** button — opens a hidden `<input type="file" accept="image/*">` (no camera capture, since this is a desktop-leaning feature), compresses via canvas (reuse the `compressAndEmit` pattern from `PhotoCapture`)
- A **"📷 Screenshot this page"** button — calls `html2canvas(document.querySelector('main'))`, compresses the result, stores it as a preview
- A small inline thumbnail preview of the attached image with an ✕ remove button
- On submit: uploads the image to the `feedback-images` bucket under `{userId}/{feedbackId}.jpg`, then saves the public/signed URL alongside the feedback row

The screenshot targets `document.querySelector('main')` — which is the `<main>` element in `Layout.tsx` containing all page content. This gives a clean capture of whatever page the user is currently viewing (food log, trends, etc.) without capturing the nav bars.

#### 6. `src/hooks/feedback/FeedbackTypes.ts`

Add `image_url: string | null` to both `FeedbackWithUser` and `UserFeedback`.

#### 7. `src/components/FeedbackMessageBody.tsx`

When `image_url` is present, render it below the message text as a tap-to-enlarge thumbnail (using a simple `<a target="_blank">` wrapping an `<img>`).

#### 8. Admin view (`src/pages/Admin.tsx`)

The `FeedbackMessageBody` component is shared, so images appear automatically in the admin portal too.

### User flow

```text
User opens Settings → Feedback
  ↓
Types a message
  ↓
Option A: taps "Attach photo" → picks from gallery → thumbnail appears
Option B: taps "Screenshot this page" → html2canvas captures <main> → thumbnail appears
  ↓
Taps "Send Feedback"
  → image uploaded to feedback-images/{userId}/timestamp.jpg
  → feedback row inserted with image_url
  ↓
Admin sees the message + image inline in the admin portal
```

### What "screenshot this page" captures

Because it targets the `<main>` DOM element, it captures the current route's full rendered content:
- On `/` → today's food log
- On `/weights` → today's exercise log  
- On `/trends` → the trends charts
- On `/custom` → custom log entries

No extra routing logic needed — whatever is rendered is what gets captured.

### Files changed

| File | Change |
|---|---|
| Database migration | Add `image_url text` to `feedback` |
| Storage | Create `feedback-images` bucket + RLS policies |
| `package.json` | Add `html2canvas` dependency |
| `src/hooks/feedback/FeedbackSubmit.ts` | Accept optional `imageUrl`, include in insert |
| `src/hooks/feedback/FeedbackTypes.ts` | Add `image_url` field to both interfaces |
| `src/components/FeedbackForm.tsx` | Attach photo + screenshot buttons, thumbnail preview, upload on submit |
| `src/components/FeedbackMessageBody.tsx` | Render image when `image_url` is present |

### Caveats

- `html2canvas` cannot capture cross-origin iframes or certain CSS `background-image` URLs loaded from different origins — not an issue here since all content is in the same origin
- The screenshot captures the state at the moment the button is clicked — exactly what you'd want
- Images are stored privately; a signed URL (valid 1 hour) is generated at submit time and stored in the row, or alternatively the path is stored and a signed URL generated at read time by the admin view. The simpler approach is to store the path and generate signed URLs on read
