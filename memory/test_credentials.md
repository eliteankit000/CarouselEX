# Test Credentials — CarouselEx

## Demo Authentication (frontend runs in demo mode)
Any email/password combination works at `/login`. The frontend's
`/app/frontend/src/lib/auth-context.tsx` falls back to demo mode because
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are intentionally
blank in `frontend/.env` (to bypass Supabase auth that requires a real user).

Recommended test account:
- email: `demo@carouselex.com`
- password: `demo1234`

On successful "login", the app stores:
```
localStorage['carouselex_demo_user'] = {
  id: 'demo-user-001',
  email: '<entered email>',
  full_name: 'Demo User',
  avatar_url: null,
  plan: 'starter'
}
```

## Skip the first-time setup modal
To bypass the 2-step onboarding modal during testing, pre-seed:
```js
localStorage['cx_user_prefs_v1:demo-user-001'] =
  '{"platform":"Instagram","niche":"Finance","isSetupComplete":true}';
sessionStorage['cx_setup_modal_shown'] = '1';
```

## Backend API — no auth required
Backend is open (demo). No tokens needed for the 4 new endpoints:
- `POST /api/ai-content/generate`
- `GET  /api/carousel-ideas?platform=&niche=`
- `GET  /api/user-preferences?userId=`
- `POST /api/user-preferences`

## External services configured
- **OpenAI** — real API key in `backend/.env` (`OPENAI_API_KEY`)
- **Supabase** — URL + anon key in `backend/.env` (for `user_preferences` table;
  if the table does not exist in the customer project, backend gracefully returns
  `{data: null}` and localStorage is used as primary store).
- **DataForSEO** — NOT configured; `/api/carousel-ideas` falls back to GPT-4o only.
