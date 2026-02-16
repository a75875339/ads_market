import {Module} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {ScheduleModule} from '../../scheduler/lib/index.js'
import {MetricsModule} from '../metrics/metrics.module.js'
import {MetricsService} from '../metrics/metrics.service.js'

@Module({
  imports: [
    ScheduleModule.forRoot(
      {},
      {
        imports: [MetricsModule],
        injectMetrics: [MetricsService],
        injectLogger: [PinoLogger],
        useMetrics: (metrics) => metrics,
        useLogger: (logger) => logger,
      },
    ),
  ],
})
export class SchedulerManagerModule {}
