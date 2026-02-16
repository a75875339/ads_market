import {Inject, Injectable} from '@nestjs/common'
import {and, count, eq} from 'drizzle-orm'
import {DB_TOKEN, type DBType} from '../db.tokens.js'
import {adFormats} from '../tables/ad-formats.table.js'

export type AdFormatRow = typeof adFormats.$inferSelect
export type AdFormatInsert = typeof adFormats.$inferInsert

@Injectable()
export class AdFormatRepository {
  constructor(@Inject(DB_TOKEN) private readonly db: DBType) {}

  async listByChannelId(channelId: bigint): Promise<AdFormatRow[]> {
    const data = await this.db
      .select()
      .from(adFormats)
      .where(eq(adFormats.channelId, channelId))
    return data
  }

  async findById(id: bigint): Promise<AdFormatRow | null> {
    const data = await this.db
      .select()
      .from(adFormats)
      .where(eq(adFormats.id, id))
      .limit(1)
    return data?.[0] ?? null
  }

  async create(value: AdFormatInsert): Promise<AdFormatRow | null> {
    const data = await this.db
      .insert(adFormats)
      .values(value)
      .onConflictDoNothing()
      .returning()
    return data[0] ?? null
  }

  async update(
    id: bigint,
    channelId: bigint,
    updates: Partial<Omit<AdFormatInsert, 'id' | 'channelId'>>,
  ): Promise<AdFormatRow | null> {
    const data = await this.db
      .update(adFormats)
      .set({...updates})
      .where(and(eq(adFormats.id, id), eq(adFormats.channelId, channelId)))
      .returning()
    return data?.[0] ?? null
  }

  async delete(id: bigint, channelId: bigint): Promise<boolean> {
    const data = await this.db
      .delete(adFormats)
      .where(and(eq(adFormats.id, id), eq(adFormats.channelId, channelId)))
      .returning({id: adFormats.id})
    return (data?.length ?? 0) > 0
  }

  async countActiveByChannelId(channelId: bigint): Promise<number> {
    const result = await this.db
      .select({count: count()})
      .from(adFormats)
      .where(
        and(eq(adFormats.channelId, channelId), eq(adFormats.isActive, true)),
      )
    return result[0]?.count ?? 0
  }
}
