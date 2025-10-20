# Canyoubeatgroq.com

A simple game platform to test your (a human)'s speed and accuracy against AI models(openai, groq, gemini) from the fastest inference provider (groq).

Built at the [first official Cursor Hackathon Singapore, 2025](https://luma.com/cursor-hack-sg?tk=VzQhWL) 🎉

![Preview](./app/preview.png)


## Stack
- Next.js (App Router, TS)
- Tailwind CSS
- Vercel AI SDK (`ai`, `@ai-sdk/openai`)
- Vercel KV (AI cache; optional local fallback)
- Supabase (leaderboard)

## Quick start
```bash
# 1) Install
npm i

# 2) Configure env
cp ENV.sample .env.local
# fill in OPENAI_API_KEY and START_TOKEN_SECRET

# (Optional) Vercel KV for persistence
# KV_REST_API_URL=...
# KV_REST_API_TOKEN=...

# 3) (Optional) Supabase local
npm i -D supabase @supabase/supabase-js
npx supabase init
# edit supabase/migrations/* if needed
npx supabase db start
npx supabase db push

# 4) Dev
npm run dev

# 5) Build
npm run build && npm run start
```

## Routes
- POST /api/start → { problem, startToken, seed, expiresAt }
- POST /api/ai-solve → { aiAnswer, aiTimeMs, cached }
- POST /api/submit → { outcome, userTimeMs, aiTimeMs, winMarginMs, savedToLb }
- GET  /api/leaderboard?seed=YYYY-MM-DD&limit=50 → { entries }

## Env
- OPENAI_API_KEY (required)
- START_TOKEN_SECRET (required)
- KV_REST_API_URL, KV_REST_API_TOKEN (optional)
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE (optional, for leaderboard)
- GROQ_API_KEY (optional, if using Groq OpenAI-compatible endpoint)
- NEXT_PUBLIC_APP_URL (optional)

## Notes
- Leaderboard stored in Supabase when configured; otherwise uses in-memory KV fallback (ephemeral).
- startToken embeds server timestamp; server computes user time and enforces 35s expiry.
