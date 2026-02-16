import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  unique,
} from 'drizzle-orm/pg-core'
import type {TopicRole} from '../constants.js'
import {timestamps} from '../utils.js'
import {deals} from './deals.table.js'
import {users} from './users.table.js'

export const dealTopics = pgTable(
  'deal_topics',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    dealId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => deals.id),
    userId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => users.id),
    /** Telegram forum topic ID */
    topicId: integer().notNull(),
    /** Role of the user in the deal context */
    role: text().$type<TopicRole>().notNull(),
    /** Telegram message ID of the start message sent in the topic */
    startMessageId: integer(),
    ...timestamps,
  },
  (table) => [
    unique('deal_topics_deal_user_unique').on(table.dealId, table.userId),
    index('deal_topics_user_idx').on(table.topicId, table.userId),
    index('deal_topics_deal_idx').on(table.userId),
  ],
)
