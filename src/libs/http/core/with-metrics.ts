import {Timer} from '../../../libs/domain/index.js'

import type {IMetrics} from './types.js'

export class WithMetrics {
  constructor(
    private readonly metrics: IMetrics,
    private readonly serviceName: string,
  ) {}

  protected async withMetrics<T>(
    fn: () => Promise<{data: T; status: number}>,
    metricName: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT',
  ): Promise<{data: T; status: number}> {
    const additionalLabels = {
      path: `${method} ${metricName}`,
      serviceName: this.serviceName,
    }

    const startTimestamp = new Timer()

    const res = await fn().catch((err) => {
      const error = err
      error.name = this.serviceName + 'ApiError'

      const httpCode = (error.status || error.code || 'unknown').toString()

      this.metrics.registerExternalServiceRequestLatency({
        status: 'fail',
        httpCode,
        duration: startTimestamp.elapsed(),
        ...additionalLabels,
      })

      throw error
    })

    this.metrics.registerExternalServiceRequestLatency({
      status: 'success',
      httpCode: (res.status || 'unknown').toString(),
      duration: startTimestamp.elapsed(),
      ...additionalLabels,
    })

    return res
  }
}
