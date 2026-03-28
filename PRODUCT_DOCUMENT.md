# SocialFlow — Product Document
**Version 1.0 · March 2025**

---

## 1. Product Overview

**SocialFlow** is an AI-powered social media scheduling platform that helps creators, small businesses, and marketing teams maintain a consistent posting cadence across Instagram, LinkedIn, Twitter (X), and Facebook — without the daily manual effort.

The platform combines a research-backed best-time recommendation engine, AI caption generation via Mistral-7B, automatic per-platform content adaptation, and a full scheduling queue into a single, elegantly designed dashboard.

---

## 2. Problem Statement

Social media success requires **consistency**, but consistency is hard:

| Pain Point | Impact |
|---|---|
| Writing captions is time-consuming | Creators skip posting or recycle stale content |
| Best posting times vary by platform | Engagement suffers from poorly timed posts |
| One caption needs 4 different platform rewrites | Teams spend hours on manual reformatting |
| Scheduling tools are complex or expensive | Small teams revert to manual posting |
| No single source of truth for all platforms | Content gets lost across tools and spreadsheets |

SocialFlow addresses all five pain points in one product.

---

## 3. Target Users

| Segment | Description |
|---|---|
| **Solo Creators** | Influencers, coaches, and freelancers managing personal brand accounts |
| **Small Businesses** | Founders and marketing teams of 1–10 people without a dedicated social media manager |
| **Agencies** | Social media agencies managing multiple client accounts |

---

## 4. Core Features

### 4.1 AI Content Generator
- User enters a short idea (3–500 characters) and selects tone (Professional / Casual / Fun) and target platforms.
- SocialFlow generates **4–6 caption variations**, each with:
  - **Hook** — opening line designed to stop the scroll
  - **Body** — main message tuned to the selected tone
  - **CTA** — platform-appropriate call-to-action
- Powered by **Mistral-7B-Instruct** via Hugging Face Inference API.
- Falls back to a rich template engine when the API is unavailable, ensuring the feature always works.

### 4.2 Per-Platform Caption Adapter
- Once a caption is generated, clicking **"Adapt for [Platform]"** rewrites it according to platform-specific rules:
  - **Instagram:** emoji-rich, 2200-char limit, 5–10 hashtags inline
  - **LinkedIn:** professional tone, 1–3 paragraphs, thought-leadership framing
  - **Twitter/X:** 280-char hard limit, punchy, conversational
  - **Facebook:** warm community tone, question-based CTA
- Uses the same Mistral-7B endpoint with platform-specific system prompts.

### 4.3 Best Posting Time Engine
- Scores time windows using aggregated platform research data (day-of-week × hour-of-day × historical engagement lift %).
- Multi-platform cross-overlap bonus rewards windows that are strong across all selected platforms simultaneously.
- 3-hour deduplication window prevents recommending back-to-back slots on the same day.
- Implemented in both **backend** (`caption_service.py`) and **frontend** (`bestTimes.ts`) for offline resilience.
- Returns top 3 slots with day, window label, and engagement lift percentage.

### 4.4 AI Hashtag Generator
- Generates 8–12 hashtags from the post content.
- Categorised as high-reach, medium-reach, and niche for strategic mix.
- Powered by the hashtags endpoint; falls back to content-keyword extraction.

### 4.5 Content Scheduler
- Posts can be scheduled with a specific date, time, and platform selection.
- APScheduler (backend) checks every minute and publishes due posts.
- Platform publisher services (`instagram_service.py`, `linkedin_service.py`, `twitter_service.py`) handle the actual API calls.

### 4.6 Content Calendar
- 31-day grid view showing scheduled posts per day.
- Platform colour dots and post count badges.
- Engagement heatmap overlay (colour intensity = predicted engagement).

### 4.7 Analytics Dashboard
- Overview stats: scheduled posts, published posts, total reach, engagement rate.
- Tabbed breakdown by platform.
- Connects to `/api/v1/analytics/dashboard`.

### 4.8 Integrations
- Dedicated page for connecting social accounts.
- Instagram, LinkedIn, Facebook: OAuth 2.0 flow.
- Twitter/X: API Key / Bearer Token input.
- Connected/Disconnected status badges with Disconnect option.

### 4.9 Contact Footer
- Persistent contact form at the bottom of every dashboard page.
- Fields: Name, Email, Message.
- Vintage editorial design; inline success state on submission.

---

## 5. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  Next.js 14 (App Router)  ·  Tailwind CSS  ·  React Query  │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST / JSON  (JWT Bearer)
┌──────────────────────────▼──────────────────────────────────┐
│                  FastAPI Backend (Python 3.11)               │
│  /api/v1/auth   /api/v1/posts   /api/v1/captions            │
│  /api/v1/hashtags   /api/v1/analytics                       │
│                                                             │
│  caption_service.py  ──►  HuggingFace Inference API         │
│                           (Mistral-7B-Instruct-v0.3)        │
│  APScheduler  ──►  Platform Publisher Services              │
└──────────────────────────┬──────────────────────────────────┘
                           │ Supabase Client (PostgreSQL + Auth)
┌──────────────────────────▼──────────────────────────────────┐
│                       Supabase                              │
│  Auth (JWT)  ·  Posts table  ·  Analytics table             │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Stack
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Routing, SSR, file-based layouts |
| Tailwind CSS | Styling with custom vintage design tokens |
| TanStack React Query | Server state, caching, background refetch |
| Zustand (`useAuthStore`) | Client auth state (token, user object) |
| Axios | HTTP client with JWT interceptor |
| Lucide React | Icon library |

### Backend Stack
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Pydantic v2 + pydantic-settings | Request/response validation, config |
| Supabase Python Client | Auth validation, database queries |
| APScheduler | Background job scheduler for post publishing |
| `httpx` | Async HTTP calls to HuggingFace API |
| Uvicorn | ASGI server |

---

## 6. API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login → returns `access_token` |

### Posts
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/posts` | List posts (filterable by status/platform) |
| POST | `/api/v1/posts` | Create / schedule a post |
| PATCH | `/api/v1/posts/{id}` | Update post |
| DELETE | `/api/v1/posts/{id}` | Delete post |

### Captions
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/captions/generate` | Generate caption variations |
| POST | `/api/v1/captions/adapt` | Adapt caption for a target platform |
| POST | `/api/v1/captions/best-times` | Get top N posting windows |

### Hashtags
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/hashtags/generate` | Generate hashtags from content |

### Analytics
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/analytics/dashboard` | Aggregated dashboard stats |

All endpoints except `/auth/*` require `Authorization: Bearer <token>`.

---

## 7. Design System

### Vintage Editorial Aesthetic
SocialFlow uses a distinctive vintage/editorial visual language:

| Token | Value | Usage |
|---|---|---|
| `cream` | `#F5F0E8` | Page backgrounds |
| `paper` | `#FDFAF4` | Card backgrounds |
| `parchment` | `#EDE5D0` | Subtle dividers |
| `forest` | `#2C4A3E` | Sidebar, primary buttons |
| `forest-mid` | `#3A5C4F` | Hover states |
| `gold` | `#C9A84C` | Accents, active nav, dividers |
| `ink` | `#1C1C1E` | Primary text |
| `sage` | `#7A9E8E` | Secondary text |
| `blush` | `#E8C5B0` | Warm accents |

### Typography
| Role | Font | Tailwind Class |
|---|---|---|
| Display headings | Playfair Display | `font-display` |
| Accent / brand | Bebas Neue | `font-accent` |
| Body copy | Raleway | `font-body` |
| Monospace / labels | Courier Prime | `font-type` |
| Elegant serif | Cormorant Garamond | `font-elegant` |

### Typewriter Animation
The dashboard hero uses a React typewriter component (`TypewriterHero`) that cycles through 7 brand phrases with randomised per-character timing (42–72ms) and a CSS `step-end` blinking cursor — inspired by editorial interactive journalism.

---

## 8. Environment Configuration

### Backend (`backend/.env`)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SECRET_KEY=your-secret-key
HUGGINGFACE_API_KEY=hf_...
INSTAGRAM_ACCESS_TOKEN=
LINKEDIN_ACCESS_TOKEN=
TWITTER_API_KEY=
FACEBOOK_ACCESS_TOKEN=
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 9. Running Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- A Supabase project (or leave credentials blank for offline/demo mode)

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 10. Known Limitations & Roadmap

### Current Limitations
| Issue | Notes |
|---|---|
| OAuth flows are simulated | Real platform OAuth requires verified developer apps |
| Analytics data is mocked | Requires Supabase tables + real post metrics |
| No image/video upload | Caption + text scheduling only in v1 |
| Hydration warning on heatmap | `Math.random()` in dashboard calendar — non-breaking |

### Roadmap (v2)
- Real OAuth integration for all 4 platforms
- Media upload (images, video thumbnails)
- Team workspaces and approval workflows
- AI performance prediction (engagement score before publishing)
- Mobile app (React Native)
- Webhook support for real-time publish confirmations

---

## 11. Project Structure

```
Social-media-scheduler/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # auth, posts, hashtags, analytics, captions
│   │   ├── core/            # config, security, supabase client
│   │   ├── models/          # Pydantic schemas
│   │   ├── services/        # caption_service, hashtag_service, publisher
│   │   ├── tasks/           # APScheduler
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/      # login, register
    │   │   └── (dashboard)/ # layout, dashboard, content-gen,
    │   │                    # compose, calendar, analytics,
    │   │                    # integrations, settings
    │   ├── components/ui/   # TypewriterHero, shared components
    │   └── lib/             # api.ts, bestTimes.ts, store, utils
    ├── tailwind.config.ts
    └── .env.local
```

---

*SocialFlow™ · Built with FastAPI + Next.js · Est. 2025*
