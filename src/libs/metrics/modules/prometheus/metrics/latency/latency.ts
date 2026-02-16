import {Counter, Histogram, type LabelValues} from 'prom-client'

export class Latency<T extends string> {
  constructor(
    private readonly counter: Counter<T>,
    private readonly histogram: Histogram<T>,
  ) {}

  observe(labels = {} as LabelValues<T>, value: number): void {
    this.counter.labels(labels).inc()
    this.histogram.observe(labels, value)
  }
}
