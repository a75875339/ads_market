import {Module} from '@nestjs/common'
import {SharedLoggerModule} from '../../libs/common/shared-dynamic-modules.js'
import {DbModule} from '../../db/db.module.js'
import {MetricsModule} from '../../libs/secondary/metrics/index.js'
import {RedisModule} from '../../libs/secondary/redis/redis.module.js'
import {TelegramModule} from './telegram/telegram.module.js'

@Module({
  imports: [
    SharedLoggerModule,
    TelegramModule,
    MetricsModule,
    DbModule,
    RedisModule,
  ],
})
export class TgBotAppModule {}
