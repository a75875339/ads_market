import {bigint, index, pgTable, text} from 'drizzle-orm/pg-core'
import {timestamps} from '../utils.js'
import {deals} from './deals.table.js'
import {users} from './users.table.js'

export const dealMessages = pgTable(
  'deal_messages',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    dealId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => deals.id),
    senderId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => users.id),
    messageText: text().notNull(),
    // If message was sent via Telegram bot, store the message ID
    telegramMessageId: bigint({mode: 'bigint'}),
    // Message type for filtering: text, system, creative_request, etc.
    messageType: text().notNull().default('text'),
    ...timestamps,
  },
  (table) => [
    index('deal_messages_deal_idx').on(table.dealId),
    index('deal_messages_sender_idx').on(table.senderId),
    index('deal_messages_created_idx').on(table.createdAt),
  ],
)
