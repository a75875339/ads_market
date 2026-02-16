import {Readable} from 'node:stream'
import {Dispatcher} from 'undici'
import {Duration} from '../../../libs/domain/index.js'

export type ExternalHttpCallResult = {
  serviceName: string
  status: 'fail' | 'success'
  path: string
  httpCode: string
  duration: Duration
}

export interface IMetrics {
  registerExternalServiceRequestLatency(result: ExternalHttpCallResult): void
}

export type UndiciHttpClientParams = {
  serviceName: string
  baseUrl?: string
  timeout: Duration
  /**
   * Default to `true`
   */
  keepAlive?: boolean
  headers?: Dispatcher.DispatchOptions['headers']
  /**
   * Throw on 4xx/5xx statuses. Defaults to `false`
   */
  throwErrorStatuses?: boolean
}

export type HttpClientParams = {
  serviceName: string
  baseUrl: string
  timeout: Duration
  /**
   * Default to `true`
   */
  keepAlive?: boolean
  headers?: Dispatcher.DispatchOptions['headers']
  /**
   * Throw on 4xx/5xx statuses. Defaults to `false`
   */
  throwErrorStatuses?: boolean
}

export type HttpProxyClientParams = {
  serviceName: string
  endpoints: string[]
  timeout: Duration
  /**
   * Default to `true`
   */
  keepAlive?: boolean
  headers?: Dispatcher.DispatchOptions['headers']
}

export type IHttpClient = {
  post<T>(
    url: string,
    metricName: string,
    data?:
      | Record<string | number, unknown>
      | string
      | Buffer
      | Uint8Array
      | Readable
      | FormData,
  ): Promise<{data: T; status: number}>

  get<T>(url: string, metricName: string): Promise<{data: T; status: number}>
}
