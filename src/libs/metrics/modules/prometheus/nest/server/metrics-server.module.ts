import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'
import {MetricsRegistryInjector} from './injectors.js'
import {MetricsController} from './metrics.controller.js'
import type {Params} from './types.js'

@Module({})
export class MetricsServerModule {
  static register(params: Params): DynamicModule {
    return {
      module: MetricsServerModule,
      controllers: [MetricsController],
      imports: params.imports || [],
      providers: [
        {
          provide: MetricsRegistryInjector,
          useFactory: params.useMetrics,
          inject: params.inject || [],
        },
      ],
    }
  }
}
