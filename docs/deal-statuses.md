# Deal statuses

Deals move through a fixed set of statuses. Transitions are driven by user actions (API + Telegram) and background workers.

## Status list

| Status              | Description |
|---------------------|-------------|
| **draft**           | Deal created by the **advertiser**; not yet confirmed by the channel side. |
| **draft_application** | Deal created by the **channel** (application); not yet confirmed by the advertiser. |
| **negotiation**     | Both sides have confirmed the draft; parameters (creative, schedule, price) can be negotiated. May have a linked Telegram topic. |
| **scheduled**       | Deal is agreed and scheduled; ad will be posted at `adScheduleAt`. Worker will post when time comes. |
| **posted**          | Ad has been posted to the channel. Worker will complete the deal after the configured retention period. |
| **completed**       | Deal finished: ad was shown and then removed (or retention elapsed). Terminal state. |
| **cancelled**       | Deal was cancelled by user or system (timeout, payment failure, etc.). Terminal state. |

Commented-out statuses in code (e.g. `owner_approved`, `escrow_funded`, `creative_approved`) are reserved for future use and are not part of the current flow.

---

## Status transitions (overview)

```
  [Advertiser creates]                [Channel creates]
         │                                    │
         ▼                                    ▼
      draft                          draft_application
         │                                    │
         │  channel confirms                  │  advertiser confirms
         │  (DRAFT_CONFIRMED)                 │  (DRAFT_CONFIRMED)
         └──────────────┬────────────────────┘
                        ▼
                 negotiation
                        │
                        │  creative + params confirmed + deposit + adScheduleAt
                        │  (CREATIVE_CONFIRMED, AD_PARAMETERS_CONFIRMED, DEPOSIT_RECEIVED, etc.)
                        ▼
                 scheduled
                        │
                        │  worker: time reached → send message to channel
                        ▼
                 posted
                        │
                        │  worker: retention elapsed → delete message
                        ▼
                 completed
```

Cancellation is possible from **draft**, **draft_application**, and **negotiation** (and in some system cases), but **not** from  **posted**, or **completed**.

---

## Who can do what

- **draft** → **negotiation**: Channel side confirms (DRAFT_CONFIRMED by channel).
- **draft_application** → **negotiation**: Advertiser confirms (DRAFT_CONFIRMED by advertiser).
- **negotiation** → **scheduled**: When both sides have confirmed creative, ad parameters, and deposit, and `adScheduleAt` is set; transition is done in the deal confirmation logic in the API.
- **scheduled** → **posted**: **Worker** (`deal-worker.service`): cron finds deals where `scheduledAt` (or schedule time) has passed and posts the ad to the channel via the bot.
- **posted** → **completed**: **Worker**: cron finds posted deals whose retention time has passed, deletes the channel message, and sets status to **completed**.
- **Any of draft / draft_application / negotiation** → **cancelled**: User (advertiser or channel) via API, or **system** (worker: payment timeout, schedule passed in negotiation, post failure, etc.).

---

## Events and confirmations

Deal events (`DealEventType`) record who did what:

- **DRAFT_CONFIRMED** – One side confirmed the draft (moves to negotiation when both have confirmed).
- **CREATIVE_CONFIRMED** – Creative content agreed.
- **AD_PARAMETERS_CONFIRMED** – Price/schedule/format agreed.
- **DEPOSIT_RECEIVED** – Payment recorded.
- **STATUS_CHANGED** – Used when worker sets status (e.g. to **completed**).
- **POSTED** – Worker posted the ad.
- **CANCELLED** – Deal cancelled (actor: user or system).

The transition from **negotiation** to **scheduled** requires the right set of these events (e.g. creative, ad params, deposit) and `adScheduleAt` to be set; the exact condition is in `deal.service.ts` (confirm flow).

---

## Worker rules (summary)

- **Cancel overdue**: Deals in **negotiation** with payment but ad schedule already passed → cancel. Deals paid but ad parameters not confirmed within the configured time → cancel.
- **Post scheduled**: Deals in **scheduled** whose schedule time has come → send ad to channel, set **posted**, store `postedMessageId`.
- **Complete posted**: Deals in **posted** whose retention time has passed → delete message, set **completed**.

Intervals (e.g. cancel_interval, post_interval, complete_interval) are in `config.deal_worker`.

---

## Database

- **Table**: `deals` (see `src/db/tables/deals.table.ts`).
- **Status field**: `status` (text), default `draft`.
- **Timestamps**: `scheduledAt`, `postedAt`, `completedAt`, `cancelledAt`; `postedMessageId` for the Telegram message.

Constants and types: `src/db/constants.ts` (`DealStatus`, `DealEventType`, `DealActorType`). Frontend types: `frontend/src/shared/types/index.ts` (`DealStatus`).
