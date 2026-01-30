

## Refine Privacy Page Tone and Styling

### Overview

Make four refinements to improve the Privacy & Security page's visual hierarchy and tone:
1. Reduce bolding to section headers only
2. Rewrite AI processing section to better convey the app's value
3. Remove the box from "For the Technically Curious" section
4. Rewrite Developer Access with personal "I" tone

---

### Changes to `src/pages/Privacy.tsx`

#### 1. Reduce Bolding

**Current issue:** Every list item label is bold (Email address, Passwords, Data isolation, etc.) which is overwhelming.

**Fix:** Remove `font-medium` from inline item labels. Keep only section headers (`<h2>`) bold.

**Lines affected:**
- Line 129: Remove `font-medium` from collected items labels
- Line 179: Remove `font-medium` from technical items labels
- Line 79: Update `highlightText` to use `text-foreground` without `font-medium`

---

#### 2. Rewrite AI Processing Section

**Current text:**
> "When you log food or exercise, your text is sent to an AI model to provide nutritional or exercise information."

**Proposed text:**
> "When you log food or exercise, your input is sent to an AI model that parses your freeform text and returns structured data — calories, macros, sets, reps — so you don't have to do the formatting or math yourself. Only the text you enter is sent — no user identifiers, account info, or other context. The AI knows the request came from this app, but nothing more specific than that."

This better "romances" the value-add: freeform input → structured output, no manual formatting.

---

#### 3. Remove Box from Technical Section

**Current:** Line 168 has `className="rounded-lg border p-4"`

**Fix:** Change to plain `<section>` like the other sections (no border/padding)

---

#### 4. Rewrite Developer Access with "I" Tone

**Current text:**
> "As a solo project, the developer has database access for debugging and support purposes. However, there is no routine review or mining of individual user data — logs are only accessed when investigating specific technical issues or responding to support requests."

**Proposed text:**
> "I have database access for debugging and fixing bugs, but I have no reason to look at your individual data — and I don't. Your logs are only accessed when investigating specific technical issues."

This:
- Uses "I" for the personal/passion project tone
- Removes "support purposes" and "support requests" (no commitment)
- Reinforces "no reason to look" rather than formal "no routine review"
- Shorter and more natural

---

### Summary of Visual Changes

| Element | Before | After |
|---------|--------|-------|
| List item labels | Bold (`font-medium`) | Normal weight |
| Highlighted text | Bold + foreground color | Foreground color only |
| Technical section | Boxed with border | Plain section |
| Developer Access | Third-person formal | First-person personal |

