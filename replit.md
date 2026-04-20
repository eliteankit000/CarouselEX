# CarouselEx — Replit Setup

## Project Overview
CarouselEx is an AI-powered content studio for creating viral carousels, posts, polls, and threads. It consists of:
- **Frontend**: Next.js 14 app (port 5000)
- **Backend**: FastAPI Python server (port 8000)

## Architecture
- `frontend/` — Next.js app with Tailwind CSS, Supabase auth, Zustand state management
- `backend/server.py` — FastAPI backend with MongoDB (Motor async driver), emergentintegrations LLM

## Workflows
- **Start application** — `cd frontend && npm run dev` (port 5000, webview)
- **Backend API** — `cd backend && uvicorn server:app --host 0.0.0.0 --port 8000` (port 8000, console)

## Environment Variables Required
- `OPENAI_API_KEY` — OpenAI API key for all AI generation features
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (for DB + auth)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (for DB + auth)
- `NEXT_PUBLIC_APP_URL` — Backend URL used by the frontend (already set)

## Notes
- App works in demo mode without Supabase keys (uses localStorage demo user)
- Backend AI features require `OPENAI_API_KEY`
- Backend uses Supabase for persistent data storage (voice profiles, content history, etc.)
- Frontend calls backend via `NEXT_PUBLIC_APP_URL` env variable
- Package manager: npm (frontend), pip (backend)
- LLM: OpenAI GPT-4o (via openai Python package)
- Image generation: DALL-E 3 (via openai Python package)
