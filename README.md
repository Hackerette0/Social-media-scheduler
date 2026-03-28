# SocialFlow — AI-Powered Social Media Scheduler

Schedule posts across **Twitter/X**, **Instagram**, and **LinkedIn** with AI-generated hashtags powered by Hugging Face.

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | Next.js 14 (App Router) + Tailwind CSS  |
| Backend   | Python FastAPI + APScheduler            |
| Database  | Supabase (PostgreSQL + RLS)             |
| AI        | Hugging Face Inference API              |
| Platforms | Twitter API v2, Instagram Graph API, LinkedIn UGC API |

---

## Features

- **Multi-platform posting** — Twitter, Instagram, LinkedIn from one UI
- **AI Hashtag Generator** — one-click hashtag suggestions via Hugging Face (falls back to smart keyword extraction when no API key is set)
- **Post Scheduler** — pick a date/time; APScheduler publishes automatically every minute
- **Content Calendar** — visual monthly calendar of scheduled posts
- **Analytics Dashboard** — engagement charts (likes, comments, shares) per platform
- **Post Management** — create, edit, delete posts in a clean table view

---

## Quick Start

### 1. Clone & configure

```bash
git clone <repo-url>
cd social-media-scheduler

# Backend
cp backend/.env.example backend/.env
# Fill in your keys (see below)

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `supabase/schema.sql`
3. Copy your **Project URL**, **anon key**, and **service_role key** into `backend/.env`

### 3. Run with Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

### 4. Run locally (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # fill in keys
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## API Keys Setup

### Supabase (required)
1. Go to https://app.supabase.com → your project → Settings → API
2. Copy `Project URL`, `anon public`, and `service_role` keys

### Twitter/X (optional)
1. Apply at https://developer.twitter.com
2. Create an app with **Read + Write** permissions
3. Copy API Key, API Secret, Access Token, Access Token Secret, Bearer Token

### Instagram (optional)
1. Create a Meta Developer app at https://developers.facebook.com
2. Add **Instagram Graph API** product
3. Get a long-lived access token and your Instagram Business Account ID

### LinkedIn (optional)
1. Create an app at https://www.linkedin.com/developers
2. Request `w_member_social` scope
3. Get an access token via OAuth 2.0

### Hugging Face (optional — enables AI hashtags)
1. Sign up at https://huggingface.co
2. Settings → Access Tokens → New token (read)
3. Set `HUGGINGFACE_API_KEY` in `.env`

> **Without a Hugging Face key**, the app falls back to smart keyword-extraction hashtags — still useful!

---

## Project Structure

```
social-media-scheduler/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # auth, posts, hashtags, analytics
│   │   ├── core/             # config, security, supabase client
│   │   ├── models/           # Pydantic schemas
│   │   ├── services/         # twitter, instagram, linkedin, publisher, hashtag AI
│   │   ├── tasks/            # APScheduler polling job
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # login, register pages
│   │   │   └── (dashboard)/  # dashboard, compose, calendar, analytics
│   │   ├── components/       # UI, dashboard, scheduler components
│   │   ├── lib/              # api client, zustand store, utils
│   │   └── types/            # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── supabase/
│   └── schema.sql
└── docker-compose.yml
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get JWT token |
| GET | `/api/v1/posts` | List posts |
| POST | `/api/v1/posts` | Create/schedule post |
| PATCH | `/api/v1/posts/{id}` | Update post |
| DELETE | `/api/v1/posts/{id}` | Delete post |
| POST | `/api/v1/hashtags/generate` | AI hashtag generation |
| GET | `/api/v1/analytics/dashboard` | Dashboard stats |

Full interactive docs: http://localhost:8000/docs
