import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import type {HttpClientParams} from '../../http/index.js'
import type {InjectionToken} from '../../http/nest/types.js'
import {
  HttpModule as BaseHttpModule,
  HttpClientService,
} from '../../http/nest.js'
import {MetricsModule} from '../metrics/index.js'
import {MetricsService} from '../metrics/metrics.service.js'

@Module({})
export class HttpModule {
  static register(
    params: HttpClientParams,
    token?: InjectionToken,
    logRequests: boolean = false,
  ): DynamicModule {
    const providerToken = token ?? HttpClientService
    return {
      module: HttpModule,
      imports: [
        MetricsModule,
        BaseHttpModule.registerAsync({
          token: providerToken,
          imports: [MetricsModule],
          useFactory: async (
            metricsService: MetricsService,
            logger: PinoLogger,
          ) => {
            return new HttpClientService(
              params,
              metricsService,
              logRequests ? logger : undefined,
            )
          },
          inject: [MetricsService, PinoLogger],
        }),
      ],
      exports: [BaseHttpModule],
    }
  }
}
