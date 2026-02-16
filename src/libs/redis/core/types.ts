import {Duration} from '../../../libs/domain/index.js'

export type KeyValueStorage = {
  set<T>(key: string, value: T, ttl: Duration): Promise<void>
  get<T>(key: string): Promise<T | null>

  mset<T>(values: Record<string, T>, ttl: Duration): Promise<void>
  mget<T>(keys: string[]): Promise<(T | null)[]>
}

export type RedisLRUConfig = {
  maxElements: number
  keyPrefix: string
  ttl: Duration
  asLFU: boolean
}
