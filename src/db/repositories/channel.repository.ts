import {Inject, Injectable} from '@nestjs/common'
import {and, eq, isNotNull, isNull, not, sql} from 'drizzle-orm'
import {PinoLogger} from 'nestjs-pino'
import type {
  AmountUSD,
  Percent,
  WalletAddress,
} from '../../libs/common/types/domain.types.js'
import {tryCatch} from '../../simple-result.js'
import {AdFormatType, ChannelStatus, ManagerPermission} from '../constants.js'
import {DB_TOKEN, type DBType} from '../db.tokens.js'
import {channelManagers} from '../tables/channel-managers.table.js'
import {channels} from '../tables/channels.table.js'

// export type ChannelStatsRow = typeof channelStats.$inferSelect
export type ChannelRow = typeof channels.$inferSelect
export type ChannelInsert = typeof channels.$inferInsert

export type ChannelSearchFilters = {
  text?: string
  formatType?: AdFormatType
  price?: {min?: AmountUSD; max?: AmountUSD}
  CPM?: {min?: AmountUSD; max?: AmountUSD}
  categoryId?: bigint
  subscribers?: {min?: number; max?: number}
  avgViews?: {min?: number; max?: number}
  erPercent?: {min?: Percent; max?: Percent}
  limit?: number
  offset?: number
}

@Injectable()
export class ChannelRepository {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(DB_TOKEN) private readonly db: DBType,
  ) {
    this.logger.setContext(ChannelRepository.name)
  }

  async findById(id: bigint) {
    const row = await this.db.query.channels.findFirst({
      where: {id},
    })
    return row ?? null
  }

  async findByIdWithRelations(
    id: bigint,
    relations?: {
      adFormats?: boolean
      stats?: boolean
      category?: boolean
      managers?: boolean
    },
  ) {
    return this.db.query.channels.findFirst({
      where: {id},
      with: {
        ...(relations?.adFormats ? {adFormats: true} : {}),
        ...(relations?.stats ? {stats: true} : {}),
        ...(relations?.category ? {category: true} : {}),
        ...(relations?.managers ? {managers: true} : {}),
      },
    })
  }

  async findByIdsWithRelations(
    ids: bigint[],
    relations?: {
      adFormats?: boolean
      stats?: boolean
      category?: boolean
    },
  ) {
    if (ids.length === 0) return []

    const data = await this.db.query.channels.findMany({
      where: {id: {in: ids}},
      with: {
        ...(relations?.adFormats ? {adFormats: true} : {}),
        ...(relations?.stats ? {stats: true} : {}),
        ...(relations?.category ? {category: true} : {}),
      },
    })
    return data
  }

  async findByTelegramChatId(
    telegramChatId: bigint,
  ): Promise<ChannelRow | null> {
    const data = await this.db.query.channels.findFirst({
      where: {telegramChatId},
    })
    return data ?? null
  }

  /** Channels where user is owner or active manager */
  async findByUserId(userId: bigint) {
    const rows = await this.db
      .select()
      .from(channels)
      .innerJoin(
        channelManagers,
        and(
          eq(channelManagers.channelId, channels.id),
          eq(channelManagers.userId, userId),
          isNull(channelManagers.deletedAt),
          not(eq(channelManagers.permissions, ManagerPermission.NONE)),
        ),
      )
    return rows
  }

  async create(value: ChannelInsert): Promise<ChannelRow | null> {
    const data = await this.db.insert(channels).values(value).returning()
    return data[0] ?? null
  }

  async updateBotAdmin(
    id: bigint,
    botIsAdmin: boolean,
    botAdminVerifiedAt: Date | null,
    status?: ChannelStatus,
    isVisible?: boolean,
  ): Promise<ChannelRow | null> {
    const {data, error} = await tryCatch(
      this.db
        .update(channels)
        .set({
          botIsAdmin,
          botAdminVerifiedAt,
          updatedAt: new Date(),
          ...(status ? {status} : {}),
          ...(isVisible ? {isVisible} : {}),
        })
        .where(eq(channels.id, id))
        .returning(),
    )

    if (error) {
      this.logger.warn(
        {err: error, channelId: id.toString()},
        'Failed to update channel bot admin',
      )
      return null
    }

    return data[0] ?? null
  }

  async updateStatus(
    id: bigint,
    status: (typeof ChannelStatus)[keyof typeof ChannelStatus],
  ): Promise<ChannelRow | null> {
    const data = await this.db
      .update(channels)
      .set({status})
      .where(eq(channels.id, id))
      .returning()

    return data[0] ?? null
  }

  async updateOwner(id: bigint, ownerId: bigint): Promise<ChannelRow | null> {
    const data = await this.db
      .update(channels)
      .set({ownerId})
      .where(eq(channels.id, id))
      .returning()

    return data[0] ?? null
  }

  async updateWalletAddress(
    id: bigint,
    rewardWalletAddress: WalletAddress,
  ): Promise<ChannelRow | null> {
    const data = await this.db
      .update(channels)
      .set({rewardWalletAddress})
      .where(eq(channels.id, id))
      .returning()

    return data[0] ?? null
  }

  async updateCategory(
    id: bigint,
    categoryId: bigint | null,
  ): Promise<ChannelRow | null> {
    const data = await this.db
      .update(channels)
      .set({categoryId})
      .where(eq(channels.id, id))
      .returning()

    return data[0] ?? null
  }

  async updateVisibility(
    id: bigint,
    isVisible: boolean,
  ): Promise<ChannelRow | null> {
    const condition = isVisible
      ? eq(channels.id, id)
      : and(
          eq(channels.id, id),
          eq(channels.status, ChannelStatus.ACTIVE),
          isNotNull(channels.rewardWalletAddress),
          sql`(SELECT COUNT(*) FROM ad_formats WHERE channel_id = ${channels.id} AND is_active = true) > 0`,
        )

    const data = await this.db
      .update(channels)
      .set({isVisible})
      .where(condition)
      .returning()
    return data[0] ?? null
  }

  async search(filters: ChannelSearchFilters): Promise<bigint[]> {
    const whereConditions = [sql`c.is_visible = true`]

    // Text search
    if (filters.text) {
      const pattern = `%${filters.text}%`
      whereConditions.push(
        sql`(c.username ILIKE ${pattern} OR c.title ILIKE ${pattern})`,
      )
    }

    // Category filter
    if (filters.categoryId) {
      whereConditions.push(sql`c.category_id = ${Number(filters.categoryId)}`)
    }

    // Stats filters
    if (filters.subscribers?.min) {
      whereConditions.push(sql`cs.subscribers >= ${filters.subscribers.min}`)
    }
    if (filters.subscribers?.max) {
      whereConditions.push(sql`cs.subscribers <= ${filters.subscribers.max}`)
    }
    if (filters.avgViews?.min) {
      whereConditions.push(sql`cs.avg_views >= ${filters.avgViews.min}`)
    }
    if (filters.avgViews?.max) {
      whereConditions.push(sql`cs.avg_views <= ${filters.avgViews.max}`)
    }
    if (filters.erPercent?.min) {
      whereConditions.push(sql`af.er_percent >= ${filters.erPercent.min}`)
    }
    if (filters.erPercent?.max) {
      whereConditions.push(sql`af.er_percent <= ${filters.erPercent.max}`)
    }
    if (filters.formatType) {
      whereConditions.push(sql`af.format_type = ${filters.formatType}`)
    }
    if (filters.price?.min) {
      whereConditions.push(sql`af.price_usd >= ${filters.price.min}`)
    }
    if (filters.price?.max) {
      whereConditions.push(sql`af.price_usd <= ${filters.price.max}`)
    }
    if (filters.CPM?.min) {
      whereConditions.push(sql`af.cpm >= ${filters.CPM.min}`)
    }
    if (filters.CPM?.max) {
      whereConditions.push(sql`af.cpm <= ${filters.CPM.max}`)
    }

    const whereSql = sql.join(whereConditions, sql` \nAND `)
    const limit = filters.limit ?? 100
    const offset = filters.offset ?? 0

    const result = await this.db.execute<{id: bigint}>(sql`
      SELECT DISTINCT c.id
      FROM channels c
      LEFT JOIN channel_stats cs ON cs.channel_id = c.id
      INNER JOIN ad_formats af ON af.channel_id = c.id AND af.is_active = true
      WHERE ${whereSql}
      ORDER BY c.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    return result.rows.map((row) => row.id)
  }
}
