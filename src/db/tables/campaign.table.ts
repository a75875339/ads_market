import {
  bigint,
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import type {AmountUSD, Percent} from '../../libs/common/types/domain.types.js'
import {AdFormatType, CampaignStatus} from '../constants.js'
import {timestamps} from '../utils.js'
import {categories} from './categories.table.js'
import {users} from './users.table.js'

export const campaign = pgTable(
  'campaigns',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    advertiserId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => users.id),
    title: text().notNull(),
    description: text(),
    status: text()
      .$type<CampaignStatus>()
      .notNull()
      .default(CampaignStatus.ACTIVE),

    acceptApplications: boolean().notNull().default(false),

    ApplicationMinPriceUSD: numeric({
      precision: 18,
      scale: 2,
    }).$type<AmountUSD | null>(),
    ApplicationMaxPriceUSD: numeric({
      precision: 18,
      scale: 2,
    }).$type<AmountUSD | null>(),
    ApplicationMinCPMUSD: numeric({
      precision: 18,
      scale: 2,
    }).$type<AmountUSD | null>(),
    ApplicationMaxCPMUSD: numeric({
      precision: 18,
      scale: 2,
    }).$type<AmountUSD | null>(),

    ApplicationFormatType: text().$type<AdFormatType>(),
    ApplicationCategoryId: bigint({mode: 'bigint'}).references(
      () => categories.id,
    ),
    ApplicationMinSubscribers: integer(),
    ApplicationMaxSubscribers: integer(),
    ApplicationMinAvgViews: integer(),
    ApplicationMaxAvgViews: integer(),
    ApplicationMinErPercent: numeric({
      precision: 5,
      scale: 2,
    }).$type<Percent | null>(),
    ApplicationMaxErPercent: numeric({
      precision: 5,
      scale: 2,
    }).$type<Percent | null>(),
    ApplicationPublicationDatetimeFrom: timestamp(),
    ApplicationPublicationDatetimeTo: timestamp(),

    notes: text(), // some private notes for the advertiser
    ...timestamps,
  },
  (table) => [
    index('campaign_requests_advertiser_idx').on(
      table.advertiserId,
      table.status,
      table.id,
    ),
    index('campaign_requests_status_idx').on(
      table.status,
      table.acceptApplications,
      table.ApplicationCategoryId,
    ),
  ],
)
