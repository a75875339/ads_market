import {Readable} from 'node:stream'
import type {ILogger} from '../../logger/index.js'
import type {HttpClientParams, IHttpClient, IMetrics} from './types.js'
import {UndiciHttpClient} from './undici-http-client.js'
import {WithMetrics} from './with-metrics.js'

export class HttpClient extends WithMetrics implements IHttpClient {
  private readonly client: UndiciHttpClient

  constructor(
    config: HttpClientParams,
    metrics: IMetrics,
    private readonly logger?: ILogger,
  ) {
    super(metrics, config.serviceName)

    logger?.setContext(config.serviceName + 'Client')

    this.client = new UndiciHttpClient(config)
  }

  async post<T>(
    url: string,
    metricName: string,
    data?:
      | Record<string | number, unknown>
      | string
      | Buffer
      | Uint8Array
      | Readable
      | FormData,
    {headers}: {headers?: Record<string, string>} = {},
  ): Promise<{data: T; status: number}> {
    this.logger?.info({
      msg: 'Outbound API request.',
      method: 'POST',
      url,
      data,
    })
    return this.withMetrics(
      () => this.client.post<T>(url, data, {headers}),
      metricName,
      'POST',
    )
  }

  async patch<T>(
    url: string,
    metricName: string,
    data?:
      | Record<string | number, unknown>
      | string
      | Buffer
      | Uint8Array
      | Readable
      | FormData,
    {headers}: {headers?: Record<string, string>} = {},
  ): Promise<{data: T; status: number}> {
    this.logger?.info({
      msg: 'Outbound API request.',
      method: 'PATCH',
      url,
      data,
    })
    return this.withMetrics(
      () => this.client.patch<T>(url, data, {headers}),
      metricName,
      'PATCH',
    )
  }

  async put<T>(
    url: string,
    metricName: string,
    data?:
      | Record<string | number, unknown>
      | string
      | Buffer
      | Uint8Array
      | Readable
      | FormData,
    {headers}: {headers?: Record<string, string>} = {},
  ): Promise<{data: T; status: number}> {
    this.logger?.info({
      msg: 'Outbound API request.',
      method: 'PUT',
      url,
      data,
    })
    return this.withMetrics(
      () => this.client.put<T>(url, data, {headers}),
      metricName,
      'PUT',
    )
  }

  async get<T>(
    url: string,
    metricName: string,
    {headers}: {headers?: Record<string, string>} = {},
  ): Promise<{data: T; status: number}> {
    this.logger?.info({
      msg: 'Outbound API request.',
      method: 'GET',
      url,
    })
    return this.withMetrics(
      () => this.client.get<T>(url, {headers}),
      metricName,
      'GET',
    )
  }
}
