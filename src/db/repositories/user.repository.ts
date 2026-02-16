import {Inject, Injectable} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {tryCatch} from '../../simple-result.js'
import {DB_TOKEN, type DBType} from '../db.tokens.js'
import {users} from '../tables/users.table.js'

export type UserRow = typeof users.$inferSelect

type CreateTelegramUserParams = {
  id: number
  language_code?: string
  first_name?: string
  last_name?: string
  username?: string
  is_premium?: boolean
  photo_url?: string
}

@Injectable()
export class UserRepository {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(DB_TOKEN) private readonly db: DBType,
  ) {
    this.logger.setContext(UserRepository.name)
  }

  async findById(id: bigint): Promise<UserRow | null> {
    const data = await this.db.query.users.findFirst({
      where: {id},
    })
    return data ?? null
  }

  async findByIds(ids: bigint[]): Promise<UserRow[]> {
    const data = await this.db.query.users.findMany({
      where: {id: {in: ids}},
    })
    return data ?? []
  }

  async findByTelegramId(telegramId: bigint): Promise<UserRow | null> {
    const {data, error} = await tryCatch(
      this.db.query.users.findFirst({
        where: {telegramId},
      }),
    )

    if (error) {
      this.logger.warn(
        {err: error, telegramId},
        'Failed to fetch user by telegram id',
      )
      return null
    }

    return data ?? null
  }

  async createTelegramUser(
    telegramId: bigint,
    userData: CreateTelegramUserParams,
  ): Promise<UserRow> {
    const {data, error} = await tryCatch(
      this.db
        .insert(users)
        .values({
          telegramId,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          language: userData.language_code,
          avatarUrl: userData.photo_url,
        })
        .returning(),
    )

    if (error || !data?.length) {
      this.logger.error({err: error, telegramId}, 'Failed to create user')
      throw error ?? new Error('Failed to create user')
    }

    return data[0]
  }
}
