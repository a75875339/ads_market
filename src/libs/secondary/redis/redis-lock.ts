import {randomBytes} from 'node:crypto'
import {RedisClient} from '../../redis/nest.js'

class ResourceLockError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResourceLockError'
  }
}

export class RedisLock {
  private redis: RedisClient
  private lockValue = randomBytes(20).toString('hex')

  constructor(redis: RedisClient) {
    this.redis = redis
  }

  async acquire(
    lockKey: string,
    lockTTL = 30000,
    silent: boolean,
    retryCount: number,
    retryDelay: number,
  ): Promise<boolean> {
    // write code for retry
    let retry = 0
    while (retry < retryCount) {
      const result = await this.redis.set(
        lockKey,
        this.lockValue,
        'PX',
        lockTTL,
        'NX',
      )

      if (result === 'OK') {
        return true
      }
      retry++
      await new Promise((res) => setTimeout(res, retryDelay))
    }

    if (!silent) {
      throw new ResourceLockError(`Failed to acquire lock for key: ${lockKey}`)
    }

    return false
  }

  async release(lockKey: string): Promise<boolean> {
    const luaScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `

    const result = await this.redis.eval(luaScript, 1, lockKey, this.lockValue)
    return result === 1
  }
}
