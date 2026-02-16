import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'
import {HttpClientService} from './http-client.service.js'
import type {HttpModuleAsyncOptions, HttpModuleOptions} from './types.js'

@Module({})
export class HttpModule {
  static register(options: HttpModuleOptions): DynamicModule {
    return {
      module: HttpModule,
      providers: [
        {
          provide: HttpClientService,
          useValue: new HttpClientService(
            options.config,
            options.metrics,
            options.logger,
          ),
        },
      ],
      exports: [HttpClientService],
    }
  }

  static registerAsync(options: HttpModuleAsyncOptions): DynamicModule {
    const token = options.token ?? HttpClientService
    return {
      module: HttpModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: token,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ],
      exports: [token],
    }
  }
}
