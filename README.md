# Ads Market

Telegram ads marketplace: advertisers create campaigns and deals with channel owners. Deals progress from draft through negotiation to scheduled posting and completion. Backend uses NestJS, Drizzle, Redis, and TON for payments; frontend is a React (Vite) Telegram Mini App.

## Prerequisites

- **Node.js** v24.12.0 (see `Dockerfile` / `package.json` for exact version)
- **pnpm** 10.26.2
- **PostgreSQL** 18 ( use Docker)
- **Redis** (use Docker)
- **ngrok** (for local dev with Telegram webhooks and Mini App)

---

## 1. Environment (.env)

Configuration is loaded from `config/config.yml` and overridden by environment variables. Variable names match the config path in UPPERCASE with underscores (e.g. `db.url` → `DB_URL`). 

### Backend (root or `config/`)

Create `.env` in the project root (or use `.env.docker` for Docker). See example.env and .example.env .

**Required / common variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5433/defaultdb` |
| `CONFIG_PROFILE` | Config subfolder (optional) | `./` (default) |
| `APP_NAME` | Process to run: `api`, `worker`, `tg-bot`, `job-worker` | Set per process (see below) |
| `BOT_TOKEN` | Telegram Bot API token | From [@BotFather](https://t.me/BotFather) |
| `BOT_WEBHOOK_URL` | Public URL for Telegram webhook (use ngrok in dev) | `https://your-backend.ngrok.app/telegram/webhook` |
| `BOT_WEBHOOK_SECRET` | Secret token for webhook verification | Any random string |
| `BOT_USERNAME` | Bot username (no @) | YourBot |
| `BOT_TMA` | Telegram Mini App name / id | From BotFather |
| `JWT_SECRET` | Secret for signing JWT | Strong random string |
| `JWT_COOKIE_DOMAIN` | Cookie domain (must match frontend/ngrok domain) | `.your-domain.ngrok.app` or `.localhost` |
| `CACHE_REDIS_HOST` | Redis host | `localhost` or `redis` (Docker) |
| `CACHE_REDIS_PORT` | Redis port | `6382` (local) or `6379` (Docker) |
| `TON_ENDPOINT` | TON JSON-RPC endpoint | e.g. TON Center or Chainstack URL |
| `TON_TONAPI_KEY` | TonAPI key (optional) | For webhooks / balance |
| `TON_MNEMONIC` | Wallet mnemonic (optional) | For escrow/payments |

Copy `config/config.yml` and adjust, or override only what you need via `.env`. Defaults in `config/config.yml` include local Postgres on port **5433** and Redis on **6382**.

### Frontend

Create `frontend/.env`:

```env
# Backend API base URL (use ngrok URL in dev if frontend is served via ngrok)
VITE_API_URL=https://your-backend.ngrok.app/api/v1
```

For local dev without ngrok you can use `VITE_API_URL=http://localhost:6001/api/v1` and run the frontend with `pnpm dev` (see below).

---

## 2. ngrok (local development with Telegram)

Telegram needs public HTTPS URLs for:

1. **Bot webhook** – backend receives updates at `BOT_WEBHOOK_URL`.
2. **Mini App** – frontend must be opened from Telegram; often served via ngrok so Telegram can load it.
3. **TonConnect manifest** – frontend URL and manifest must be reachable from Telegram.
4. **Backend Api**

### Steps

1. Install [ngrok](https://ngrok.com/download).
2. Start backend and frontend locally (see below).
3. Expose backend (e.g. port 6001):
   ```bash
   ngrok http 6001
   ```
4. Expose frontend (e.g. port 3000):
   ```bash
   ngrok http 3000
   ```
5. Set in backend `.env`:
   - `BOT_WEBHOOK_URL=https://<backend-ngrok-host>/telegram/webhook`
   - `JWT_COOKIE_DOMAIN=<backend-ngrok-host>` (e.g. `.xxxx.ngrok-free.app`)
6. Set in `frontend/.env`:
   - `VITE_API_URL=https://<backend-ngrok-host>/api/v1`
7. In **frontend** code, set TonConnect manifest URL and app URL to the **frontend** ngrok URL:
   - `frontend/public/tonconnect-manifest.json`: update `url` and `iconUrl` to `https://<frontend-ngrok-host>`.
   - Where `TonConnectUIProvider` gets `manifestUrl`, use `https://<frontend-ngrok-host>/tonconnect-manifest.json`.
8. In BotFather, set the Mini App URL to `https://<frontend-ngrok-host>`.

Use the same ngrok host for cookie domain and API URL when both are behind one ngrok (e.g. one tunnel to backend and proxy to frontend), or two tunnels (backend + frontend) with matching env and manifest URLs.

---

## 3. Docker

Postgres, Redis, API, worker, job-worker, and tg-bot run via Docker Compose.

1. Create `.env.docker` in the project root (see “Environment” above). Example:
   ```env
   BOT_TOKEN=...
   BOT_WEBHOOK_URL=https://your-backend.ngrok.app/telegram/webhook
   BOT_USERNAME=YourBot
   BOT_TMA=...
   DB_URL=postgresql://postgres:mysecretpassword@postgres:5432/defaultdb
   JWT_COOKIE_DOMAIN=your-backend.ngrok.app
   TON_ENDPOINT=...
   TON_TONAPI_KEY=...
   CACHE_REDIS_HOST=redis
   CACHE_REDIS_PORT=6379
   ```
2. From project root:
   ```bash
   docker compose up -d
   ```
3. API: http://localhost:6001  
   Tg-bot process uses the same image and connects to Postgres/Redis; ensure `BOT_WEBHOOK_URL` is set so Telegram can reach your server (e.g. via ngrok).

To run only infrastructure (Postgres + Redis):

```bash
docker compose up -d postgres redis
```

Then run backend and frontend locally (see below).

---

## 4. Backend (local)

1. **Install and config**
   ```bash
   pnpm install
   # Create .env with DB_URL, Redis, bot, JWT, TON, etc.
   ```

2. **Database**
   ```bash
   # Push schema (dev)
   pnpm db:dev:push

   # Or generate and run migrations
   pnpm db:migrate
   ```

3. **Run one process at a time** (each in its own terminal):
   ```bash
   # API (HTTP + auth)
   pnpm start:dev:api

   # Telegram bot (webhook)
   pnpm start:dev:tg-bot

   # Deal worker
   pnpm start:dev:worker

   # Job worker 
   pnpm start:dev:job-worker
   ```

4. **Optional: seed test data**
   ```bash
   pnpm db:seed
   ```

---

## 5. Frontend (local)

1. **Install**
   ```bash
   cd frontend && pnpm install
   ```

2. **Env**
   - Create `frontend/.env` with `VITE_API_URL` pointing to your backend (e.g. ngrok).

3. **Run**
   ```bash
   pnpm dev
   ```
   Dev server runs on **http://localhost:3000** with `--host` so it’s reachable on the network (and via ngrok).

4. **Build**
   ```bash
   pnpm build
   pnpm preview
   ```

The app is a Telegram Mini App: open it from Telegram (via bot menu or link) after configuring the bot and Mini App URL. For TonConnect, ensure `tonconnect-manifest.json` and `TonConnectUIProvider` use the same public URL (e.g. frontend ngrok) that Telegram loads.

---

## 6. Quick reference

| What | Command / URL |
|------|----------------|
| API | `pnpm start:dev:api` → http://localhost:6001 |
| Tg bot | `pnpm start:dev:tg-bot` |  → http://localhost:6003 |
| Worker | `pnpm start:dev:worker` |
| Job worker | `pnpm start:dev:job-worker` |
| Frontend | `cd frontend && pnpm dev` → http://localhost:3000 |
| Docker stack | `docker compose up -d` |
| DB push (dev) | `pnpm db:dev:push` |
| Migrations | `pnpm db:generate` then `pnpm db:migrate` |

---

## Docs

- [Architecture](docs/architecture.md) – apps, services, and data flow
- [Deal statuses](docs/deal-statuses.md) – deal lifecycle and status transitions
