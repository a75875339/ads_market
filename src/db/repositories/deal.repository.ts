import {Inject, Injectable} from '@nestjs/common'
import {and, asc, desc, eq, inArray, isNotNull, sql} from 'drizzle-orm'
import type {WalletAddress} from '../../libs/common/types/domain.types.js'
import {DealEventType, DealStatus} from '../constants.js'
import {DB_TOKEN, type DBType, type DbOrTransaction} from '../db.tokens.js'
import {campaign, channelManagers} from '../schema.js'
import {adFormats} from '../tables/ad-formats.table.js'
import {channels} from '../tables/channels.table.js'
import {dealEvents} from '../tables/deal-events.table.js'
import {deals} from '../tables/deals.table.js'

export type DealWithChannel = {
  deals: DealRow
  channels: typeof channels.$inferSelect
}

export type DealRow = typeof deals.$inferSelect
export type DealInsert = typeof deals.$inferInsert

@Injectable()
export class DealRepository {
  constructor(@Inject(DB_TOKEN) readonly db: DBType) {}

  async findById(id: bigint): Promise<DealRow | null> {
    const data = await this.db.query.deals.findFirst({
      where: {id},
    })
    return data ?? null
  }

  async findByIdWithRelations(
    id: bigint,
    relations?: {
      channel?: boolean
      campaign?: boolean
      adFormat?: boolean
      events?: boolean
    },
  ) {
    return this.db.query.deals.findFirst({
      where: {id},
      with: {
        ...(relations?.channel ? {channel: true} : {}),
        ...(relations?.adFormat ? {adFormat: true} : {}),
        ...(relations?.campaign ? {campaign: true} : {}),
        ...(relations?.events ? {events: true} : {}),
      },
    })
  }

  async findByIdWithPaidEvents(id: bigint) {
    const data = await this.db
      .select()
      .from(deals)
      .leftJoin(
        dealEvents,
        and(
          eq(dealEvents.dealId, deals.id),
          eq(dealEvents.eventType, DealEventType.DEPOSIT_RECEIVED),
        ),
      )
      .leftJoin(adFormats, eq(adFormats.id, deals.adFormatId))
      .where(eq(deals.id, id))
    return data[0] ?? null
  }

  async findForGuard(id: bigint, userId: bigint) {
    const data = await this.db
      .select()
      .from(deals)
      .leftJoin(channels, eq(channels.id, deals.channelId))
      .leftJoin(
        channelManagers,
        and(
          eq(channelManagers.channelId, deals.channelId),
          eq(channelManagers.userId, userId),
        ),
      )
      .leftJoin(campaign, eq(campaign.id, deals.campaignId))
      .where(eq(deals.id, id))
    return data[0] ?? null
  }

  async listByCampaign(
    campaignId: bigint,
    status?: DealStatus,
  ): Promise<DealRow[]> {
    const conditions = [eq(deals.campaignId, campaignId)]
    if (status) {
      conditions.push(eq(deals.status, status))
    }
    return this.db
      .select()
      .from(deals)
      .where(and(...conditions))
      .orderBy(desc(deals.id))
  }

  async listByChannel(
    channelId: bigint,
    status?: DealStatus,
  ): Promise<DealRow[]> {
    const conditions = [eq(deals.channelId, channelId)]
    if (status) {
      conditions.push(eq(deals.status, status))
    }
    return this.db
      .select()
      .from(deals)
      .where(and(...conditions))
      .orderBy(desc(deals.id))
  }

  async create(
    value: DealInsert,
    db: DbOrTransaction = this.db,
  ): Promise<DealRow | null> {
    const data = await db.insert(deals).values(value).returning()
    return data[0] ?? null
  }

  async update(
    id: bigint,
    updates: Partial<Omit<DealInsert, 'id' | 'creatorId' | 'createdAt'>>,
    db: DbOrTransaction = this.db,
  ): Promise<DealRow | null> {
    const data = await db
      .update(deals)
      .set({...updates})
      .where(eq(deals.id, id))
      .returning()
    return data[0] ?? null
  }

  async updateStatus(
    ids: bigint[],
    status: DealStatus,
    db: DbOrTransaction = this.db,
  ): Promise<DealRow[]> {
    const data = await db
      .update(deals)
      .set({status})
      .where(inArray(deals.id, ids))
      .returning()
    return data
  }

  /** Find deals in given statuses for a campaign that are not finished */
  async findUnfinishedByCampaign(campaignId: bigint) {
    return this.db
      .select()
      .from(deals)
      .leftJoin(
        dealEvents,
        and(
          eq(dealEvents.dealId, deals.id),
          eq(dealEvents.eventType, DealEventType.DEPOSIT_RECEIVED),
        ),
      )
      .where(
        and(
          eq(deals.campaignId, campaignId),
          sql`${deals.status} NOT IN (${DealStatus.COMPLETED}, ${DealStatus.CANCELLED})`,
        ),
      )
  }

  async findScheduledReadyToPost() {
    return this.db
      .select()
      .from(deals)
      .leftJoin(channels, eq(channels.id, deals.channelId))
      .where(
        and(
          eq(deals.status, DealStatus.SCHEDULED),
          sql`${deals.adScheduleAt} <= NOW()`,
        ),
      )
      .orderBy(asc(deals.id))
  }

  async findPostedReadyToComplete() {
    return this.db
      .select()
      .from(deals)
      .leftJoin(adFormats, eq(adFormats.id, deals.adFormatId))
      .leftJoin(channels, eq(channels.id, deals.channelId))
      .where(
        and(
          eq(deals.status, DealStatus.POSTED),
          isNotNull(deals.postedAt),
          sql`${deals.postedAt} + ${adFormats.retentionHours} * INTERVAL '1 hour' <= NOW()`,
        ),
      )
      .orderBy(asc(deals.id))
  }

  /**
   * Find paid deals in NEGOTIATION with AD_PARAMETERS_CONFIRMED
   * where adScheduleAt < now() — these should be cancelled.
   */
  async findOverduePaidNegotiationDeals() {
    return this.db
      .select({id: deals.id})
      .from(deals)
      .innerJoin(
        dealEvents,
        and(
          eq(dealEvents.dealId, deals.id),
          eq(dealEvents.eventType, DealEventType.DEPOSIT_RECEIVED),
        ),
      )
      .where(
        and(
          eq(deals.status, DealStatus.NEGOTIATION),
          sql`${deals.adScheduleAt} < NOW()`,
          sql`(
            SELECT COUNT(distinct de2.actor_type) FROM deal_events de2
            WHERE de2.deal_id = ${deals.id}
            AND de2.event_type = '${sql.raw(DealEventType.AD_PARAMETERS_CONFIRMED)}'
          ) = 2`,
        ),
      )
  }

  /**
   * Find paid deals without AD_PARAMETERS_CONFIRMED where paidAt + 1 day < now().
   */
  async findPaidWithoutParamsOverdue() {
    return this.db
      .select({id: deals.id})
      .from(deals)
      .innerJoin(
        dealEvents,
        and(
          eq(dealEvents.dealId, deals.id),
          eq(dealEvents.eventType, DealEventType.DEPOSIT_RECEIVED),
        ),
      )
      .where(
        and(
          sql`${deals.status} = ${DealStatus.NEGOTIATION}`,
          sql`${dealEvents.createdAt} < NOW() - INTERVAL '1 day'`,
          sql`(
            SELECT COUNT(distinct de2.actor_type) FROM deal_events de2
            WHERE de2.deal_id = ${deals.id}
            AND de2.event_type = '${sql.raw(DealEventType.AD_PARAMETERS_CONFIRMED)}'
          ) < 2`,
        ),
      )
  }

  async findPostedByChannelChatIdAndMessageId(
    telegramChatId: bigint,
    messageId: bigint,
  ): Promise<DealWithChannel | null> {
    const data = await this.db
      .select()
      .from(deals)
      .innerJoin(channels, eq(channels.id, deals.channelId))
      .where(
        and(
          eq(channels.telegramChatId, telegramChatId),
          eq(deals.postedMessageId, messageId),
          eq(deals.status, DealStatus.POSTED),
        ),
      )
    return data[0] ?? null
  }

  async findWithWalletInStatuses(statuses: DealStatus[]): Promise<DealRow[]> {
    return this.db
      .select()
      .from(deals)
      .where(
        and(
          inArray(deals.status, statuses),
          isNotNull(deals.dealWallet),
          sql`NOT EXISTS (
            SELECT 1 FROM deal_events de
            WHERE de.deal_id = ${deals.id}
            AND de.event_type = ${DealEventType.DEPOSIT_RECEIVED}
          )`,
        ),
      )
  }

  async findByWalletAddress(walletAddress: string): Promise<DealRow | null> {
    const data = await this.db
      .select()
      .from(deals)
      .where(eq(deals.dealWallet, walletAddress as WalletAddress))
    return data[0] ?? null
  }

  async findPostedInTopTimeByChannelChatId(
    telegramChatId: bigint,
  ): Promise<DealWithChannel[]> {
    return this.db
      .select({deals, channels})
      .from(deals)
      .innerJoin(channels, eq(channels.id, deals.channelId))
      .innerJoin(adFormats, eq(adFormats.id, deals.adFormatId))
      .where(
        and(
          eq(channels.telegramChatId, telegramChatId),
          eq(deals.status, DealStatus.POSTED),
          isNotNull(deals.postedAt),
          sql`${deals.postedAt} + INTERVAL '1 hour' * ${adFormats.topHours} > NOW()`,
        ),
      )
  }
}
