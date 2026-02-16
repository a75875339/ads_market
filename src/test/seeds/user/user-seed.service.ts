import {Inject, Injectable} from '@nestjs/common'
import {randUserName} from '@ngneat/falso'
import {encodeTgRawData} from '../../../apps/api/auth/webappdata.js'
import {config} from '../../../config/config.js'
import {DB_TOKEN, type DBType} from '../../../db/db.tokens.js'
import {users} from '../../../db/tables/users.table.js'

export type UserSeedInput = Partial<typeof users.$inferInsert>

@Injectable()
export class UserSeedService {
  constructor(@Inject(DB_TOKEN) private readonly db: DBType) {}

  async seed(input: UserSeedInput = {}): Promise<typeof users.$inferSelect> {
    const values = {
      username: input.username ?? randUserName(),
      telegramId: input.telegramId ?? BigInt(Math.floor(Math.random() * 1e12)),
      ...input,
    }

    const [user] = await this.db.insert(users).values(values).returning()
    return user
  }

  encodeTelegramData({
    telegramId,
    username,
    firstName,
    lastName,
  }: {
    telegramId: string
    username?: string
    firstName?: string
    lastName?: string
  }): [string, string] {
    const data: Record<string, string> = {
      user: JSON.stringify({
        id: Number(telegramId),
        first_name: firstName,
        last_name: lastName,
        username: username ?? randUserName(),
        language_code: 'en',
      }),
      auth_date: Math.floor(Date.now() / 1000).toString(),
      query_id: 'some_query_id',
    }

    return [encodeTgRawData(data, config.bot.token), telegramId]
  }
}
