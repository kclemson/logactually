

# Simplify Feedback Message Labels and Fix Hierarchy

## Changes to `src/components/FeedbackMessageBody.tsx`

Two updates:

1. **Change label** from "You wrote" to "Feedback created" -- works for both user and admin views
2. **Move labels outside the indented blocks** so the hierarchy is:

```
Feedback created (MMM d, HH:mm):
  |  message text (indented with border-l)

Response (MMM d HH:mm):
  |  response text (indented with border-l)
```

Updated component structure:

```tsx
<>
  <span className="text-xs text-muted-foreground">
    Feedback created ({format(parseISO(createdAt), "MMM d, HH:mm")}):
  </span>
  <div className="ml-3 pl-3 border-l-2 border-border">
    <p className="text-xs whitespace-pre-wrap mt-0.5">{message}</p>
  </div>

  {response && respondedAt && (
    <>
      <span className="text-xs text-muted-foreground mt-2 block">
        Response ({format(parseISO(respondedAt), "MMM d HH:mm")}):
      </span>
      <div className="ml-3 pl-3 border-l-2 border-primary/30">
        <p className="text-xs whitespace-pre-wrap text-muted-foreground mt-0.5">{response}</p>
      </div>
    </>
  )}
</>
```

Only one file changes. No variant prop, no changes to FeedbackForm or Admin.
