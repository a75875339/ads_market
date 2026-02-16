import type {Request} from 'express'
import {Duration} from '../../../../../domain/index.js'

export interface HttpMetrics {
  registerInboundRequestLatency(result: HttpCallResult): void
}

export type HttpCallResult = {
  status: number
  method: string
  path: string
  duration: Duration
  err?: Error
  response?: unknown
  request: Request
}
