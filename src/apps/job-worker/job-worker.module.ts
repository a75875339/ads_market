import {Module} from '@nestjs/common'
import {SharedLoggerModule} from '../../libs/common/shared-dynamic-modules.js'
import {DbModule} from '../../db/db.module.js'
import {BullmqAdMarket} from '../../libs/secondary/bullmq/bullmq.module.js'
import {MetricsModule} from '../../libs/secondary/metrics/index.js'
import {RedisModule} from '../../libs/secondary/redis/redis.module.js'
import {DealTopicJobModule} from './jobs/deal-topic/deal-topic-job.module.js'

@Module({
  imports: [
    SharedLoggerModule,
    MetricsModule,
    BullmqAdMarket,
    DbModule,
    RedisModule,
    DealTopicJobModule,
  ],
})
export class JobWorkerAppModule {}
