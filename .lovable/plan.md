
# Enhance README with Storytelling and Updated Screenshot

## What will change

**Files modified:** `README.md` only, plus one new image asset.

**Image swap:** Replace the current `public/logactually-screen2.png` (tall trends screenshot) with the new wider charts screenshot (`logactually-screen3-charts.png`). The first hero screenshot stays as-is.

## New README structure

### 1. Title + new tagline
Update the opening line to reflect the app's evolution from food logging to general-purpose logging, matching the LinkedIn tone. Something like:

> Every food tracking app I tried drove me nuts -- too many taps, too many screens, too much friction. So I built my own. The idea: just braindump what you ate in your usual stream-of-consciousness way, and wire it up to AI to turn your word salad into structured data with nutritional information.
>
> Once food tracking was working the way I liked, I added exercise logging (my watch doesn't do a great job tracking weight-lifting workouts). And then custom logs for things like body weight, blood pressure, sleep -- classic "if you give a mouse a cookie..."
>
> It has a demo mode if you want to poke around without creating an account.

### 2. Screenshots (keep hero, swap second)
- **Image 1**: `logactually-screen1.png` -- full width, unchanged
- **Image 2**: Replace `logactually-screen2.png` reference with `logactually-screen3-charts.png` -- the wider trends screenshot, still scaled down via HTML `<img>` tag

### 3. Features section (new)
A scannable bullet list covering key capabilities:

**Food Logging**
- Natural language input -- describe what you ate however you want, AI parses it into items with full macro breakdowns
- Photo-based logging -- snap a picture and AI identifies items
- Barcode scanning via camera
- Editable portions with proportional nutrient scaling
- Saved meals for quick re-logging
- Smart suggestions -- detects repeated patterns and offers to save them

**Exercise Logging**
- Natural language input for weight training and cardio
- Estimated calorie burn using MET values from the 2024 Compendium of Physical Activities
- Apple Health import for watch-based workouts
- Saved routines for quick re-logging

**Custom Logs**
- Track anything: body weight, blood pressure, sleep, mood, journal entries, etc.
- Numeric, dual-numeric, and text value types
- Built-in templates for common metrics

**Trends and Insights**
- Charts for calories, macros, exercise volume, and custom metrics over 7/30/90-day windows
- "Ask AI" -- query your own logged data in plain language
- Daily calorie target tracking with color-coded indicators

**Other**
- Dark mode
- PWA (installable on mobile)
- CSV export
- Demo mode -- try it without creating an account
- Imperial and metric unit support

### 4. Tech Stack, Getting Started, Project Structure, License
Keep existing sections as-is.

## Technical details

1. Copy `user-uploads://logactually-screen3-charts.png` to `public/logactually-screen3-charts.png`
2. Update `README.md`:
   - Replace tagline (line 3) with the storytelling intro
   - Replace the `logactually-screen2.png` reference (line 7) with `logactually-screen3-charts.png`
   - Insert a "Features" section between the screenshots and "Tech Stack"
