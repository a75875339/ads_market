declare module 'redis-lru' {
  import {Redis} from 'ioredis'
  export type Lru<T> = {
    get: (key: string) => Promise<T | null>
    set: (key: string, value: unknown, ttl?: /** ms */ number) => Promise<void>
    // getOrSet: getOrSet
    peek: (key: string) => Promise<T | null>
    del: (key: string) => Promise<void>
    reset: () => Promise<void>
    has: (key: string) => Promise<boolean>
    keys: () => Promise<string[]>
    values: () => Promise<T[]>
    count: () => Promise<number>
  }

  type Config = {
    namespace: string
    max: number
    maxAge: number
    score?: (key: string) => number
    increment?: boolean
  }

  function lru<T>(redis: Redis, config: Config): Lru<T>

  export default lru
}
