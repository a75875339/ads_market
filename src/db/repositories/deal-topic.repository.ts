import {Inject, Injectable} from '@nestjs/common'
import {and, eq, sql} from 'drizzle-orm'
import {DB_TOKEN, type DBType, type DbOrTransaction} from '../db.tokens.js'
import {dealTopics} from '../tables/deal-topics.table.js'
import {users} from '../tables/users.table.js'

export type DealTopicRow = typeof dealTopics.$inferSelect
export type DealTopicInsert = typeof dealTopics.$inferInsert

export type ForwardingTarget = {
  topicId: number
  telegramId: string
}

@Injectable()
export class DealTopicRepository {
  constructor(@Inject(DB_TOKEN) readonly db: DBType) {}

  async create(
    value: DealTopicInsert,
    db: DbOrTransaction = this.db,
  ): Promise<DealTopicRow | null> {
    const data = await db.insert(dealTopics).values(value).returning()
    return data[0] ?? null
  }

  async findByDealId(dealId: bigint): Promise<DealTopicRow[]> {
    return this.db
      .select()
      .from(dealTopics)
      .where(eq(dealTopics.dealId, dealId))
  }

  async findByTopicIdAndTelegramId(
    topicId: number,
    telegramId: bigint,
  ): Promise<DealTopicRow | null> {
    const data = await this.db
      .select({dealTopic: dealTopics})
      .from(dealTopics)
      .innerJoin(users, eq(users.id, dealTopics.userId))
      .where(
        and(eq(dealTopics.topicId, topicId), eq(users.telegramId, telegramId)),
      )
      .limit(1)
    return data[0]?.dealTopic ?? null
  }

  async findForwardingTargets(
    topicId: number,
    telegramId: bigint,
  ): Promise<ForwardingTarget[]> {
    const result = await this.db.execute(sql`
      select ot.topic_id, ou.telegram_id
      from deal_topics st
      inner join users su on su.id = st.user_id
      inner join deal_topics ot on ot.deal_id = st.deal_id and ot.id != st.id
      inner join users ou on ou.id = ot.user_id
      where st.topic_id = ${topicId}
        and su.telegram_id = ${telegramId}
        and ou.telegram_id is not null
    `)
    const rows = result.rows as Array<{topic_id: string; telegram_id: string}>
    return rows.map(
      (row): ForwardingTarget => ({
        topicId: Number(row.topic_id),
        telegramId: row.telegram_id,
      }),
    )
  }
}
