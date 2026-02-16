import {Module} from '@nestjs/common'
import {MetricsServerModule as NestServer} from '../../metrics/nest.js'
import {MetricsModule} from './metrics.module.js'
import {MetricsService} from './metrics.service.js'

@Module({
  imports: [
    NestServer.register({
      imports: [MetricsModule],
      inject: [MetricsService],
      useMetrics: async (metrics: MetricsService) => metrics,
    }),
  ],
})
export class MetricsServerModule {}
