import {Redis as BaseRedis} from 'ioredis'
import {Duration} from '../../../libs/domain/index.js'
import type {KeyValueStorage} from './types.js'

export class Redis implements KeyValueStorage {
  constructor(readonly client: BaseRedis) {}

  /**
   * @param key key for value
   */
  async get<T = string>(key: string): Promise<T | null> {
    const val = await this.client.get(key)

    return val === null ? null : (JSON.parse(val) as T)
  }

  /**
   * @param key key for value
   * @param value value for key
   * @param ttl time to live
   */
  async set<T>(key: string, value: string | T, ttl: Duration): Promise<void> {
    const json = JSON.stringify(value)

    await this.client.set(key, json, 'EX', ttl.toSeconds())
  }

  /**
   * @param keys getting values passing keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const result = await this.client.mget(...keys)

    return result.map((val) => {
      return val === null ? null : (JSON.parse(val) as T)
    })
  }

  /**
   * @param values for better performance values size should be less 10k
   * @see https://redis.io/docs/manual/pipelining/#:~:text=Server%3A%204-,IMPORTANT%20NOTE,-%3A%20While%20the%20client
   * @param ttl
   */
  async mset<T>(values: Record<string, T>, ttl: Duration): Promise<void> {
    const pipeline = this.client.pipeline()

    Object.entries(values).forEach(([key, val]) => {
      const json = JSON.stringify(val)
      pipeline.set(key, json, 'EX', ttl.toSeconds())
    })

    const res = await pipeline.exec()

    const errors = res
      ?.map((val) => val[0])
      .filter((err): err is Error => err !== null)

    if (errors?.length) {
      throw AggregateError(errors, 'Failed to set some keys to redis')
    }
  }

  /**
   * @param keys keys to delete
   */
  async del(keys: string[]): Promise<void> {
    await this.client.del(keys)
  }

  /**
   * @param key key for value
   * @param value value for key
   */
  async lpush<T>(key: string, value: string | T): Promise<void> {
    const json = JSON.stringify(value)

    await this.client.lpush(key, json)
  }

  /**
   * @param key key for value
   * @param start offset from left
   * @param stop last index for
   */
  async lrange<T = string>(
    key: string,
    start: number,
    stop: number,
  ): Promise<T[]> {
    const result = await this.client.lrange(key, start, stop)

    return result.map((val) => JSON.parse(val) as T)
  }

  async expire(key: string, ttl: Duration) {
    return this.client.expire(key, ttl.toSeconds())
  }

  /**
   * atomically gets and deletes a key
   * @param key key to get and delete
   */
  async getdel<T = string>(key: string): Promise<T | null> {
    const val = await this.client.getdel(key)

    return val === null ? null : (JSON.parse(val) as T)
  }
}
