import {beforeEach, describe, expect, test} from 'vitest'
import {MetricsRegistryPrometheusService} from '../../register/metrics-registry.prometheus.service.js'
import type {MetricsRegistryPrometheusServiceConfig} from '../../register/types.js'

describe('PrometheusGauge', () => {
  const config: MetricsRegistryPrometheusServiceConfig = {
    projectName: 'prefix',
    defaultLabels: {},
  }

  let client!: MetricsRegistryPrometheusService

  beforeEach(() => {
    client = new MetricsRegistryPrometheusService(config)
  })

  describe('should collect gauge metrics', () => {
    test('should collect gauge with custom value for one metrics without labels', async () => {
      const gauge = client.makeGauge({name: 'my_gauge'})
      let expected = ''
      expected += '# HELP prefix_my_gauge my_gauge\n'
      expected += '# TYPE prefix_my_gauge gauge\n'
      expected += 'prefix_my_gauge 3\n'

      gauge.set(1)
      gauge.set(2)
      gauge.set(3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect gauge with custom value for one metrics and one label', async () => {
      const gauge = client.makeGauge({
        name: 'my_gauge',
        labels: ['gauge_label'],
      })

      let expected = ''
      expected += '# HELP prefix_my_gauge my_gauge\n'
      expected += '# TYPE prefix_my_gauge gauge\n'
      expected += 'prefix_my_gauge{gauge_label="gauge_label_value_1"} 3\n'

      gauge.set({gauge_label: 'gauge_label_value_1'}, 1)
      gauge.set({gauge_label: 'gauge_label_value_1'}, 2)
      gauge.set({gauge_label: 'gauge_label_value_1'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect gauge for one metrics with one label and several custom values', async () => {
      const gauge = client.makeGauge({
        name: 'my_gauge',
        labels: ['gauge_label'],
      })

      let expected = ''
      expected += '# HELP prefix_my_gauge my_gauge\n'
      expected += '# TYPE prefix_my_gauge gauge\n'
      expected += 'prefix_my_gauge{gauge_label="gauge_label_value_1"} 2\n'
      expected += 'prefix_my_gauge{gauge_label="gauge_label_value_2"} 3\n'

      gauge.set({gauge_label: 'gauge_label_value_1'}, 1)
      gauge.set({gauge_label: 'gauge_label_value_1'}, 2)
      gauge.set({gauge_label: 'gauge_label_value_2'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect gauge with several labels', async () => {
      const gauge = client.makeGauge({
        name: 'my_gauge',
        labels: ['gauge_label_1', 'gauge_label_2', 'gauge_label_3'],
      })

      let expected = ''
      expected += '# HELP prefix_my_gauge my_gauge\n'
      expected += '# TYPE prefix_my_gauge gauge\n'
      expected += 'prefix_my_gauge{gauge_label_1="gauge_label_value_1"} 1\n'
      expected += 'prefix_my_gauge{gauge_label_2="gauge_label_value_2"} 2\n'
      expected += 'prefix_my_gauge{gauge_label_3="gauge_label_value_3"} 3\n'

      gauge.set({gauge_label_1: 'gauge_label_value_1'}, 1)
      gauge.set({gauge_label_2: 'gauge_label_value_2'}, 2)
      gauge.set({gauge_label_3: 'gauge_label_value_3'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect gauge with multi labels for one metrics', async () => {
      const gauge = client.makeGauge({
        name: 'my_gauge',
        labels: ['gauge_label_1', 'gauge_label_2', 'gauge_label_3'],
      })

      let expected = ''
      expected += '# HELP prefix_my_gauge my_gauge\n'
      expected += '# TYPE prefix_my_gauge gauge\n'
      expected += 'prefix_my_gauge{gauge_label_1="gauge_label_1_value_1"} 3\n'
      expected +=
        'prefix_my_gauge{gauge_label_1="gauge_label_1_value_1",gauge_label_2="gauge_label_2_value_1"} 1\n'
      expected +=
        'prefix_my_gauge{gauge_label_1="gauge_label_1_value_1",gauge_label_2="gauge_label_2_value_1",gauge_label_3="gauge_label_3_value_1"} 1\n'

      gauge.set({gauge_label_1: 'gauge_label_1_value_1'}, 3)
      gauge.set(
        {
          gauge_label_1: 'gauge_label_1_value_1',
          gauge_label_2: 'gauge_label_2_value_1',
        },
        1,
      )
      gauge.set(
        {
          gauge_label_1: 'gauge_label_1_value_1',
          gauge_label_2: 'gauge_label_2_value_1',
          gauge_label_3: 'gauge_label_3_value_1',
        },
        2,
      )
      gauge.set(
        {
          gauge_label_1: 'gauge_label_1_value_1',
          gauge_label_2: 'gauge_label_2_value_1',
          gauge_label_3: 'gauge_label_3_value_1',
        },
        1,
      )

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should increase gauge value', async () => {
      const gauge = client.makeGauge({name: 'my_gauge'})

      let expected = ''
      expected += '# HELP prefix_my_gauge my_gauge\n'
      expected += '# TYPE prefix_my_gauge gauge\n'
      let expected2 = expected
      expected += 'prefix_my_gauge 1\n'

      gauge.inc()

      expect(await client.getMetrics()).toEqual(expected)

      expected2 += 'prefix_my_gauge 4\n'

      gauge.inc()
      gauge.inc(2)

      expect(await client.getMetrics()).toEqual(expected2)
    })

    test('should decrease gauge value', async () => {
      const gauge = client.makeGauge({name: 'my_gauge'})

      let expected = ''
      expected += '# HELP prefix_my_gauge my_gauge\n'
      expected += '# TYPE prefix_my_gauge gauge\n'
      let expected2 = expected
      expected += 'prefix_my_gauge 9\n'

      gauge.set(10)
      gauge.dec()

      expect(await client.getMetrics()).toEqual(expected)

      expected2 += 'prefix_my_gauge 6\n'

      gauge.dec()
      gauge.dec(2)

      expect(await client.getMetrics()).toEqual(expected2)
    })
  })
})
