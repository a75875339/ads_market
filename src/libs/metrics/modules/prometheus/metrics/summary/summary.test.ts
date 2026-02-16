import {beforeEach, describe, expect, test} from 'vitest'
import {MetricsRegistryPrometheusService} from '../../register/metrics-registry.prometheus.service.js'
import type {MetricsRegistryPrometheusServiceConfig} from '../../register/types.js'

describe('PrometheusSummary', () => {
  const config: MetricsRegistryPrometheusServiceConfig = {
    projectName: 'prefix',
    defaultLabels: {},
  }

  let client!: MetricsRegistryPrometheusService

  beforeEach(() => {
    client = new MetricsRegistryPrometheusService(config)
  })

  describe('should collect summary metrics', () => {
    test('should collect summary with default value', async () => {
      const summary = client.makeSummary({name: 'summary'})
      let expected = ''
      expected += '# HELP prefix_summary summary\n'
      expected += '# TYPE prefix_summary summary\n'
      expected += 'prefix_summary_sum 3\n'
      expected += 'prefix_summary_count 3\n'

      summary.observe(1)
      summary.observe(1)
      summary.observe(1)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect summary with default value for one metrics and one label', async () => {
      const summary = client.makeSummary({
        name: 'summary',
        labels: ['label'],
      })
      let expected = ''
      expected += '# HELP prefix_summary summary\n'
      expected += '# TYPE prefix_summary summary\n'
      expected += 'prefix_summary_sum{label="label_value_1"} 2\n'
      expected += 'prefix_summary_count{label="label_value_1"} 2\n'
      expected += 'prefix_summary_sum{label="label_value_2"} 1\n'
      expected += 'prefix_summary_count{label="label_value_2"} 1\n'

      summary.labels({label: 'label_value_1'}).observe(1)
      summary.labels({label: 'label_value_1'}).observe(1)
      summary.labels({label: 'label_value_2'}).observe(1)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect summary with custom value for one metrics without labels', async () => {
      const summary = client.makeSummary({name: 'summary'})

      let expected = ''
      expected += '# HELP prefix_summary summary\n'
      expected += '# TYPE prefix_summary summary\n'
      expected += 'prefix_summary_sum 6\n'
      expected += 'prefix_summary_count 3\n'

      summary.observe(1)
      summary.observe(2)
      summary.observe(3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect summary with custom value for one metrics and one label', async () => {
      const summary = client.makeSummary({
        name: 'summary',
        labels: ['label'],
      })

      let expected = ''
      expected += '# HELP prefix_summary summary\n'
      expected += '# TYPE prefix_summary summary\n'
      expected += 'prefix_summary_sum{label="label_value_1"} 6\n'
      expected += 'prefix_summary_count{label="label_value_1"} 3\n'

      summary.labels({label: 'label_value_1'}).observe(1)
      summary.labels({label: 'label_value_1'}).observe(2)
      summary.labels({label: 'label_value_1'}).observe(3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect summary for one metrics with one label and several custom values', async () => {
      const summary = client.makeSummary({
        name: 'summary',
        labels: ['label'],
      })

      let expected = ''
      expected += '# HELP prefix_summary summary\n'
      expected += '# TYPE prefix_summary summary\n'
      expected += 'prefix_summary_sum{label="label_value_1"} 3\n'
      expected += 'prefix_summary_count{label="label_value_1"} 2\n'
      expected += 'prefix_summary_sum{label="label_value_2"} 3\n'
      expected += 'prefix_summary_count{label="label_value_2"} 1\n'

      summary.observe({label: 'label_value_1'}, 1)
      summary.observe({label: 'label_value_1'}, 2)
      summary.observe({label: 'label_value_2'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect summary with several labels', async () => {
      const summary = client.makeSummary({
        name: 'summary',
        labels: ['label_1', 'label_2', 'label_3'],
      })

      let expected = ''
      expected += '# HELP prefix_summary summary\n'
      expected += '# TYPE prefix_summary summary\n'
      expected += 'prefix_summary_sum{label_1="label_value_1"} 1\n'
      expected += 'prefix_summary_count{label_1="label_value_1"} 1\n'
      expected += 'prefix_summary_sum{label_2="label_value_2"} 2\n'
      expected += 'prefix_summary_count{label_2="label_value_2"} 1\n'
      expected += 'prefix_summary_sum{label_3="label_value_3"} 3\n'
      expected += 'prefix_summary_count{label_3="label_value_3"} 1\n'

      summary.observe({label_1: 'label_value_1'}, 1)
      summary.observe({label_2: 'label_value_2'}, 2)
      summary.observe({label_3: 'label_value_3'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect summary with multi labels for one metrics', async () => {
      const summary = client.makeSummary({
        name: 'summary',
        labels: ['label_1', 'label_2', 'label_3'],
      })

      let expected = ''
      expected += '# HELP prefix_summary summary\n'
      expected += '# TYPE prefix_summary summary\n'

      expected += 'prefix_summary_sum{label_1="label_1_value_1"} 3\n'
      expected += 'prefix_summary_count{label_1="label_1_value_1"} 1\n'
      expected +=
        'prefix_summary_sum{label_1="label_1_value_1",label_2="label_2_value_1"} 1\n'
      expected +=
        'prefix_summary_count{label_1="label_1_value_1",label_2="label_2_value_1"} 1\n'
      expected +=
        'prefix_summary_sum{label_1="label_1_value_1",label_2="label_2_value_1",label_3="label_3_value_1"} 4\n'
      expected +=
        'prefix_summary_count{label_1="label_1_value_1",label_2="label_2_value_1",label_3="label_3_value_1"} 2\n'

      summary.observe({label_1: 'label_1_value_1'}, 3)
      summary.observe(
        {
          label_1: 'label_1_value_1',
          label_2: 'label_2_value_1',
        },
        1,
      )
      summary.observe(
        {
          label_1: 'label_1_value_1',
          label_2: 'label_2_value_1',
          label_3: 'label_3_value_1',
        },
        2,
      )
      summary.observe(
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
