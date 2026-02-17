# Business logic

As required by the contest, the following processes were to be implemented (listed by level of thought-through design and implementation detail):

## 1. Deal flow (ad purchase) — from start to completion of placement

This logic is implemented and additionally includes channel search and selection. The deal flow also supports cancellation by the user and automatic cancellation when conditions are not met. Payment is done via TonConnect; in case of cancellation, funds are returned to the user. On deal completion, payment is transferred to the channel administrator’s specified wallet.

Because agreeing on an ad placement involves many details (time, format, creative, payment), at the **negotiation** stage both the advertiser and the channel must confirm each block of details. In line with how this works in practice—discussion first, then payment, and often the creative is finalized last—these blocks are implemented so that they do not block each other and can be discussed and confirmed in parallel.

Payment uses an **HD wallet**, which allows a dedicated wallet per deal while storing only one seed phrase.

## 2. Chat for discussing details

Implemented via **new topics** in the bot.

## 3. Administrator verification and auto-posting / requirement compliance

Implemented via the bot API. All channel administrators are added, and the channel owner can manage in the channel admin who gets which access levels.

## 4. Ad formats and access levels

Different ad formats and different access levels are implemented.

## 5. Statistics collection

Given the scope of the task and limited resources, this item was decided not to implement, as it was not mandatory under the contest rules (comments indicated that the main focus was the deal flow). In addition: my interest in the contest was partly due to having tried to launch a marketplace 3–4 years ago (at the time, lack of business experience and budget was the limiting factor). From that MVP it became clear that channel administrators are very reluctant to add even bots as admins, let alone people—and for metrics you need access to post to channels. So using Telethon for administrator-level access seems more like an academic exercise and hard to use in practice. If you set aside some metrics (e.g. gender and premium accounts), the needed metrics can be obtained in a simpler way without requiring administrators to add accounts to the admin list. This approach is used by existing ad exchanges today. And i wrote Telethon scriper for that goals.

---

## Possible improvements

### Business logic

- The deal flow is split between the TMA (Telegram Mini App) and chat. The gap between them should be minimized, as switching between the TMA and the chat is not very convenient. Direct links (deeplinks) from the bot to the relevant frontend pages are used, but there is still room for optimization.

- Simplify the flow so channels can join the marketplace without having to add even bots as administrators. This approach is also realistic and carries minimal risk for advertisers, since funds are transferred only after the ad has actually been placed.

### Technical improvements

- Introduce queues in many more places.
- Add more retries for failure scenarios.
- Metrics are already collected in general, but integrate with Grafana for visualization.
- Admin panel.
- Transaction fees / commission on deals.
- Many other small improvements.