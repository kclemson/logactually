

## Update Custom Logging Subtitle Text

### What changes
A single text edit in `src/pages/Settings.tsx` to update the subtitle under "Enable custom logging" so it mentions the Custom tab in the navigation and includes a couple of examples.

### Details

**Current subtitle (line 222):**
`Weight, measurements, mood, and more`

**New subtitle:**
`Use the Custom tab to log weight, blood pressure, and more`

This gives users a clear hint about where to find the feature (the Custom tab in the bottom nav) while also providing concrete examples of what they can track.

### Technical change

In `src/pages/Settings.tsx`, line 222: replace the text content of the subtitle `<p>` tag from `"Weight, measurements, mood, and more"` to `"Use the Custom tab to log weight, blood pressure, and more"`.

