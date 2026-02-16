import {
  bigint,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import type {AmountUSD, WalletAddress} from '../../libs/common/types/domain.types.js'
import {DealStatus} from '../constants.js'
import {timestamps} from '../utils.js'
import {adFormats} from './ad-formats.table.js'
import {campaign} from './campaign.table.js'
import {channels} from './channels.table.js'
import {users} from './users.table.js'

export const deals = pgTable(
  'deals',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    creatorId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => users.id),
    channelId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => channels.id),
    campaignId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => campaign.id),
    draftDealMessage: text(),
    status: text().$type<DealStatus>().notNull().default(DealStatus.DRAFT),

    // deal parameters
    adFormatId: bigint({mode: 'bigint'}).references(() => adFormats.id),
    adPriceUSD: numeric({precision: 18, scale: 2}).$type<AmountUSD>(),
    adScheduleAt: timestamp(),

    creativeData: jsonb().$type<{
      content: any
    }>(),

    dealWallet: text().$type<WalletAddress>(),

    scheduledAt: timestamp(),
    // Post tracking
    postedAt: timestamp(),
    postedMessageId: bigint({mode: 'bigint'}),
    // contentHash: text(),
    // Verification tracking
    // verificationCount: integer().notNull().default(0),
    // lastVerifiedAt: timestamp(),
    // Completion
    completedAt: timestamp(),
    // Cancellation
    cancelledAt: timestamp(),
    cancelledById: bigint({mode: 'bigint'}).references(() => users.id),
    cancelReason: text(),

    ...timestamps,
  },
  (table) => [
    index('deals_channel_idx').on(table.channelId, table.status),
    index('deals_campaign_idx').on(table.campaignId, table.status),
    unique('deals_deal_wallet_idx').on(table.dealWallet),
  ],
)
