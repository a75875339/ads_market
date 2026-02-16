import {Inject, Injectable} from '@nestjs/common'
import {and, desc, eq, gte, lte, or, sql} from 'drizzle-orm'
import {CampaignStatus} from '../constants.js'
import {DB_TOKEN, type DBType, type DbOrTransaction} from '../db.tokens.js'
import {campaign} from '../tables/campaign.table.js'
import type {AdFormatRow} from './ad-format.repository.js'

export type CampaignRow = typeof campaign.$inferSelect
export type CampaignInsert = typeof campaign.$inferInsert

export type CampaignSearchParams = {
  categoryId?: bigint
  subscribers: number
  avgViews: number
  adFormats: AdFormatRow[]
}

@Injectable()
export class CampaignRepository {
  constructor(@Inject(DB_TOKEN) readonly db: DBType) {}

  async findById(id: bigint, advertiserId?: bigint) {
    const conditions: Record<string, unknown> = {id}
    if (advertiserId !== undefined) {
      conditions.advertiserId = advertiserId
    }
    return this.db.query.campaign.findFirst({
      where: conditions,
    })
  }

  async listByAdvertiser(advertiserId: bigint, status?: CampaignStatus) {
    const conditions = [eq(campaign.advertiserId, advertiserId)]
    if (status) {
      conditions.push(eq(campaign.status, status))
    }
    return this.db
      .select()
      .from(campaign)
      .where(and(...conditions))
      .orderBy(desc(campaign.id))
  }

  async create(value: CampaignInsert): Promise<CampaignRow | null> {
    const data = await this.db.insert(campaign).values(value).returning()
    return data[0] ?? null
  }

  async update(
    id: bigint,
    advertiserId: bigint,
    updates: Partial<Omit<CampaignInsert, 'id' | 'advertiserId'>>,
  ): Promise<CampaignRow | null> {
    const data = await this.db
      .update(campaign)
      .set({...updates})
      .where(and(eq(campaign.id, id), eq(campaign.advertiserId, advertiserId)))
      .returning()
    return data[0] ?? null
  }

  async updateStatus(
    id: bigint,
    status: CampaignStatus,
    db: DbOrTransaction = this.db,
  ): Promise<CampaignRow | null> {
    const data = await db
      .update(campaign)
      .set({status})
      .where(eq(campaign.id, id))
      .returning()
    return data[0] ?? null
  }

  async searchForChannel(params: CampaignSearchParams, limit = 20, offset = 0) {
    const conditions = [
      eq(campaign.status, CampaignStatus.ACTIVE),
      eq(campaign.acceptApplications, true),
    ]

    // Match category
    if (params.categoryId) {
      conditions.push(
        or(
          sql`${campaign.ApplicationCategoryId} IS NULL`,
          eq(campaign.ApplicationCategoryId, params.categoryId),
        )!,
      )
    }

    // Match subscribers
    if (params.subscribers) {
      conditions.push(
        or(
          sql`${campaign.ApplicationMinSubscribers} IS NULL`,
          lte(campaign.ApplicationMinSubscribers, params.subscribers),
        )!,
      )
      conditions.push(
        or(
          sql`${campaign.ApplicationMaxSubscribers} IS NULL`,
          gte(campaign.ApplicationMaxSubscribers, params.subscribers),
        )!,
      )
    }

    // Match avg views
    if (params.avgViews) {
      conditions.push(
        or(
          sql`${campaign.ApplicationMinAvgViews} IS NULL`,
          lte(campaign.ApplicationMinAvgViews, params.avgViews),
        )!,
      )
      conditions.push(
        or(
          sql`${campaign.ApplicationMaxAvgViews} IS NULL`,
          gte(campaign.ApplicationMaxAvgViews, params.avgViews),
        )!,
      )
    }

    // Match per each ad format: at least one must match campaign requirements
    if (params.adFormats.length > 0) {
      const adFormatConditions = params.adFormats.map((format) => {
        const formatConds = []

        // Format type match
        formatConds.push(
          or(
            sql`${campaign.ApplicationFormatType} IS NULL`,
            eq(campaign.ApplicationFormatType, format.formatType),
          )!,
        )

        // Price range match
        formatConds.push(
          or(
            sql`${campaign.ApplicationMinPriceUSD} IS NULL`,
            sql`${campaign.ApplicationMinPriceUSD} <= ${format.priceUSD}`,
          )!,
        )
        formatConds.push(
          or(
            sql`${campaign.ApplicationMaxPriceUSD} IS NULL`,
            sql`${campaign.ApplicationMaxPriceUSD} >= ${format.priceUSD}`,
          )!,
        )

        // ER percent match
        if (format.erPercent) {
          formatConds.push(
            or(
              sql`${campaign.ApplicationMinErPercent} IS NULL`,
              sql`${campaign.ApplicationMinErPercent} <= ${format.erPercent}`,
            )!,
          )
          formatConds.push(
            or(
              sql`${campaign.ApplicationMaxErPercent} IS NULL`,
              sql`${campaign.ApplicationMaxErPercent} >= ${format.erPercent}`,
            )!,
          )
        }

        return and(...formatConds)
      })

      conditions.push(or(...adFormatConditions)!)
    }

    return this.db
      .select()
      .from(campaign)
      .where(and(...conditions))
      .orderBy(desc(campaign.id))
      .limit(limit)
      .offset(offset)
  }
}
