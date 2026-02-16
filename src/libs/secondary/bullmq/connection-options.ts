import type {ConnectionOptions} from 'bullmq'
import {config} from '../../../config/config.js'

export const adMarketConfig = 'ad-market-config'
export function getAdMarketRedisConnectionOptions() {
  // todo: use separate redis for queues
  const connection = {
    host: config.cache_redis.host,
    port: config.cache_redis.port,
    db: config.cache_redis.db,
    username: config.cache_redis.username,
    password: config.cache_redis.password,
  } as ConnectionOptions

  if (config.cache_redis.tls) {
    ;(connection as any).tls = {}
  }

  return connection
}
