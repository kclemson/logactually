## Goal

Fix the desyncing mute button on autoplayed videos in the immersive memory viewer by removing the redundant custom mute button and relying solely on the native video control. This eliminates the dual-source-of-truth bug at its root.

## Why this fixes the bug

Today the video renders native `controls` (which already include a mute button) plus a second custom overlay button. The custom button drives React state `soundOn`, which a one-way effect pushes into `videoRef.current.muted`. Because nothing pushes the native control's changes back into React, the two desync the moment the native mute is used, leaving the custom button feeling "dead." Deleting the custom button makes the DOM's `muted` property the single source of truth — no sync, no desync.

## Changes (all in `src/pages/MemoryViewer.tsx`)

1. **Remove the custom mute button** — delete the overlay `<button>` (and the `<>...</>` fragment wrapping it) in `MediaSlide`, leaving just the `<video>` element. Keep the native `controls` attribute and the `muted` attribute (still required so autoplay is allowed).

2. **Remove the `soundOn` state and its plumbing**:
   - Delete `const [soundOn, setSoundOn] = useState(false)` and the `onToggleSound` wiring.
   - Drop the `soundOn` / `onToggleSound` props from `SlideContent` and `MediaSlide`.
   - Remove the `SlideContent` `onToggleSound={...}`/`soundOn={...}` usage where `<SlideContent>` is rendered.

3. **Replace the state-mirroring effect with autoplay-only logic.** The effect at lines ~429–434 currently does `el.muted = !soundOn; el.play()`. Since the video always starts muted now (via the `muted` attribute) and the native control owns muting, this effect no longer needs to touch `muted`. Keep a minimal effect that just kicks off playback when the source URL changes (`void el.play().catch(() => {})`), keyed on `[url]` — this preserves reliable autoplay across slide changes without mirroring any state.

4. **Remove now-unused imports**: `Volume2` and `VolumeX` from `lucide-react`.

## Behavior after the change

- Each video slide autoplays muted and shows the native controls.
- The user taps the native unmute to hear sound on that slide.
- Moving to the next video starts muted again (no cross-slide memory) — accepted as the simplest, desync-proof behavior. If we later move off native controls, we can revisit a custom control + session preference then.

## Technical notes

- The `muted` boolean attribute on `<video>` must stay for autoplay policy compliance; the native control toggles the live `muted` property at runtime, which is independent of the initial attribute.
- No business-logic, data, or backend changes — this is purely presentation cleanup.

## Verification

- Open a memory with a video in the immersive viewer; confirm it autoplays muted with native controls, and that the native mute/unmute toggles sound reliably with no leftover custom button.
- Confirm there are no TypeScript errors from removed props/imports.
- Confirm navigating between multiple video slides keeps autoplay working.