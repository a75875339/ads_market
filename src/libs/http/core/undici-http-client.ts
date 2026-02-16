import {Readable} from 'node:stream'
import {Agent, request} from 'undici'
import {isTest} from '../../config/environment.js'
import type {UndiciHttpClientParams} from './types.js'

export class UndiciHttpClient {
  constructor(private config: UndiciHttpClientParams) {}

  async get<T>(
    path: string,
    {headers}: {headers?: Record<string, string>} = {},
  ): Promise<{data: T; status: number}> {
    const url = this.config.baseUrl ? `${this.config.baseUrl}${path}` : path

    const {body, statusCode} = await request(url, {
      method: 'GET',
      headers: {
        ...this.config.headers,
        ...headers,
      },

      dispatcher: !isTest()
        ? new Agent({
            bodyTimeout: this.config.timeout.toMilliseconds(),
            keepAliveTimeout: this.config.keepAlive ? 2000 : 0,
          })
        : undefined,
    })
    if (this.config.throwErrorStatuses && statusCode > 399) {
      let msg = `received HTTP status ${statusCode}`
      const responseContent = Buffer.from(await body.arrayBuffer()).toString(
        'utf-8',
      )
      if (responseContent !== '') {
        msg += `; body: ${responseContent}`
      }
      throw new Error(msg)
    }

    const data = (await body.json()) as T

    return {data, status: statusCode}
  }

  async request<T>(
    method: 'POST' | 'PATCH' | 'PUT',
    path: string,
    input?:
      | Record<string | number, unknown>
      | string
      | Buffer
      | Uint8Array
      | Readable
      | FormData,
    {
      type = 'json',
      headers,
    }: {type?: 'json'; headers?: Record<string, string>} = {},
  ) {
    const resHeaders = {
      ...this.config.headers,
      'content-type': 'application/json',
      ...headers,
    }

    let bodyIn: undefined | string | Buffer | Uint8Array | Readable | FormData

    if (!input) {
      bodyIn = undefined
    } else if (type === 'json') {
      bodyIn = JSON.stringify(input)
    } else {
      bodyIn = input as string | Buffer | Uint8Array | Readable | FormData
    }

    const url = this.config.baseUrl ? `${this.config.baseUrl}${path}` : path

    const {body, statusCode} = await request(url, {
      body: bodyIn,
      headers: resHeaders,
      method,
      dispatcher: !isTest()
        ? new Agent({
            bodyTimeout: this.config.timeout.toMilliseconds(),
            keepAliveTimeout: this.config.keepAlive ? 2000 : 0,
          })
        : undefined,
    })
    const responseContent = Buffer.from(await body.arrayBuffer()).toString(
      'utf-8',
    )
    if (this.config.throwErrorStatuses && statusCode > 399) {
      let msg = `received HTTP status ${statusCode}`
      if (responseContent !== '') {
        msg += `; body: ${responseContent}`
      }
      throw new Error(msg)
    }

    const data = (
      responseContent === '' ? undefined : JSON.parse(responseContent)
    ) as T

    return {data, status: statusCode}
  }

  async post<T>(
    path: string,
    input?:
      | Record<string | number, unknown>
      | string
      | Buffer
      | Uint8Array
      | Readable
      | FormData,
    {
      type = 'json',
      headers,
    }: {type?: 'json'; headers?: Record<string, string>} = {},
  ) {
    return this.request<T>('POST', path, input, {type, headers})
  }

  async patch<T>(
    path: string,
    input?:
      | Record<string | number, unknown>
      | string
      | Buffer
      | Uint8Array
      | Readable
      | FormData,
    {
      type = 'json',
      headers,
    }: {type?: 'json'; headers?: Record<string, string>} = {},
  ) {
    return this.request<T>('PATCH', path, input, {type, headers})
  }

  async put<T>(
    path: string,
    input?:
      | Record<string | number, unknown>
      | string
      | Buffer
      | Uint8Array
      | Readable
      | FormData,
    {
      type = 'json',
      headers,
    }: {type?: 'json'; headers?: Record<string, string>} = {},
  ) {
    return this.request<T>('PUT', path, input, {type, headers})
  }
}
