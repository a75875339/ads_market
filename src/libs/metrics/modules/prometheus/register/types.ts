import {Counter, Gauge, Histogram, type LabelValues, Summary} from 'prom-client'

export type MetricName = string
export type MetricValue = number
export type MetricsPrometheusLabelName = string
export type MetricsPrometheusLabelValue = string | number

export interface MetricsRegistryPrometheusServiceConfig {
  projectName?: string
  defaultLabels?: LabelValues<string>
  enableDefaultMetrics?: boolean
}

export type CounterMetric<T extends string> = Counter<T>
export type GaugeMetric<T extends string> = Gauge<T>
export type HistogramMetric<T extends string> = Histogram<T>
export type SummaryMetric<T extends string> = Summary<T>
