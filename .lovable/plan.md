
# Theme Selection: Switch to Dropdown

## Change

Replace the three-button theme toggle (Light / Dark / System) with a Radix Select dropdown, keeping the same label and position.

## Technical Details

### File: `src/components/settings/PreferencesSection.tsx`

- Replace the `div.flex.gap-2` with button group (lines 53-67) with a `Select` component from `@/components/ui/select`
- Each option shows its icon + label in the dropdown items
- The trigger displays the currently selected theme with its icon
- Update imports: add `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` from `@/components/ui/select`, remove unused icon imports if desired (though keeping them for use inside SelectItems)

The row stays as `flex items-center justify-between` with "Theme" label on the left and the Select trigger on the right.

```tsx
<Select value={theme} onValueChange={(v) => handleThemeChange(v as 'light' | 'dark' | 'system')}>
  <SelectTrigger className="w-[130px] h-9">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {themeOptions.map(({ value, label, icon: Icon }) => (
      <SelectItem key={value} value={value}>
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

Remove the `mounted` state variable since it was only used for the button highlight styling.

One file changed, no logic impact.
