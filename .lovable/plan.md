# Autoplay videos muted, with an easy sound toggle

Change memory videos in the immersive viewer so they **autoplay muted on each slide** (no tap-to-start), **loop**, keep the **native control bar**, and add a **prominent speaker toggle**. Once the user turns sound on, it **persists for the rest of that viewing session**.

All changes are in `src/pages/MemoryViewer.tsx` (the viewer only). No data, hook, or schema changes.

## Behavior
- A video slide plays immediately, muted, looping, with the browser's native controls.
- A speaker button (top-right of the media) toggles sound. Muted shows `VolumeX`; on shows `Volume2`.
- Sound preference lives at the viewer level, so after the first unmute every subsequent video in that session plays with sound.

## Implementation

**Viewer-level sound state**
- Add `const [soundOn, setSoundOn] = useState(false)` in `MemoryViewer`.
- Pass `soundOn` and `onToggleSound={() => setSoundOn(v => !v)}` down through `SlideContent` to `MediaSlide`.

**`MediaSlide` — video branch (replaces the poster + big Play button)**
- Remove the `playing` gate and the centered Play button / poster image / duration badge for videos.
- Always render the `<video>` when `url` is ready:
  - `ref`, `src={url}`, `poster={posterUrl ?? undefined}`, `autoPlay`, `loop`, `playsInline`, `controls`, and start `muted`.
  - Keep existing `onLoadedMetadata` (orientation fit) and `onError` (signed-URL retry).
- Add a `videoRef` and an effect that sets `videoRef.current.muted = !soundOn` (and calls `play()` best-effort) whenever `soundOn` or `url` changes. Starting muted guarantees autoplay always succeeds; the effect then applies the user's sound preference. Because `soundOn` only ever flips from a button tap, the page has user activation, so unmuting works for the current and later videos.
- Show the speaker toggle only for `media.kind === 'video'`: a glass round button positioned `absolute top-3 right-3 z-20`, calling `onToggleSound`, with `Volume2` / `VolumeX` and an accessible label ("Mute" / "Unmute").

**Imports**
- Add `Volume2`, `VolumeX` from `lucide-react`.
- Remove `Play` and `formatDuration` if they become unused after dropping the play-button/duration UI.

## Verification (Playwright against the live preview)
- Open a memory with a video → it autoplays muted and loops, native controls visible, with a speaker (muted) icon top-right.
- Tap the speaker → audio turns on, icon switches to `Volume2`.
- Swipe to another video → it autoplays already unmuted (session preference remembered).
- Photos and text-only slides are unaffected.