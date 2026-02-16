import {Module} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {WorkerManagerModule as BaseWorkerManagerModule} from '../../worker/nest.js'
import {MetricsModule} from '../metrics/metrics.module.js'
import {MetricsService} from '../metrics/metrics.service.js'

@Module({
  imports: [
    BaseWorkerManagerModule.register({
      imports: [MetricsModule],
      injectMetrics: [MetricsService],
      injectLogger: [PinoLogger],
      useMetrics: (metrics) => metrics,
      useLogger: (logger) => logger,
    }),
  ],
})
export class WorkerManagerModule {}
