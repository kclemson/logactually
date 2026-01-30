
## Reduce Bullet List Vertical Spacing

### Problem

Bulleted lists currently use `space-y-1.5` which adds 6px of margin between each list item. This creates more vertical space between bullet points than exists between lines within a paragraph, making the lists feel spread out.

### Solution

Remove the `space-y-1.5` class from all `<ul>` elements in the Privacy page. The list items will then use natural line-height spacing (1.5), matching how paragraph text flows.

### Changes to `src/pages/Privacy.tsx`

**5 locations to update:**

1. **Line 105** - "What Data Is Collected":
   ```tsx
   // Change from:
   <ul className="space-y-1.5 text-sm text-muted-foreground">
   // To:
   <ul className="text-sm text-muted-foreground">
   ```

2. **Line 122** - "What Data Is Not Collected":
   ```tsx
   // Change from:
   <ul className="space-y-1.5 text-sm text-muted-foreground">
   // To:
   <ul className="text-sm text-muted-foreground">
   ```

3. **Line 138** - "Your Data, Your Control":
   ```tsx
   // Change from:
   <ul className="space-y-1.5 text-sm text-muted-foreground">
   // To:
   <ul className="text-sm text-muted-foreground">
   ```

4. **Line 169** - "For the Technically Curious":
   ```tsx
   // Change from:
   <ul className="space-y-1.5 text-sm text-muted-foreground">
   // To:
   <ul className="text-sm text-muted-foreground">
   ```

### Result

Bullet list items will have the same vertical spacing as lines within a paragraph, creating a more compact and natural reading flow. This reduces the overall page length and makes the content feel less spread out on mobile.
