import type {Histogram} from 'prom-client'
import {Buckets, ExponentialBuckets} from '../../buckets/buckets.js'
import type {HttpCallResult, HttpMetrics} from '../interceptors/types.js'
import {MetricsRegistryService} from './metrics-registry.service.js'
import type {
  ExternalServiceHttpCallLatency,
  WorkerLoopLatency,
} from './types.js'

export class BaseMetricsService implements HttpMetrics {
  protected readonly defaultBuckets: ExponentialBuckets
  protected readonly inboundRequestLatency: Histogram<string>
  protected readonly externalServiceRequestLatency: Histogram<string>
  protected readonly workerLoopLatency: Histogram<string>

  constructor(protected readonly registry: MetricsRegistryService) {
    this.defaultBuckets = new Buckets([
      0.1, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000,
    ])

    this.inboundRequestLatency = this.registry.makeHistogram({
      name: 'http_request_time',
      help: 'Duration of inbound http request',
      buckets: this.defaultBuckets,
      labels: ['status', 'path', 'method'],
    })

    this.externalServiceRequestLatency = this.registry.makeHistogram({
      name: 'external_service_latency',
      help: 'How much time external service call takes',
      buckets: this.defaultBuckets,
      labels: ['serviceName', 'path', 'status', 'httpCode'],
    })

    this.workerLoopLatency = this.registry.makeHistogram({
      name: 'worker_latency',
      help: 'How much time worker job takes',
      buckets: this.defaultBuckets,
      labels: ['name', 'status'],
    })
  }

  public getMetrics(): Promise<string> {
    return this.registry.getMetrics()
  }

  public registerInboundRequestLatency(result: HttpCallResult): void {
    this.inboundRequestLatency
      .labels({
        status: result.status.toString(),
        path: result.path,
        method: result.method,
      })
      .observe(result.duration.toMilliseconds())
  }

  public registerExternalServiceRequestLatency(
    result: ExternalServiceHttpCallLatency,
  ): void {
    this.externalServiceRequestLatency
      .labels({
        serviceName: result.serviceName,
        path: result.path,
        status: result.status.toString(),
        httpCode: result.httpCode.toString(),
      })
      .observe(result.duration.toMilliseconds())
  }

  public registerWorkerLoopLatency(result: WorkerLoopLatency): void {
    this.workerLoopLatency
      .labels({
        name: result.name,
        status: result.status.toString(),
      })
      .observe(result.duration.toMilliseconds())
  }
}
