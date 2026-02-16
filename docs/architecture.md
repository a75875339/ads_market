# Architecture

High-level architecture of the Ads Market backend and frontend.

## Overview

- **Backend**: Monorepo NestJS app that runs as four processes: **API**, **tg-bot**, **worker**, **job-worker**. Same codebase, entrypoint is `main.ts`; `APP_NAME` selects which app to run.
- **Frontend**: React (Vite) Telegram Mini App; talks to the API over HTTP and uses TonConnect for TON wallet.
- **Data**: PostgreSQL (Drizzle ORM), Redis (cache/locks), TON blockchain (payments).
- **Telegram**: Bot with webhook; Mini App opened from the bot.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Telegram                                       │
│  ┌─────────────┐    webhook     ┌─────────────────────────────────────┐ │
│  │ Users / Bot │ ◄─────────────►│ tg-bot (NestJS)                     │ │
│  └─────────────┘                │ - Webhook handler                    │ │
│         │                        │ - Deal topics, channel posts         │ │
│         │ Mini App               └─────────────────────────────────────┘ │
│         ▼                        ┌─────────────────────────────────────┐ │
│  ┌─────────────┐    HTTPS        │ API (NestJS)                         │ │
│  │ Mini App    │ ◄──────────────►│ - REST /api/v1                      │ │
│  │ (React)     │                 │ - Auth (TMA + JWT cookie)            │ │
│  └─────────────┘                 │ - Channels, campaigns, deals, TON   │ │
│                                  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐
│ worker (NestJS) │  │ job-worker      │  │ PostgreSQL │ Redis │ TON     │
│ - Deal cron     │  │ (BullMQ)        │  │ Drizzle    │ cache │ payments│
│ - Post/complete │  │ - Deal topics   │  └─────────────────────────────┘
│ - Cancel overdue│  │ - etc.          │
└─────────────────┘  └─────────────────┘
```

---

## Backend processes

| Process     | Purpose |
|------------|---------|
| **api**    | HTTP API (Fastify). Auth via Telegram Mini App init data + JWT cookie. REST for channels, campaigns, deals, ad formats, TON (deposit/refund). Versioned as `api/v1`. |
| **tg-bot** | Telegram Bot (Grammy). Webhook mode. Handles channel posts, deal topics (negotiation in Telegram), and bot-specific flows. |
| **worker** | Cron-style jobs: cancel overdue deals, post scheduled deals to channels, complete posted deals (delete message, mark completed). Uses same bot instance to send/delete messages. |
| **job-worker** | BullMQ consumer. Runs jobs such as creating deal topics in Telegram (triggered by API when a deal is confirmed). |

Processes are in `src/apps/` folder.

All four use the same config (`config/config.yml` + env) and connect to the same DB and Redis.

---

## API structure
Main domain areas:

- **Auth**: `POST /auth/tma` – exchange Telegram init data for JWT.
- **Channels**: CRUD, applications, managers, ad formats.
- **Campaigns**: CRUD for advertiser campaigns.
- **Deals**: Create, update params, confirm (draft/creative/params), cancel; TON deposit address and status.
- **TON**: Deposit/refund and wallet state for deals.

---

## Data and storage

- **PostgreSQL**: Primary store. Drizzle ORM; schema in `src/db/`, migrations in `drizzle/`. Key entities: users, channels, campaigns, deals, deal_events, ad_formats, escrow/payment-related tables.
- **Redis**: Cache (e.g. users), distributed locks (deal update, TON deposit), and BullMQ (job queues). Keys/TTLs in `config.cache_redis.keys`.
- **TON**: Payments (e.g. USDT). Config: `config.ton` (endpoint, api key, mnemonic, tonapi, usdt master, min amounts). TonAPI used for webhooks/balance where configured.

---

## Key flows

1. **Deal creation**: Advertiser or channel creates deal via API → initial status `draft` or `draft_application` → confirmations move it to `negotiation` then `scheduled`. See [Deal statuses](deal-statuses.md).
2. **Deal topic**: When a deal needs a Telegram chat for negotiation, API enqueues a job; job-worker creates a Telegram topic and links it to the deal; tg-bot handles messages in that topic.
3. **Scheduled → Posted → Completed**: Worker cron finds `scheduled` deals whose time has come, sends the ad to the channel via the bot, sets status to `posted`. Another cron finds `posted` deals that have been up for the required time, deletes the message and sets status to `completed`.
4. **Payments**: TON deposit/refund flows go through the API and blockchain module; worker can cancel deals on payment timeouts and trigger refunds.

---

## Configuration

- **Config load**: `config/config.ts` loads `config/config.yml` from `config/` (or `config/<CONFIG_PROFILE>/`). Values are overridden by environment variables: key path to env name is UPPERCASE with underscores (e.g. `db.url` → `DB_URL`).
- **Dotenv**: `dotenv/config` loads `.env` from project root; config loader also reads from the config folder. Docker Compose uses `env_file: .env.docker` for backend services.
- **Ports** (defaults in config): API 6001, worker 6002, tg-bot 6003, job-worker 6004, metrics 59126.

---

## Frontend

FULL VIBE CODING :) 

- **Stack**: React 19, Vite, React Router, Tailwind, Zustand, Axios, TonConnect UI, Telegram Mini App SDK.
- **Entry**: Opened as Telegram Mini App; auth by sending Telegram init data to `POST /auth/tma`; subsequent requests send JWT via cookie (same domain as API) or backend-configured cookie domain.
- **API base URL**: `VITE_API_URL` (e.g. ngrok backend in dev).
- **TonConnect**: Manifest at `public/tonconnect-manifest.json`; `manifestUrl` in app must be the same origin (or public URL) as the Mini App so Telegram and wallets can load it.

See [README](../README.md) for setup, ngrok, and env vars.
