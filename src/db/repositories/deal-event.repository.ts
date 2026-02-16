import {Inject, Injectable} from '@nestjs/common'
import {and, eq, inArray} from 'drizzle-orm'
import {DealActorType, DealEventType} from '../constants.js'
import {DB_TOKEN, type DBType, type DbOrTransaction} from '../db.tokens.js'
import {dealEvents} from '../tables/deal-events.table.js'

export type DealEventRow = typeof dealEvents.$inferSelect
export type DealEventInsert = typeof dealEvents.$inferInsert

@Injectable()
export class DealEventRepository {
  constructor(@Inject(DB_TOKEN) readonly db: DBType) {}

  async findByDealAndType(
    dealId: bigint,
    eventType: DealEventType,
  ): Promise<DealEventRow[]> {
    return this.db
      .select()
      .from(dealEvents)
      .where(
        and(eq(dealEvents.dealId, dealId), eq(dealEvents.eventType, eventType)),
      )
  }

  async findByDealAndTypeAndActor(
    dealId: bigint,
    eventTypes: DealEventType[],
    actorType?: DealActorType,
    db: DbOrTransaction = this.db,
  ): Promise<DealEventRow[]> {
    const data = await db
      .select()
      .from(dealEvents)
      .where(
        and(
          eq(dealEvents.dealId, dealId),
          inArray(dealEvents.eventType, eventTypes),
          ...(actorType ? [eq(dealEvents.actorType, actorType)] : []),
        ),
      )
    return data
  }

  async create(
    value: DealEventInsert,
    db: DbOrTransaction = this.db,
  ): Promise<DealEventRow | null> {
    const data = await db.insert(dealEvents).values(value).returning()
    return data[0] ?? null
  }

  async createMany(
    values: DealEventInsert[],
    db: DbOrTransaction = this.db,
  ): Promise<DealEventRow[]> {
    if (values.length === 0) return []
    const data = await db.insert(dealEvents).values(values).returning()
    return data
  }

  // async hasPaidEvent(dealId: bigint): Promise<boolean> {
  //   const data = await this.db
  //     .select()
  //     .from(dealEvents)
  //     .where(
  //       and(
  //         eq(dealEvents.dealId, dealId),
  //         eq(dealEvents.eventType, 'deposit_received'),
  //       ),
  //     )
  //     .limit(1)
  //   return data.length > 0
  // }

  async deleteByDealAndTypeAndActor(
    dealId: bigint,
    eventType: DealEventType,
    actorType?: DealActorType,
  ): Promise<void> {
    await this.db
      .delete(dealEvents)
      .where(
        and(
          eq(dealEvents.dealId, dealId),
          eq(dealEvents.eventType, eventType),
          ...(actorType ? [eq(dealEvents.actorType, actorType)] : []),
        ),
      )
  }
}
