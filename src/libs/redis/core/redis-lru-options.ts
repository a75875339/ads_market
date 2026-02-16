import {Duration} from '../../../libs/domain/index.js'

export interface IRedisLRUOptions {
  /**
   * maxElements - The maximum number of elements that can be stored in the cache.
   *
   */
  maxElements: number

  /**
   * keyPrefix - The prefix to use for all keys stored in Redis.
   *
   */
  keyPrefix: string

  /**
   * ttl - The time to live for each cache entry.
   *
   */
  ttl: Duration

  /**
   * asLFU - If true, use LFU instead of LRU.
   *
   */
  asLFU: boolean
}
