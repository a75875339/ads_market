import {Inject, Injectable} from '@nestjs/common'
import {and, eq, isNull, sql} from 'drizzle-orm'
import {ManagerPermission} from '../constants.js'
import {DB_TOKEN, type DBType} from '../db.tokens.js'
import {channelManagers} from '../tables/channel-managers.table.js'
import {users} from '../tables/users.table.js'
import type {UserMinimalType} from './types.js'

export type ChannelManagerRow = typeof channelManagers.$inferSelect
export type ChannelManagerInsert = typeof channelManagers.$inferInsert

export type ChannelManagerListItem = {
  id: bigint
  channelId: bigint
  permissions: ManagerPermission
  user: UserMinimalType
}

@Injectable()
export class ChannelManagerRepository {
  constructor(@Inject(DB_TOKEN) private readonly db: DBType) {}

  async findByChannelAndUser(
    channelId: bigint,
    userId: bigint,
  ): Promise<ChannelManagerRow | null> {
    const data = await this.db.query.channelManagers.findFirst({
      where: {channelId, userId},
    })
    return data ?? null
  }

  async listActiveByChannelId(channelId: bigint): Promise<ChannelManagerRow[]> {
    const data = await this.db
      .select()
      .from(channelManagers)
      .where(
        and(
          eq(channelManagers.channelId, channelId),
          isNull(channelManagers.deletedAt),
        ),
      )
    return data ?? []
  }

  async listActiveWithUserByChannelId(channelId: bigint) {
    const data = await this.db
      .select({
        id: channelManagers.id,
        channelId: channelManagers.channelId,
        userId: channelManagers.userId,
        permissions: channelManagers.permissions,

        telegramId: users.telegramId,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(channelManagers)
      .innerJoin(users, eq(channelManagers.userId, users.id))
      .where(
        and(
          eq(channelManagers.channelId, channelId),
          isNull(channelManagers.deletedAt),
        ),
      )

    return (data ?? []).map((row) => {
      const {id, channelId, permissions, userId, ...user} = row
      return {
        id,
        channelId,
        permissions,
        user: {id: userId, ...user},
      } as ChannelManagerListItem
    })
  }

  async upsert(
    channelId: bigint,
    userId: bigint,
    permissions: ManagerPermission,
  ): Promise<boolean> {
    const result = await this.db.execute(
      sql.raw(/* sql */ `
        INSERT INTO channel_managers (channel_id, user_id, permissions)
        VALUES (${channelId}, ${userId}, '${permissions}')
        ON CONFLICT (channel_id, user_id)
        DO UPDATE SET
          permissions = CASE WHEN excluded.deleted_at IS NULL THEN excluded.permissions ELSE '${permissions}' END,
          deleted_at = NULL,
          updated_at = NOW()
        RETURNING id
      `),
    )
    return result.rows.length > 0
  }

  async setDeletedAt(channelId: bigint, userId: bigint): Promise<void> {
    await this.db
      .update(channelManagers)
      .set({deletedAt: new Date()})
      .where(
        and(
          eq(channelManagers.channelId, channelId),
          eq(channelManagers.userId, userId),
        ),
      )
  }

  async updatePermissions(
    channelId: bigint,
    userId: bigint,
    permissions: (typeof ManagerPermission)[keyof typeof ManagerPermission],
  ): Promise<number> {
    const result = await this.db
      .update(channelManagers)
      .set({permissions})
      .where(
        and(
          eq(channelManagers.channelId, channelId),
          eq(channelManagers.userId, userId),
        ),
      )
      .returning({id: channelManagers.id})
    return result.length
  }
}
