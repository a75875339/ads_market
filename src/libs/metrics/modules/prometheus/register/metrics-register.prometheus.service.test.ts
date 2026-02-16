import {beforeEach, describe, expect, test} from 'vitest'
import {Buckets} from '../buckets/buckets.js'
import {MetricsRegistryPrometheusService} from './metrics-registry.prometheus.service.js'
import type {MetricsRegistryPrometheusServiceConfig} from './types.js'

describe('PrometheusClient', () => {
  let register!: MetricsRegistryPrometheusService

  const config: MetricsRegistryPrometheusServiceConfig = {
    projectName: 'global_prefix',
    defaultLabels: {},
  }

  beforeEach(() => {
    register = new MetricsRegistryPrometheusService(config)
  })

  describe('should create counter', () => {
    test('should create counter with name', async () => {
      let expected = ''
      expected += '# HELP global_prefix_my_counter_total my_counter\n'
      expected += '# TYPE global_prefix_my_counter_total counter\n'
      expected += 'global_prefix_my_counter_total 0\n'

      expect(register.makeCounter({name: 'my_counter'})).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })

    test('should create counter with name and help', async () => {
      let expected = ''
      expected +=
        '# HELP global_prefix_my_counter_total my_counter help message\n'
      expected += '# TYPE global_prefix_my_counter_total counter\n'
      expected += 'global_prefix_my_counter_total 0\n'
      expect(
        register.makeCounter({
          name: 'my_counter',
          help: 'my_counter help message',
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })
  })

  describe('should create gauge', () => {
    test('should create gauge with name', async () => {
      let expected = ''
      expected += '# HELP global_prefix_my_gauge my_gauge\n'
      expected += '# TYPE global_prefix_my_gauge gauge\n'
      expected += 'global_prefix_my_gauge 0\n'

      expect(register.makeGauge({name: 'my_gauge'})).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })

    test('should create gauge with name and help', async () => {
      let expected = ''
      expected += '# HELP global_prefix_my_gauge my_gauge help message\n'
      expected += '# TYPE global_prefix_my_gauge gauge\n'
      expected += 'global_prefix_my_gauge 0\n'

      expect(
        register.makeGauge({name: 'my_gauge', help: 'my_gauge help message'}),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })
  })

  describe('should create summary', () => {
    test('should create gauge with name', async () => {
      let expected = ''
      expected += '# HELP global_prefix_my_summary my_summary\n'
      expected += '# TYPE global_prefix_my_summary summary\n'
      expected += 'global_prefix_my_summary_sum 0\n'
      expected += 'global_prefix_my_summary_count 0\n'

      expect(register.makeSummary({name: 'my_summary'})).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })

    test('should create summary with name and help', async () => {
      let expected = ''
      expected += '# HELP global_prefix_my_summary my_summary help message\n'
      expected += '# TYPE global_prefix_my_summary summary\n'
      expected += 'global_prefix_my_summary_sum 0\n'
      expected += 'global_prefix_my_summary_count 0\n'

      expect(
        register.makeSummary({
          name: 'my_summary',
          help: 'my_summary help message',
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })
  })

  describe('should create histogram', () => {
    test('should create gauge with name', async () => {
      let expected = ''
      expected += '# HELP global_prefix_my_histogram my_histogram\n'
      expected += '# TYPE global_prefix_my_histogram histogram\n'
      expected += 'global_prefix_my_histogram_bucket{le="0"} 0\n'
      expected += 'global_prefix_my_histogram_bucket{le="10"} 0\n'
      expected += 'global_prefix_my_histogram_bucket{le="100"} 0\n'
      expected += 'global_prefix_my_histogram_bucket{le="+Inf"} 0\n'
      expected += 'global_prefix_my_histogram_sum 0\n'
      expected += 'global_prefix_my_histogram_count 0\n'

      expect(
        register.makeHistogram({
          name: 'my_histogram',
          buckets: new Buckets([0, 10, 100]),
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })

    test('should create histogram with name and help', async () => {
      let expected = ''
      expected +=
        '# HELP global_prefix_my_histogram my_histogram help message\n'
      expected += '# TYPE global_prefix_my_histogram histogram\n'
      expected += 'global_prefix_my_histogram_bucket{le="0"} 0\n'
      expected += 'global_prefix_my_histogram_bucket{le="10"} 0\n'
      expected += 'global_prefix_my_histogram_bucket{le="100"} 0\n'
      expected += 'global_prefix_my_histogram_bucket{le="+Inf"} 0\n'
      expected += 'global_prefix_my_histogram_sum 0\n'
      expected += 'global_prefix_my_histogram_count 0\n'

      expect(
        register.makeHistogram({
          name: 'my_histogram',
          help: 'my_histogram help message',
          buckets: new Buckets([0, 10, 100]),
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })
  })

  describe('should create all metrics together', () => {
    test('should create all metrics together', async () => {
      let expected = ''

      expected +=
        '# HELP global_prefix_my_counter_total my_counter help message\n'
      expected += '# TYPE global_prefix_my_counter_total counter\n'
      expected += 'global_prefix_my_counter_total 0\n\n'

      expected += '# HELP global_prefix_my_gauge my_gauge help message\n'
      expected += '# TYPE global_prefix_my_gauge gauge\n'
      expected += 'global_prefix_my_gauge 0\n\n'

      expected += '# HELP global_prefix_my_summary my_summary help message\n'
      expected += '# TYPE global_prefix_my_summary summary\n'
      expected += 'global_prefix_my_summary_sum 0\n'
      expected += 'global_prefix_my_summary_count 0\n\n'

      expected +=
        '# HELP global_prefix_my_histogram my_histogram help message\n'
      expected += '# TYPE global_prefix_my_histogram histogram\n'
      expected += 'global_prefix_my_histogram_bucket{le="0"} 0\n'
      expected += 'global_prefix_my_histogram_bucket{le="10"} 0\n'
      expected += 'global_prefix_my_histogram_bucket{le="100"} 0\n'
      expected += 'global_prefix_my_histogram_bucket{le="+Inf"} 0\n'
      expected += 'global_prefix_my_histogram_sum 0\n'
      expected += 'global_prefix_my_histogram_count 0\n'

      expect(
        register.makeCounter({
          name: 'my_counter',
          help: 'my_counter help message',
        }),
      ).toBeDefined()
      expect(
        register.makeGauge({name: 'my_gauge', help: 'my_gauge help message'}),
      ).toBeDefined()
      expect(
        register.makeSummary({
          name: 'my_summary',
          help: 'my_summary help message',
        }),
      ).toBeDefined()
      expect(
        register.makeHistogram({
          name: 'my_histogram',
          help: 'my_histogram help message',
          buckets: new Buckets([0, 10, 100]),
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })
  })

  describe('should create with builder', () => {
    test('should create all with builder', async () => {
      let expected = ''

      expected += '# HELP global_prefix_my_counter_total my_counter\n'
      expected += '# TYPE global_prefix_my_counter_total counter\n'
      expected += 'global_prefix_my_counter_total 1\n\n'

      expected +=
        '# HELP global_prefix_my_counter_with_help_total my_counter help message\n'
      expected += '# TYPE global_prefix_my_counter_with_help_total counter\n'
      expected +=
        'global_prefix_my_counter_with_help_total{my_label="counter"} 2\n\n'

      expected += '# HELP global_prefix_my_gauge my_gauge\n'
      expected += '# TYPE global_prefix_my_gauge gauge\n'
      expected += 'global_prefix_my_gauge{my_label="gauge"} 10\n\n'

      expected +=
        '# HELP global_prefix_my_gauge_with_help my_gauge help message\n'
      expected += '# TYPE global_prefix_my_gauge_with_help gauge\n'
      expected += 'global_prefix_my_gauge_with_help{my_label="gauge"} 20\n\n'

      expected += '# HELP global_prefix_my_summary my_summary\n'
      expected += '# TYPE global_prefix_my_summary summary\n'
      expected += 'global_prefix_my_summary_sum{my_label="summary"} 70\n'
      expected += 'global_prefix_my_summary_count{my_label="summary"} 2\n\n'

      expected += '# HELP global_prefix_my_histogram my_histogram\n'
      expected += '# TYPE global_prefix_my_histogram histogram\n'
      expected +=
        'global_prefix_my_histogram_bucket{le="0",my_label="histogram"} 0\n'
      expected +=
        'global_prefix_my_histogram_bucket{le="10",my_label="histogram"} 0\n'
      expected +=
        'global_prefix_my_histogram_bucket{le="100",my_label="histogram"} 1\n'
      expected +=
        'global_prefix_my_histogram_bucket{le="+Inf",my_label="histogram"} 1\n'
      expected += 'global_prefix_my_histogram_sum{my_label="histogram"} 50\n'
      expected += 'global_prefix_my_histogram_count{my_label="histogram"} 1\n\n'

      expected +=
        '# HELP global_prefix_my_histogram_with_help histogram with help\n'
      expected += '# TYPE global_prefix_my_histogram_with_help histogram\n'
      expected +=
        'global_prefix_my_histogram_with_help_bucket{le="0",my_label="histogram"} 0\n'
      expected +=
        'global_prefix_my_histogram_with_help_bucket{le="10",my_label="histogram"} 0\n'
      expected +=
        'global_prefix_my_histogram_with_help_bucket{le="100",my_label="histogram"} 1\n'
      expected +=
        'global_prefix_my_histogram_with_help_bucket{le="+Inf",my_label="histogram"} 1\n'
      expected +=
        'global_prefix_my_histogram_with_help_sum{my_label="histogram"} 60\n'
      expected +=
        'global_prefix_my_histogram_with_help_count{my_label="histogram"} 1\n'

      register.makeCounter({name: 'my_counter'}).inc()
      register
        .makeCounter({
          name: 'my_counter_with_help',
          labels: ['my_label'],
          help: 'my_counter help message',
        })
        .inc({my_label: 'counter'}, 2)

      register
        .makeGauge({name: 'my_gauge', labels: ['my_label']})
        .set({my_label: 'gauge'}, 10)
      register
        .makeGauge({
          name: 'my_gauge_with_help',
          labels: ['my_label'],
          help: 'my_gauge help message',
        })
        .set({my_label: 'gauge'}, 20)

      register
        .makeSummary({name: 'my_summary', labels: ['my_label']})
        .observe({my_label: 'summary'}, 30)
      register
        .makeSummary({
          name: 'my_summary',
          labels: ['my_label'],
          help: 'my_summary with help',
        })
        .observe({my_label: 'summary'}, 40)

      register
        .makeHistogram({
          name: 'my_histogram',
          labels: ['my_label'],
          buckets: new Buckets([0, 10, 100]),
        })
        .observe({my_label: 'histogram'}, 50)
      register
        .makeHistogram({
          name: 'my_histogram_with_help',
          labels: ['my_label'],
          buckets: new Buckets([0, 10, 100]),
          help: 'histogram with help',
        })
        .observe({my_label: 'histogram'}, 60)

      expect(await register.getMetrics()).toEqual(expected)
    })

    test('should create latency with builder', async () => {
      let expected = ''

      expected +=
        '# HELP global_prefix_my_operation_prefix_my_operation_total my_operation help\n'
      expected +=
        '# TYPE global_prefix_my_operation_prefix_my_operation_total counter\n'
      expected +=
        'global_prefix_my_operation_prefix_my_operation_total{my_label="latency"} 1\n\n'
      expected +=
        '# HELP global_prefix_my_operation_prefix_my_operation_milliseconds my_operation help\n'
      expected +=
        '# TYPE global_prefix_my_operation_prefix_my_operation_milliseconds histogram\n'
      expected +=
        'global_prefix_my_operation_prefix_my_operation_milliseconds_bucket{le="0",my_label="latency"} 0\n'
      expected +=
        'global_prefix_my_operation_prefix_my_operation_milliseconds_bucket{le="10",my_label="latency"} 0\n'
      expected +=
        'global_prefix_my_operation_prefix_my_operation_milliseconds_bucket{le="100",my_label="latency"} 1\n'
      expected +=
        'global_prefix_my_operation_prefix_my_operation_milliseconds_bucket{le="+Inf",my_label="latency"} 1\n'
      expected +=
        'global_prefix_my_operation_prefix_my_operation_milliseconds_sum{my_label="latency"} 42\n'
      expected +=
        'global_prefix_my_operation_prefix_my_operation_milliseconds_count{my_label="latency"} 1\n'

      register
        .createLatency({
          name: 'my_operation',
          labels: ['my_label'],
          buckets: new Buckets([0, 10, 100]),
          help: 'my_operation help',
          unit: 'milliseconds',
          prefix: 'my_operation_prefix',
        })
        .observe({my_label: 'latency'}, 42)

      expect(await register.getMetrics()).toEqual(expected)
    })
  })

  describe('describe should create counter with builder with prefix and unit', () => {
    test('should create metrics with prefix and unit', async () => {
      let expected = ''

      expected +=
        '# HELP global_prefix_prefix_my_counter_seconds_total my_help\n'
      expected +=
        '# TYPE global_prefix_prefix_my_counter_seconds_total counter\n'
      expected += 'global_prefix_prefix_my_counter_seconds_total 0\n'

      expect(
        register.makeCounter({
          name: 'my_counter',
          help: 'my_help',
          unit: 'seconds',
          prefix: 'prefix',
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })

    test('should create metrics with prefix and without unit', async () => {
      let expected = ''

      expected += '# HELP global_prefix_prefix_my_counter_total my_help\n'
      expected += '# TYPE global_prefix_prefix_my_counter_total counter\n'
      expected += 'global_prefix_prefix_my_counter_total 0\n'

      expect(
        register.makeCounter({
          name: 'my_counter',
          help: 'my_help',
          prefix: 'prefix',
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })

    test('should create metrics without prefix and with unit', async () => {
      let expected = ''

      expected += '# HELP global_prefix_my_counter_seconds_total my_help\n'
      expected += '# TYPE global_prefix_my_counter_seconds_total counter\n'
      expected += 'global_prefix_my_counter_seconds_total 0\n'

      expect(
        register.makeCounter({
          name: 'my_counter',
          help: 'my_help',
          unit: 'seconds',
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })
  })

  describe('should create gauge with builder with prefix and unit', () => {
    test('should create metrics with prefix and unit', async () => {
      let expected = ''

      expected += '# HELP global_prefix_prefix_my_gauge_seconds my_help\n'
      expected += '# TYPE global_prefix_prefix_my_gauge_seconds gauge\n'
      expected += 'global_prefix_prefix_my_gauge_seconds 0\n'

      expect(
        register.makeGauge({
          name: 'my_gauge',
          help: 'my_help',
          unit: 'seconds',
          prefix: 'prefix',
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })

    test('should create metrics with prefix and without unit', async () => {
      let expected = ''

      expected += '# HELP global_prefix_prefix_my_gauge my_help\n'
      expected += '# TYPE global_prefix_prefix_my_gauge gauge\n'
      expected += 'global_prefix_prefix_my_gauge 0\n'

      expect(
        register.makeGauge({
          name: 'my_gauge',
          help: 'my_help',
          prefix: 'prefix',
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })

    test('should create metrics without prefix and with unit', async () => {
      let expected = ''

      expected += '# HELP global_prefix_my_gauge_seconds my_help\n'
      expected += '# TYPE global_prefix_my_gauge_seconds gauge\n'
      expected += 'global_prefix_my_gauge_seconds 0\n'

      expect(
        register.makeGauge({
          name: 'my_gauge',
          help: 'my_help',
          unit: 'seconds',
        }),
      ).toBeDefined()
      expect(await register.getMetrics()).toEqual(expected)
    })
  })
})
