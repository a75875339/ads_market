import {Duration} from '../../../../../domain/index.js'

export type ExternalServiceHttpCallLatency = {
  serviceName: string
  status: 'fail' | 'success'
  path: string
  httpCode: string
  duration: Duration
}

export type WorkerLoopLatency = {
  name: string
  status: 'fail' | 'success'
  duration: Duration
}

export interface WebsocketRpcCall {
  method: string
  status: 'success' | 'fail'
  duration: Duration
}
