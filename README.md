# Log Actually

AI-powered food, exercise, and custom metric logging. Braindump what you ate (or lifted), and AI handles the nutrition math and exercise tracking.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Lovable Cloud (Supabase) — auth, database, edge functions
- **Charts:** Recharts

## Getting Started

```sh
git clone <repo-url>
cd log-actually
npm install
npm run dev
```

### Environment Variables

Create a `.env` file (or copy `.env.example`) with:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

## Project Structure

```
src/
  pages/        — Route-level page components
  components/   — Reusable UI components
  hooks/        — Custom React hooks (data fetching, auth, etc.)
  lib/          — Utility functions and constants
  types/        — TypeScript type definitions
supabase/
  functions/    — Edge functions (AI analysis, barcode lookup, etc.)
  migrations/   — Database schema migrations
```

## License

MIT
