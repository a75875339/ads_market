import type {DynamicModule} from '@nestjs/common'
import type {MetricsRegistryPrometheusServiceConfig} from '../../register/types.js'
import {MetricsRegistryService} from './metrics-registry.service.js'

export class MetricsRegistryModule {
  static register(
    params: Omit<
      MetricsRegistryPrometheusServiceConfig,
      'enableDefaultMetrics'
    >,
  ): DynamicModule {
    return {
      module: MetricsRegistryModule,
      providers: [
        {
          provide: MetricsRegistryService,
          useValue: new MetricsRegistryService({
            ...params,
            enableDefaultMetrics: true,
          }),
        },
      ],
      exports: [MetricsRegistryService],
    }
  }
}
