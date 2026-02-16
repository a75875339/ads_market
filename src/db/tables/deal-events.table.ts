import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import type {DealActorType, DealEventType} from '../constants.js'
import {deals} from './deals.table.js'
import {users} from './users.table.js'

export const dealEvents = pgTable(
  'deal_events',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    dealId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => deals.id),
    eventType: text().$type<DealEventType>().notNull(),
    // Actor who triggered the event (null for system events)
    actorId: bigint({mode: 'bigint'}).references(() => users.id),
    // Actor type: user, system, cron
    actorType: text().$type<DealActorType>().notNull(),

    metadata: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [index('deal_events_deal_idx').on(table.dealId, table.eventType)],
)
