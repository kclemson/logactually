

## Update "How AI Processing Works" in Privacy Page

The current paragraph only describes the input-parsing use case (logging food/exercise). The "Ask AI" feature on the Trends page sends significantly more data to the AI model, and users should know about it.

### What changes

**File:** `src/pages/Privacy.tsx` -- update the `aiProcessing.text` string in the `PRIVACY_CONTENT` constant.

**Current text:**
> When you log food or exercise, your input is sent to an AI model that parses your freeform text and returns structured data -- calories, macros, sets, reps -- so you don't have to do the formatting or math yourself. Only the text you enter is sent -- no user identifiers, account info, or other context. The AI knows the request came from this app, but nothing more specific than that.

**Proposed replacement:**

> This app uses AI in two ways:
>
> **Logging:** When you log food or exercise, your freeform text is sent to an AI model that parses it into structured data -- calories, macros, sets, reps -- so you don't have to do the formatting yourself. Only the text you type is sent.
>
> **Ask AI:** The Trends page has an optional "Ask AI" feature that answers questions about your habits. When you use it, your question plus up to 90 days of your logged food and exercise data is sent to the AI so it can give you a relevant answer. If you opt in, basic profile info (height, weight, age) is also included. This data is not stored by the AI provider.
>
> In both cases, no user identifiers or account info are sent. The AI knows the request came from this app, but nothing more specific than that.

This breaks the single paragraph into a clearer two-part explanation that accurately reflects both use cases, while keeping the reassuring privacy message at the end.

### Technical detail

This is a single string change in the `PRIVACY_CONTENT.aiProcessing.text` field (around line 57 of `Privacy.tsx`). The rendering will need a small tweak since the current code renders it as a single `<p>` tag -- we'll split it into multiple paragraphs or use a small array of content blocks to preserve the formatting.
