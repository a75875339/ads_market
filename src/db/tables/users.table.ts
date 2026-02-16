import {bigint, boolean, index, pgTable, text} from 'drizzle-orm/pg-core'
import {timestamps} from '../utils.js'

export const users = pgTable(
  'users',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    telegramId: bigint({mode: 'bigint'}).unique(), // in case not only telegram users
    firstName: text(),
    lastName: text(),
    username: text(),
    avatarUrl: text(),
    // primaryRole: text().default(UserRole.ADVERTISER),  // todo: is it necessary?
    isBlocked: boolean().notNull().default(false),
    blockedReason: text(),
    // Language preference
    language: text().default('en'),
    ...timestamps,
  },
  (table) => [
    index('users_telegram_id_idx').on(table.telegramId),
    index('users_username_idx').on(table.username),
  ],
)
