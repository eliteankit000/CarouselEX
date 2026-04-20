# CarouselEx — Dashboard Home Page Enhancement PRD

## Original Problem Statement
Update the existing CarouselEx Next.js + Supabase dashboard home page with four new
features that use the application's existing purple-gradient brand theme:

1. **AI Content Generator** — topic input + optional image/video upload → GPT-4o returns
   title, description, 15 hashtags, 10 keywords, content type, estimated reach.
2. **Viral Carousel Ideas** — 7 trend-aware GPT-4o carousel ideas, personalized per
   selected platform + stored niche. DataForSEO optional (falls back to GPT-4o only).
3. **First-time Setup Modal** — two-step onboarding (platform → niche) that auto-opens
   500ms after dashboard load for brand-new users.
4. **User Preferences Context** — Supabase-backed (best-effort) with localStorage
   fallback so the app works in demo/unauthenticated mode.

User explicitly chose:
- GPT-4o for text generation (user-provided real OpenAI key)
- Match the app's existing purple/violet brand theme (NOT the gray spec)
- Test in sandbox (confirmed working)
- Use real Supabase URL/keys (user_preferences table optional — graceful fallback)

## Architecture
- **Frontend**: Next.js 14 (App Router) on port 3000, Tailwind + framer-motion +
  lucide-react, dashboard gated behind demo auth (`lib/auth-context.tsx`).
- **Backend**: FastAPI on port 8001, uses OpenAI Python SDK (gpt-4o, vision-enabled)
  and Supabase for `user_preferences` (best-effort).
- **Routing**: Emergent ingress routes `/api/*` → backend, `/` → frontend.

## File Map (new + modified)
- `backend/server.py` — added endpoints:
  - `POST /api/ai-content/generate` (multipart: topic, image, video)
  - `GET  /api/carousel-ideas?platform=&niche=` (30-min in-memory cache)
  - `GET  /api/user-preferences?userId=`
  - `POST /api/user-preferences` (Supabase upsert)
- `frontend/src/app/layout.tsx` — wraps app with `<UserPreferencesProvider>`
- `frontend/src/app/dashboard/page.tsx` — new sections (AI Content + Viral Ideas +
  dividers); preserves all existing widgets (Trend Radar, Performance, AI Intelligence).
- `frontend/src/components/AIContentGenerator.tsx` — Feature 1 UI
- `frontend/src/components/ViralCarouselIdeas.tsx` — Feature 2 UI (lazy-loaded)
- `frontend/src/components/SetupModal.tsx` — Feature 3 UI (portal + sessionStorage guard)
- `frontend/src/context/UserPreferencesContext.tsx` — Feature 4 context
- `frontend/src/components/ui/{PillBadge,ContentCard,SkeletonCard}.tsx` — reusable UI
- `frontend/src/types/content.ts` — TypeScript interfaces

## Implementation Status (2026-01-20)
- [x] Backend endpoints implemented + unit-tested (8/8 pytest)
- [x] Frontend components implemented + e2e-tested (26/26 Playwright)
- [x] Setup modal auto-opens for new users, sessions-gated
- [x] Platform pills switch ideas (cache-aware)
- [x] Copy buttons on all output cards
- [x] Skeleton + error + retry states
- [x] Mobile / responsive layout verified
- [x] Brand theme match (purple gradient, d-card / d-btn-primary / d-input classes)

## Known Limitations / Notes
- Supabase `user_preferences` table may not exist in customer project → graceful
  fallback to localStorage. Run the SQL in the original spec (DDL) to enable durable
  multi-device persistence.
- DataForSEO credentials not provided → endpoint falls back to OpenAI-only generation.
- Auth is in demo mode (Supabase env vars blanked on frontend) to allow seamless
  testing without a real user in Supabase `auth.users`. To enable real auth, re-add
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `frontend/.env` and
  ensure a `public.users` row is seeded on signup.

## Prioritized Backlog
- **P1** — Split `backend/server.py` (>1700 LOC) into routers per feature.
- **P1** — Bound `_carousel_cache` (LRU or max-size) to prevent unbounded growth.
- **P2** — Use `gpt-4o-mini` for topic-only (no-image) AI content calls to cut cost.
- **P2** — Standardize backend error response shape; some detail fields are objects.
- **P2** — Investigate the ~500 errors from pre-existing widgets (Trend Radar /
  Performance / AI Intelligence) on a fresh demo user — not blocking, but noisy.
- **P2** — DataForSEO integration (credentials required) to ground carousel ideas in
  real search trends.

## Next Tasks
- (Optional) Wire real Supabase auth and run the provided `user_preferences` SQL.
- (Optional) Add the ffmpeg-dependent video path to the Playwright smoke test.
- (Optional) Add a "Save to Library" action on each carousel idea.
