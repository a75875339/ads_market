import {
  Global,
  Inject,
  Injectable,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common'
import type {Logger as DrizzleLogger} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/node-postgres'
import {PinoLogger} from 'nestjs-pino'
import pg from 'pg'
import {config} from '../config/config.js'
import {DB_TOKEN} from './db.tokens.js'
import {relations} from './relations.js'
import {AdFormatRepository} from './repositories/ad-format.repository.js'
import {CampaignRepository} from './repositories/campaign.repository.js'
import {CategoryRepository} from './repositories/category.repository.js'
import {ChannelRepository} from './repositories/channel.repository.js'
import {ChannelManagerRepository} from './repositories/channel-manager.repository.js'
import {DealRepository} from './repositories/deal.repository.js'
import {DealEventRepository} from './repositories/deal-event.repository.js'
import {DealTopicRepository} from './repositories/deal-topic.repository.js'
import {DealWalletTransactionRepository} from './repositories/deal-wallet-transaction.repository.js'
import {UserRepository} from './repositories/user.repository.js'

class PinoPostgresLogger implements DrizzleLogger {
  constructor(private readonly logger: PinoLogger) {}

  logQuery(query: string, params: unknown[]): void {
    this.logger.debug({query, params}, 'SQL Query')
  }
}

const POOL_TOKEN = Symbol('POOL_TOKEN')

@Injectable()
class DbLifecycle implements OnApplicationShutdown {
  constructor(
    @Inject(POOL_TOKEN) private readonly pool: pg.Pool,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('DbLifecycle')
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.info({signal}, 'Shutting down database connection pool')
    await this.pool.end()
    this.logger.info('Database connection pool closed')
  }
}

@Global()
@Module({
  providers: [
    {
      provide: POOL_TOKEN,
      useFactory: () => {
        return new pg.Pool({
          connectionString: config.db.url,
          ssl: config.db.ssl,
        })
      },
    },
    {
      provide: DB_TOKEN,
      useFactory: (pool: pg.Pool, logger: PinoLogger) => {
        logger.setContext('DrizzleDB')
        const dbLogger = new PinoPostgresLogger(logger)
        return drizzle({
          client: pool,
          logger: dbLogger,
          casing: 'snake_case',
          relations,
        })
      },
      inject: [POOL_TOKEN, PinoLogger],
    },
    DbLifecycle,
    UserRepository,
    ChannelRepository,
    ChannelManagerRepository,
    AdFormatRepository,
    CategoryRepository,
    CampaignRepository,
    DealRepository,
    DealEventRepository,
    DealTopicRepository,
    DealWalletTransactionRepository,
  ],
  exports: [
    DB_TOKEN,
    UserRepository,
    ChannelRepository,
    ChannelManagerRepository,
    AdFormatRepository,
    CategoryRepository,
    CampaignRepository,
    DealRepository,
    DealEventRepository,
    DealTopicRepository,
    DealWalletTransactionRepository,
  ],
})
export class DbModule {}
