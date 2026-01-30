

## Privacy Page Overhaul: Collapsible Sections, Reduced Bolding, Personal Tone

### Overview

Major refinements to make the Privacy page more compact, personal, and playful while maintaining professionalism.

---

### Changes to `src/pages/Privacy.tsx`

#### 1. Remove ALL Inline Bolding

The issue is that list item labels use `text-foreground` which makes them stand out as bold against the `text-muted-foreground` text. Need to make everything the same weight.

**Fix:** Remove `text-foreground` from:
- Line 127: Bullet points (keep muted)
- Line 129: Item labels in "What Data Is Collected" 
- Line 149: Bullet points in "What Data Is Not Collected"
- Line 177: Bullet points in technical section
- Line 179: Item labels in technical section
- Line 203: Bullet points in control section

Make all list text uniformly `text-muted-foreground` - no highlights within lists.

---

#### 2. Make Sections Collapsible + Reduce Padding

Import and use `CollapsibleSection` component. Convert most sections to collapsible with tighter spacing.

**Default expanded:** Short Version (always visible, not collapsible), What Data Is Collected, What Data Is Not Collected

**Default collapsed:** Your Data Your Control, How AI Processing Works, For the Technically Curious, Developer Access

**Reduce spacing:** Change outer `space-y-6` to `space-y-4`

---

#### 3. Reorder Sections

Move "Your Data, Your Control" to appear BEFORE "How AI Processing Works":

**New order:**
1. The Short Version (boxed, not collapsible)
2. What Data Is Collected
3. What Data Is Not Collected
4. Your Data, Your Control ← moved up
5. How AI Processing Works
6. For the Technically Curious
7. Developer Access

---

#### 4. Personalized Short Version Text

**Current:**
> "Your data is yours. It's not sold, there are no ads, and no tracking pixels. This is a passion project built by one person, currently free to use."

**Updated:**
> "Your data is yours. It's not sold, there are no ads, and no tracking pixels. This is a passion project built by one person (hi! it's me!), currently free to use. I originally built this for myself and find it genuinely useful — thought others might too."

---

#### 5. Personalized Developer Access Text

**Current:**
> "I have database access for debugging and fixing bugs, but I have no reason to look at your individual data — and I don't. Your logs are only accessed when investigating specific technical issues."

**Updated:**
> "Technically, I have the ability to see what's logged in the database — but the only reason I'd ever look is to investigate and fix a bug. Even then, I use my own data first (I use this app daily). Honestly, I have zero interest in your food diary. It's yours."

Highlights: `zero interest`

---

#### 6. Specific Date in Footer

**Current:** `"Last updated: January 2026"`

**Updated:** `"Last updated: January 15, 2026"`

---

### Technical Implementation

```tsx
// Import CollapsibleSection
import { CollapsibleSection } from "@/components/CollapsibleSection";

// Structure (pseudocode):
<div className="space-y-4"> {/* reduced from space-y-6 */}
  
  {/* Header + close button */}
  
  {/* Short Version - always visible, boxed */}
  <section className="rounded-lg border bg-muted/30 p-4">
    <p className="text-sm text-muted-foreground">...</p>
  </section>
  
  {/* Collapsible sections with defaultOpen control */}
  <CollapsibleSection title="What Data Is Collected" icon={Database} defaultOpen storageKey="privacy-collected">
    <ul className="space-y-1.5 text-sm text-muted-foreground">...</ul>
  </CollapsibleSection>
  
  <CollapsibleSection title="What Data Is Not Collected" icon={Eye} defaultOpen storageKey="privacy-not-collected">
    ...
  </CollapsibleSection>
  
  <CollapsibleSection title="Your Data, Your Control" icon={Shield} storageKey="privacy-control">
    ...
  </CollapsibleSection>
  
  <CollapsibleSection title="How AI Processing Works" icon={Bot} storageKey="privacy-ai">
    ...
  </CollapsibleSection>
  
  <CollapsibleSection title="For the Technically Curious" icon={Code} storageKey="privacy-technical">
    ...
  </CollapsibleSection>
  
  <CollapsibleSection title="Developer Access" icon={UserCheck} storageKey="privacy-developer">
    ...
  </CollapsibleSection>
  
  {/* Footer */}
</div>
```

---

### Summary of All Changes

| Issue | Fix |
|-------|-----|
| Too much bolding | Remove `text-foreground` from all list items, only headers are emphasized |
| Too much vertical space | Reduce `space-y-6` → `space-y-4`, `space-y-2` → `space-y-1.5` in lists |
| Long scroll on mobile | Make sections collapsible, only first 2 data sections expanded by default |
| Impersonal tone | Add "(hi! it's me!)" and "I use this app daily" personal touches |
| Section order | Move "Your Data, Your Control" before AI Processing |
| Generic date | Change to "January 15, 2026" |

