import {beforeEach, describe, expect, test} from 'vitest'
import {Buckets} from '../../buckets/buckets.js'
import {MetricsRegistryPrometheusService} from '../../register/metrics-registry.prometheus.service.js'
import type {MetricsRegistryPrometheusServiceConfig} from '../../register/types.js'

describe('PrometheusHistogram', (): void => {
  const config: MetricsRegistryPrometheusServiceConfig = {
    projectName: 'prefix',
    defaultLabels: {},
  }

  let client!: MetricsRegistryPrometheusService

  beforeEach(() => {
    client = new MetricsRegistryPrometheusService(config)
  })

  describe('should collect histogram metrics', () => {
    test('should collect histogram with default value', async () => {
      const histogram = client.makeHistogram({
        name: 'histogram',
        buckets: new Buckets([0, 10, 100]),
      })
      let expected = ''
      expected += '# HELP prefix_histogram histogram\n'
      expected += '# TYPE prefix_histogram histogram\n'
      expected += 'prefix_histogram_bucket{le="0"} 0\n'
      expected += 'prefix_histogram_bucket{le="10"} 3\n'
      expected += 'prefix_histogram_bucket{le="100"} 3\n'
      expected += 'prefix_histogram_bucket{le="+Inf"} 3\n'
      expected += 'prefix_histogram_sum 3\n'
      expected += 'prefix_histogram_count 3\n'

      histogram.observe(1)
      histogram.observe(1)
      histogram.observe(1)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect histogram with default value for one metrics and one label', async () => {
      const histogram = client.makeHistogram({
        name: 'histogram',
        labels: ['label'],
        buckets: new Buckets([0, 10, 100]),
      })
      let expected = ''
      expected += '# HELP prefix_histogram histogram\n'
      expected += '# TYPE prefix_histogram histogram\n'
      expected += 'prefix_histogram_bucket{le="0",label="label_value_1"} 0\n'
      expected += 'prefix_histogram_bucket{le="10",label="label_value_1"} 2\n'
      expected += 'prefix_histogram_bucket{le="100",label="label_value_1"} 2\n'
      expected += 'prefix_histogram_bucket{le="+Inf",label="label_value_1"} 2\n'
      expected += 'prefix_histogram_sum{label="label_value_1"} 2\n'
      expected += 'prefix_histogram_count{label="label_value_1"} 2\n'
      expected += 'prefix_histogram_bucket{le="0",label="label_value_2"} 0\n'
      expected += 'prefix_histogram_bucket{le="10",label="label_value_2"} 1\n'
      expected += 'prefix_histogram_bucket{le="100",label="label_value_2"} 1\n'
      expected += 'prefix_histogram_bucket{le="+Inf",label="label_value_2"} 1\n'
      expected += 'prefix_histogram_sum{label="label_value_2"} 1\n'
      expected += 'prefix_histogram_count{label="label_value_2"} 1\n'

      histogram.observe({label: 'label_value_1'}, 1)
      histogram.observe({label: 'label_value_1'}, 1)
      histogram.observe({label: 'label_value_2'}, 1)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect histogram with custom value for one metrics without labels', async () => {
      const histogram = client.makeHistogram({
        name: 'histogram',
        buckets: new Buckets([0, 10, 100]),
      })
      let expected = ''
      expected += '# HELP prefix_histogram histogram\n'
      expected += '# TYPE prefix_histogram histogram\n'
      expected += 'prefix_histogram_bucket{le="0"} 0\n'
      expected += 'prefix_histogram_bucket{le="10"} 2\n'
      expected += 'prefix_histogram_bucket{le="100"} 3\n'
      expected += 'prefix_histogram_bucket{le="+Inf"} 3\n'
      expected += 'prefix_histogram_sum 111\n'
      expected += 'prefix_histogram_count 3\n'

      histogram.observe(1)
      histogram.observe(10)
      histogram.observe(100)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect histogram with custom value for one metrics and one label', async () => {
      const histogram = client.makeHistogram({
        name: 'histogram',
        labels: ['label'],
        buckets: new Buckets([0, 10, 100]),
      })
      let expected = ''
      expected += '# HELP prefix_histogram histogram\n'
      expected += '# TYPE prefix_histogram histogram\n'
      expected += 'prefix_histogram_bucket{le="0",label="label_value_1"} 0\n'
      expected += 'prefix_histogram_bucket{le="10",label="label_value_1"} 3\n'
      expected += 'prefix_histogram_bucket{le="100",label="label_value_1"} 3\n'
      expected += 'prefix_histogram_bucket{le="+Inf",label="label_value_1"} 3\n'
      expected += 'prefix_histogram_sum{label="label_value_1"} 6\n'
      expected += 'prefix_histogram_count{label="label_value_1"} 3\n'

      histogram.observe({label: 'label_value_1'}, 1)
      histogram.observe({label: 'label_value_1'}, 2)
      histogram.observe({label: 'label_value_1'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect histogram for one metrics with one label and several custom values', async () => {
      const histogram = client.makeHistogram({
        name: 'histogram',
        labels: ['label'],
        buckets: new Buckets([0, 10, 100]),
      })
      let expected = ''
      expected += '# HELP prefix_histogram histogram\n'
      expected += '# TYPE prefix_histogram histogram\n'
      expected += 'prefix_histogram_bucket{le="0",label="label_value_1"} 0\n'
      expected += 'prefix_histogram_bucket{le="10",label="label_value_1"} 2\n'
      expected += 'prefix_histogram_bucket{le="100",label="label_value_1"} 2\n'
      expected += 'prefix_histogram_bucket{le="+Inf",label="label_value_1"} 2\n'
      expected += 'prefix_histogram_sum{label="label_value_1"} 3\n'
      expected += 'prefix_histogram_count{label="label_value_1"} 2\n'
      expected += 'prefix_histogram_bucket{le="0",label="label_value_2"} 0\n'
      expected += 'prefix_histogram_bucket{le="10",label="label_value_2"} 1\n'
      expected += 'prefix_histogram_bucket{le="100",label="label_value_2"} 1\n'
      expected += 'prefix_histogram_bucket{le="+Inf",label="label_value_2"} 1\n'
      expected += 'prefix_histogram_sum{label="label_value_2"} 3\n'
      expected += 'prefix_histogram_count{label="label_value_2"} 1\n'

      histogram.observe({label: 'label_value_1'}, 1)
      histogram.observe({label: 'label_value_1'}, 2)
      histogram.observe({label: 'label_value_2'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect histogram with several labels', async () => {
      const histogram = client.makeHistogram({
        name: 'histogram',
        labels: ['label_1', 'label_2', 'label_3'],
        buckets: new Buckets([0, 10, 100]),
      })

      let expected = ''
      expected += '# HELP prefix_histogram histogram\n'
      expected += '# TYPE prefix_histogram histogram\n'
      expected += 'prefix_histogram_bucket{le="0",label_1="label_value_1"} 0\n'
      expected += 'prefix_histogram_bucket{le="10",label_1="label_value_1"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="100",label_1="label_value_1"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="+Inf",label_1="label_value_1"} 1\n'
      expected += 'prefix_histogram_sum{label_1="label_value_1"} 1\n'
      expected += 'prefix_histogram_count{label_1="label_value_1"} 1\n'
      expected += 'prefix_histogram_bucket{le="0",label_2="label_value_2"} 0\n'
      expected += 'prefix_histogram_bucket{le="10",label_2="label_value_2"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="100",label_2="label_value_2"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="+Inf",label_2="label_value_2"} 1\n'
      expected += 'prefix_histogram_sum{label_2="label_value_2"} 2\n'
      expected += 'prefix_histogram_count{label_2="label_value_2"} 1\n'
      expected += 'prefix_histogram_bucket{le="0",label_3="label_value_3"} 0\n'
      expected += 'prefix_histogram_bucket{le="10",label_3="label_value_3"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="100",label_3="label_value_3"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="+Inf",label_3="label_value_3"} 1\n'
      expected += 'prefix_histogram_sum{label_3="label_value_3"} 3\n'
      expected += 'prefix_histogram_count{label_3="label_value_3"} 1\n'

      histogram.observe({label_1: 'label_value_1'}, 1)
      histogram.observe({label_2: 'label_value_2'}, 2)
      histogram.observe({label_3: 'label_value_3'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect histogram with multi labels for one metrics', async () => {
      const histogram = client.makeHistogram({
        name: 'histogram',
        labels: ['label_1', 'label_2', 'label_3'],
        buckets: new Buckets([0, 10, 100]),
      })
      let expected = ''
      expected += '# HELP prefix_histogram histogram\n'
      expected += '# TYPE prefix_histogram histogram\n'
      expected +=
        'prefix_histogram_bucket{le="0",label_1="label_1_value_1"} 0\n'
      expected +=
        'prefix_histogram_bucket{le="10",label_1="label_1_value_1"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="100",label_1="label_1_value_1"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="+Inf",label_1="label_1_value_1"} 1\n'
      expected += 'prefix_histogram_sum{label_1="label_1_value_1"} 3\n'
      expected += 'prefix_histogram_count{label_1="label_1_value_1"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="0",label_1="label_1_value_1",label_2="label_2_value_1"} 0\n'
      expected +=
        'prefix_histogram_bucket{le="10",label_1="label_1_value_1",label_2="label_2_value_1"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="100",label_1="label_1_value_1",label_2="label_2_value_1"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="+Inf",label_1="label_1_value_1",label_2="label_2_value_1"} 1\n'
      expected +=
        'prefix_histogram_sum{label_1="label_1_value_1",label_2="label_2_value_1"} 1\n'
      expected +=
        'prefix_histogram_count{label_1="label_1_value_1",label_2="label_2_value_1"} 1\n'
      expected +=
        'prefix_histogram_bucket{le="0",label_1="label_1_value_1",label_2="label_2_value_1",label_3="label_3_value_1"} 0\n'
      expected +=
        'prefix_histogram_bucket{le="10",label_1="label_1_value_1",label_2="label_2_value_1",label_3="label_3_value_1"} 2\n'
      expected +=
        'prefix_histogram_bucket{le="100",label_1="label_1_value_1",label_2="label_2_value_1",label_3="label_3_value_1"} 2\n'
      expected +=
        'prefix_histogram_bucket{le="+Inf",label_1="label_1_value_1",label_2="label_2_value_1",label_3="label_3_value_1"} 2\n'
      expected +=
        'prefix_histogram_sum{label_1="label_1_value_1",label_2="label_2_value_1",label_3="label_3_value_1"} 4\n'
      expected +=
        'prefix_histogram_count{label_1="label_1_value_1",label_2="label_2_value_1",label_3="label_3_value_1"} 2\n'

      histogram.observe({label_1: 'label_1_value_1'}, 3)
      histogram.observe(
        {
          label_1: 'label_1_value_1',
          label_2: 'label_2_value_1',
        },
        1,
      )
      histogram.observe(
        {
          label_1: 'label_1_value_1',
          label_2: 'label_2_value_1',
          label_3: 'label_3_value_1',
        },
        2,
      )
      histogram.observe(
        {
          label_1: 'label_1_value_1',
          label_2: 'label_2_value_1',
          label_3: 'label_3_value_1',
        },
        2,
      )

      expect(await client.getMetrics()).toEqual(expected)
    })
  })
})
