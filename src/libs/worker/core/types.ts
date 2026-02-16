import {Duration} from '../../../libs/domain/index.js'

export type Task = (...args: unknown[]) => unknown

export interface IMetrics {
  registerWorkerLoopLatency(result: {
    name: string
    status: 'fail' | 'success'
    duration: Duration
  }): void
}
