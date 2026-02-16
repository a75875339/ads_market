import type {HttpCallResult} from '../../metrics/modules/prometheus/nest/interceptors/types.js'
import {BaseMetricsService} from '../../metrics/nest.js'

export class MetricsService extends BaseMetricsService {
  public readonly unhandledErrorsCount = this.registry.makeCounter({
    name: 'unhandled_errors_count',
    help: 'Count of errors passed to unhandledRejection and uncaughtException handlers',
  })

  public incUnhandledErrorsCount(value?: number): void {
    this.unhandledErrorsCount.inc(value)
  }

  public getAdditionalLabels(_error: Error): Record<string, string> {
    return {}
  }

  public registerInboundRequestLatency(result: HttpCallResult): void {
    const additional = result.err ? this.getAdditionalLabels(result.err) : {}

    this.inboundRequestLatency
      .labels({
        status: result.status.toString(),
        path: result.path,
        method: result.method,
        ...additional,
      })
      .observe(result.duration.toMilliseconds())
  }
}
