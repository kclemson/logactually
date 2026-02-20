
## Tag Ask AI logs with [dev] vs [user]

### The problem

The edge function has no structured logging for incoming questions, so there's no way to tell from Supabase logs whether a given "Ask AI" call came from you (admin) or a real user.

### The fix

Add a single `console.log` line in the edge function, just before the AI call, that emits the question alongside a `[dev]` or `[user]` tag — determined server-side by calling the existing `has_role` DB function.

Example log output:
```
[user] food: "How has my diet changed over the past month?"
[dev]  exercise: "What exercises should I do more often?"
```

### How it works

After the userId is extracted from the JWT (line 40), add one DB call:

```ts
const { data: isAdmin } = await supabase
  .rpc('has_role', { _user_id: userId, _role: 'admin' });
const tag = isAdmin ? '[dev]' : '[user]';
```

Then, right before the AI gateway fetch (after the prompt is built), add:

```ts
console.log(`${tag} ${mode}: "${question}"`);
```

That's it — two additions to `supabase/functions/ask-trends-ai/index.ts`. No client-side changes needed, no new tables, no trust issues (the tag is decided by the server using the same role check the Admin page uses).

The logs are visible in the Supabase edge function logs for `ask-trends-ai`.

### Files changed

| File | Change |
|---|---|
| `supabase/functions/ask-trends-ai/index.ts` | Check `has_role` after auth, store result as `tag`, add one `console.log` before the AI call |
