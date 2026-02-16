import path from 'node:path'
import {getConfig, s} from '../libs/config/index.js'
import {AppEnum} from './app.enum.js'
import 'dotenv/config'

const configFolder = path.join(
  process.cwd(),
  './config/',
  process.env.CONFIG_PROFILE || './',
)

const RedisValueSchema = s.object({
  key: s.string(),
  ttl: s.duration(),
})

const ConfigScheme = s.object({
  metrics: s.object({
    prefix: s.string(),
    port: s.int(),
  }),
  app: s.object({
    name: s.enum(AppEnum),
    hostname: s.string(),
    api: s.object({
      port: s.int(),
      timeout: s.duration(),
    }),
    worker: s.object({
      port: s.int(),
    }),
    tg_bot: s.object({
      port: s.int(),
    }),
    job_worker: s.object({
      port: s.int(),
    }),
  }),
  docker: s.boolean(),
  db: s.object({
    log_level: s.array(s.string()),
    url: s.string(),
    ssl: s.boolean(),
    synchronize: s.boolean(),
    migrations_run: s.boolean(),
  }),
  cache_redis: s.object({
    host: s.string(),
    port: s.int(),
    username: s.string(),
    password: s.string(),
    db: s.int(),
    tls: s.boolean(),
    keys: s.object({
      deal_update_lock: RedisValueSchema,
      deposit_lock: RedisValueSchema,
      users: RedisValueSchema,
      creative_pending: RedisValueSchema,
    }),
  }),
  bot: s.object({
    token: s.string(),
    webhook_url: s.string(),
    webhook_secret: s.string(),
    username: s.string(),
    tma: s.string(),
  }),
  // TON blockchain configuration
  ton: s.object({
    endpoint: s.string(),
    api_key: s.string().optional(),

    mnemonic: s.string(),

    tonapi_key: s.string(),
    tonapi_endpoint: s.string(),
    tonapi_webhook_id: s.string().optional(),
    tonapi_webhook_token: s.string(),

    usdt_master_address: s.string(),

    min_ton_amount: s.string(),
  }),
  // Marketplace-specific settings
  marketplace: s.object({
    text_max_length: s.int(),
  }),
  deal_worker: s.object({
    cancel_interval: s.duration(),
    post_interval: s.duration(),
    complete_interval: s.duration(),
    payment_check_interval: s.duration(),
    wallet_poll_interval: s.duration(),
  }),
  queues: s.object({
    deal_topic_queue: s.object({
      task_max_attempts: s.int(),
      retry_delay: s.duration(),
      remove_on_complete: s.int(),
      remove_on_fail: s.int(),
      concurrency: s.int(),
    }),
  }),
  api: s.object({
    service_a: s.object({
      endpoint: s.string(),
    }),
  }),
  jwt: s.object({
    secret: s.string(),
    cookie_domain: s.string(),
    cookie_name: s.string(),
    ttl: s.duration(),
  }),
})

export const config = getConfig(ConfigScheme, {
  folder: configFolder,
  files: ['config.yml'],
})
