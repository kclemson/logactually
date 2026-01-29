

## Update Training Volume Color to Match Exercise Charts

### Change

**`src/pages/Trends.tsx` - Line 25**

Update `trainingVolume` to use the same bright purple value as the exercise charts:

From:
```typescript
trainingVolume: "hsl(262 70% 45%)", // Darker purple for volume chart, visible on both themes
```

To:
```typescript
trainingVolume: "hsl(262 83% 58%)", // Bright purple matching exercise charts (kept separate const for future adjustment)
```

---

### Result

- Two semantic color constants remain: `trainingVolume` for the volume chart, exercise charts use `hsl(262 83% 58%)` inline
- Both currently use the same bright purple value
- Easy to differentiate later by just changing the `trainingVolume` value

