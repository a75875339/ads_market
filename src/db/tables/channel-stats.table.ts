import {
  bigint,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import type {Percent} from '../../libs/common/types/domain.types.js'
import {channels} from './channels.table.js'

export const channelStats = pgTable(
  'channel_stats',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    channelId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => channels.id)
      .unique(),
    subscribers: integer(),
    avgViews: integer(),
    avgReach: integer(),
    erPercent: numeric({precision: 5, scale: 2}).$type<Percent>(),
    premiumPercent: numeric({precision: 5, scale: 2}).$type<Percent>(),
    // Language distribution: {en: 45, ru: 30, other: 25}
    languageDistribution: jsonb().$type<Record<string, number>>(),
    // Gender distribution: {male: 60, female: 40}
    genderDistribution: jsonb().$type<Record<string, number>>(),
    // Additional verified metrics from Telegram
    verifiedMetrics: jsonb().$type<Record<string, unknown>>(),
    // Source of stats: telegram_api, external_service, self_reported
    source: text().notNull().default('external_service'),
    fetchedAt: timestamp().notNull().defaultNow(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index('channel_stats_channel_idx').on(table.channelId),
    index('channel_stats_subscribers_idx').on(table.subscribers),
    index('channel_stats_avg_views_idx').on(table.avgViews),
  ],
)
