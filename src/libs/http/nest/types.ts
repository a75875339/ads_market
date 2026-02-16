import type {Abstract, Type} from '@nestjs/common'
import type {ILogger} from '../../logger/index.js'
import type {HttpClientParams} from '../core/index.js'
import type {IMetrics} from '../core/types.js'
import type {HttpClientService} from './index.js'

export type InjectionToken = string | symbol | Type<any> | Abstract<any>

export interface HttpModuleOptions {
  config: HttpClientParams
  metrics: IMetrics
  logger?: ILogger
}

export interface HttpModuleAsyncOptions {
  token?: InjectionToken
  imports?: any[]
  inject?: any[]
  useFactory: (...args: any[]) => Promise<HttpClientService> | HttpClientService
}
