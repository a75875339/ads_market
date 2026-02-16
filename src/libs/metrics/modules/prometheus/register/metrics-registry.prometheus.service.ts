import {
  Counter,
  collectDefaultMetrics,
  Gauge,
  Histogram,
  type LabelValues,
  Registry,
  Summary,
} from 'prom-client'
import {Buckets} from '../buckets/buckets.js'
import {Latency} from '../metrics/latency/latency.js'
import type {
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  MetricName,
  MetricsPrometheusLabelValue,
  MetricsRegistryPrometheusServiceConfig,
  SummaryMetric,
} from './types.js'

export class MetricsRegistryPrometheusService {
  private register = new Registry()

  private counterMetrics = new Map<MetricName, CounterMetric<string>>()

  private gaugeMetrics = new Map<MetricName, GaugeMetric<string>>()

  private histogramMetrics = new Map<MetricName, HistogramMetric<string>>()

  private summaryMetrics = new Map<MetricName, SummaryMetric<string>>()

  constructor(private readonly config: MetricsRegistryPrometheusServiceConfig) {
    if (config.defaultLabels) {
      const defaultLabels = {} as LabelValues<string>

      for (const key in config.defaultLabels) {
        defaultLabels[key] = config.defaultLabels[
          key
        ] as MetricsPrometheusLabelValue
      }

      this.register.setDefaultLabels(defaultLabels)
    }

    if (config.enableDefaultMetrics) {
      collectDefaultMetrics({
        register: this.register,
        prefix: config.projectName ? `${config.projectName}_` : '',
      })
    }
  }

  makeCounter<T extends string = ''>({
    name,
    labels,
    help,
    unit,
    prefix,
  }: {
    name: MetricName
    help?: string
    labels?: T[]
    unit?: string
    prefix?: string
  }): Counter<T> {
    const {metricName, metricHelp} = this.getMetricStrings({
      name,
      prefix,
      unit,
      help,
    })

    const metricNameTotal = `${metricName}_total`
    let metric = this.counterMetrics.get(metricNameTotal)

    if (metric === undefined) {
      metric = new Counter({
        name: metricNameTotal,
        help: metricHelp,
        labelNames: labels || [],
        registers: [this.register],
      })
      this.counterMetrics.set(metricNameTotal, metric)
    }

    return metric
  }

  makeGauge<T extends string = ''>({
    name,
    help,
    labels,
    unit,
    prefix,
  }: {
    name: MetricName
    help?: string
    labels?: T[]
    unit?: string
    prefix?: string
  }): Gauge<T> {
    const {metricName, metricHelp} = this.getMetricStrings({
      name,
      prefix,
      unit,
      help,
    })

    let metric = this.gaugeMetrics.get(metricName)

    if (metric === undefined) {
      metric = new Gauge({
        name: metricName,
        help: metricHelp,
        labelNames: labels || [],
        registers: [this.register],
      })
      this.gaugeMetrics.set(metricName, metric)
    }

    return metric
  }

  makeHistogram<T extends string = ''>({
    name,
    help,
    buckets,
    labels,
    unit,
    prefix,
  }: {
    name: MetricName
    help?: string
    buckets: Buckets
    labels?: T[]
    unit?: string
    prefix?: string
  }): Histogram<T> {
    const {metricName, metricHelp} = this.getMetricStrings({
      name,
      prefix,
      unit,
      help,
    })

    let metric = this.histogramMetrics.get(metricName)

    if (metric === undefined) {
      metric = new Histogram({
        name: metricName,
        help: metricHelp,
        labelNames: labels || [],
        buckets: buckets.getValues(),
        registers: [this.register],
      })
      this.histogramMetrics.set(metricName, metric)
    }

    return metric
  }

  makeSummary<T extends string = ''>({
    name,
    help,
    labels,
    unit,
    prefix,
  }: {
    name: MetricName
    help?: string
    labels?: T[]
    unit?: string
    prefix?: string
  }): Summary<T> {
    const {metricName, metricHelp} = this.getMetricStrings({
      name,
      prefix,
      unit,
      help,
    })

    let metric = this.summaryMetrics.get(metricName)

    if (metric === undefined) {
      metric = new Summary({
        name: metricName,
        help: metricHelp,
        labelNames: labels || [],
        percentiles: [],
        registers: [this.register],
      })
      this.summaryMetrics.set(metricName, metric)
    }

    return metric
  }

  createLatency<T extends string>({
    name,
    help,
    buckets,
    labels,
    unit,
    prefix,
  }: {
    name: string
    help: string
    buckets: Buckets
    labels: T[]
    unit?: string
    prefix?: string
  }) {
    const counter = this.makeCounter({
      name: name,
      help: help,
      labels,
      prefix,
    })

    const histogram = this.makeHistogram({
      name: name,
      help: help,
      buckets: buckets,
      labels,
      unit,
      prefix,
    })

    return new Latency(counter, histogram)
  }

  makeLatency<T extends string = ''>(param: {
    counter: Counter<T>
    histogram: Histogram<T>
  }): Latency<T> {
    return new Latency(param.counter, param.histogram)
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics()
  }

  private getMetricNameWithPrefix(name: string): string {
    const prefix = this.config.projectName
    if (this.config.projectName && !name.startsWith(`${prefix}_`)) {
      return `${prefix}_${name}`
    }

    return `${name}`
  }

  private getMetricStrings({
    help,
    name,
    prefix,
    unit,
  }: {
    help?: string
    name: string
    prefix?: string
    unit?: string
  }) {
    const metricHelp = help || name
    let metricName: string
    let metricNameWithoutUnit: string

    if (prefix) {
      metricName = `${prefix}_${name}`
      metricNameWithoutUnit = `${prefix}_${name}`
    } else {
      metricName = name
      metricNameWithoutUnit = name
    }

    if (unit) {
      metricName = `${metricName}_${unit}`
    }

    return {
      metricHelp,
      metricName: this.getMetricNameWithPrefix(metricName),
      metricNameWithoutUnit: this.getMetricNameWithPrefix(
        metricNameWithoutUnit,
      ),
    }
  }
}
