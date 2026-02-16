import {
  bigint,
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import type {AmountUSD, Percent} from '../../libs/common/types/domain.types.js'
import type {AdFormatType} from '../constants.js'
import {timestamps} from '../utils.js'
import {channels} from './channels.table.js'

export const adFormats = pgTable(
  'ad_formats',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    channelId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => channels.id),
    formatType: text().$type<AdFormatType>().notNull(),
    // name: text().notNull(),
    description: text(),
    priceUSD: numeric({precision: 18, scale: 2}).$type<AmountUSD>().notNull(),
    // Retention period in hours (how long post stays before deletion), never deletes equal 4 days
    retentionHours: integer().notNull(),
    // Time "on top" in hours (before next post)
    topHours: integer().notNull(),
    CPM: numeric({precision: 18, scale: 2}).$type<AmountUSD>(),
    erPercent: numeric({precision: 5, scale: 2}).$type<Percent>(),
    isActive: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('ad_formats_channel_format_unique').on(
      table.channelId,
      table.formatType,
    ),
    index('ad_formats_active_idx').on(table.isActive),
    index('ad_formats_price_idx').on(table.priceUSD),
  ],
)
