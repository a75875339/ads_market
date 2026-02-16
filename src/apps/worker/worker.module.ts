import {Module} from '@nestjs/common'
import {SharedLoggerModule} from '../../libs/common/shared-dynamic-modules.js'
import {DbModule} from '../../db/db.module.js'
import {MetricsModule} from '../../libs/secondary/metrics/index.js'
import {RedisModule} from '../../libs/secondary/redis/redis.module.js'
import {WorkerManagerModule} from '../../libs/secondary/worker-manager/worker-manager.module.js'
import {DealWorkerModule} from './deal/deal-worker.module.js'
import {TonPaymentWorkerModule} from './ton/ton-payment-worker.module.js'

@Module({
  imports: [
    MetricsModule,
    WorkerManagerModule,
    DbModule,
    RedisModule,
    SharedLoggerModule,
    DealWorkerModule,
    TonPaymentWorkerModule,
  ],
})
export class WorkerAppModule {}
