import {Module} from '@nestjs/common'
import {config} from '../../../config/config.js'
import {getEnvironment} from '../../../config/environment.js'
import {
  MetricsRegistryModule,
  MetricsRegistryService,
} from '../../metrics/nest.js'
import {MetricsService} from './metrics.service.js'

@Module({
  imports: [
    MetricsRegistryModule.register({
      projectName: config.metrics.prefix,
      defaultLabels: {
        environment: getEnvironment(),
      },
    }),
  ],
  providers: [
    {
      provide: MetricsService,
      useFactory: (registry: MetricsRegistryService): MetricsService =>
        new MetricsService(registry),
      inject: [MetricsRegistryService],
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
