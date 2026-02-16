import {Injectable} from '@nestjs/common'
import type {User as TelegramUser} from 'grammy/types'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../config/config.js'
import type {UserRow} from '../../db/repositories/user.repository.js'
import {UserRepository} from '../../db/repositories/user.repository.js'
import {RedisStorageService} from '../../libs/secondary/redis/redis.service.js'
import type {CachedUser} from './users.types.js'

@Injectable()
export class UserService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly redisService: RedisStorageService,
    private readonly userRepository: UserRepository,
  ) {
    this.logger.setContext(UserService.name)
  }

  private getCacheKey(telegramId: bigint): string {
    return `${config.cache_redis.keys.users.key}:${telegramId.toString()}`
  }

  async getUserSafeDataByTelegramId(
    telegramId: bigint,
  ): Promise<CachedUser | null> {
    const cacheKey = this.getCacheKey(telegramId)

    return this.redisService.withCache<CachedUser | null>(
      cacheKey,
      config.cache_redis.keys.users.ttl,
      async () => {
        const existing = await this.userRepository.findByTelegramId(telegramId)
        if (existing) {
          return this.toCachedUser(existing)
        }

        return null
      },
    )
  }

  async getOrCreateByTelegramId(
    telegramId: bigint,
    userData: TelegramUser,
  ): Promise<CachedUser> {
    const cacheKey = this.getCacheKey(telegramId)

    const res = await this.redisService.withCache<CachedUser>(
      cacheKey,
      config.cache_redis.keys.users.ttl,
      async () => {
        const existing = await this.userRepository.findByTelegramId(telegramId)
        if (existing) {
          return this.toCachedUser(existing)
        }

        const user = await this.userRepository.createTelegramUser(
          telegramId,
          userData,
        )
        return this.toCachedUser(user)
      },
      {
        onHit: () => {
          this.logger.debug({telegramId}, 'Got user from redis cache.')
        },
      },
    )

    return res
  }

  private toCachedUser(user: UserRow): CachedUser {
    return {
      id: user.id.toString(),
      telegramId: user.telegramId?.toString() ?? '',
      createdAt: user.createdAt?.toISOString() ?? new Date(0).toISOString(),
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      username: user.username ?? '',
      avatarUrl: user.avatarUrl ?? '',
    }
  }
}
