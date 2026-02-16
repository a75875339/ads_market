import {
  bigint,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import type {WalletAddress} from '../../libs/common/types/domain.types.js'
import {ChannelStatus, ChannelType} from '../constants.js'
import {createEnumCheckConstraint, timestamps} from '../utils.js'
import {categories} from './categories.table.js'
import {users} from './users.table.js'

export const channels = pgTable(
  'channels',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    telegramChatId: bigint({mode: 'bigint'}).notNull().unique(),
    ownerId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => users.id),
    title: text().notNull(),
    username: text(), // @username, nullable for private channels
    description: text(),
    channelType: text().$type<ChannelType>().notNull(), // channel, private_channel, group, private_group
    categoryId: bigint({mode: 'bigint'}).references(() => categories.id),
    status: text().notNull().default('pending'), // pending, active, suspended, too_small, error
    botIsAdmin: boolean().notNull().default(false),
    botAdminVerifiedAt: timestamp(),
    avatarUrl: text(),
    language: text().default('en'),
    rewardWalletAddress: text().$type<WalletAddress>(), // todo add memo?
    isVisible: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index('channels_owner_idx').on(table.ownerId),
    index('channels_category_idx').on(table.categoryId),
    index('channels_status_idx').on(table.status),
    index('channels_visible_idx').on(table.isVisible),
    createEnumCheckConstraint(
      'channels_channel_type_check',
      table.channelType,
      ChannelType,
    ),
    createEnumCheckConstraint(
      'channels_status_check',
      table.status,
      ChannelStatus,
    ),
  ],
)
