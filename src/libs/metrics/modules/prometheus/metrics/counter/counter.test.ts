import {beforeEach, describe, expect, test} from 'vitest'
import {MetricsRegistryPrometheusService} from '../../register/metrics-registry.prometheus.service.js'
import type {MetricsRegistryPrometheusServiceConfig} from '../../register/types.js'

describe('PrometheusCounter', () => {
  const config: MetricsRegistryPrometheusServiceConfig = {
    projectName: 'prefix',
    defaultLabels: {},
  }

  let client!: MetricsRegistryPrometheusService

  beforeEach(() => {
    client = new MetricsRegistryPrometheusService(config)
  })

  describe('should collect counter metrics', () => {
    test('should collect counter with default value', async () => {
      const counter = client.makeCounter({name: 'my_counter'})
      let expected = ''
      expected += '# HELP prefix_my_counter_total my_counter\n'
      expected += '# TYPE prefix_my_counter_total counter\n'
      expected += 'prefix_my_counter_total 3\n'

      counter.inc()
      counter.inc()
      counter.inc()

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect counter with default value for one metrics and one label', async () => {
      const counter = client.makeCounter({
        name: 'my_counter',
        labels: ['counter_label'],
      })
      let expected = ''
      expected += '# HELP prefix_my_counter_total my_counter\n'
      expected += '# TYPE prefix_my_counter_total counter\n'
      expected +=
        'prefix_my_counter_total{counter_label="counter_label_value_1"} 2\n'
      expected +=
        'prefix_my_counter_total{counter_label="counter_label_value_2"} 1\n'

      counter.labels({counter_label: 'counter_label_value_1'}).inc()
      counter.labels({counter_label: 'counter_label_value_1'}).inc()
      counter.labels({counter_label: 'counter_label_value_2'}).inc()

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect counter with custom value for one metrics without labels', async () => {
      const counter = client.makeCounter({name: 'my_counter'})
      let expected = ''
      expected += '# HELP prefix_my_counter_total my_counter\n'
      expected += '# TYPE prefix_my_counter_total counter\n'
      expected += 'prefix_my_counter_total 6\n'

      counter.inc(1)
      counter.inc(2)
      counter.inc(3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect counter with custom value for one metrics and one label', async () => {
      const counter = client.makeCounter({
        name: 'my_counter',
        labels: ['counter_label'],
      })
      let expected = ''
      expected += '# HELP prefix_my_counter_total my_counter\n'
      expected += '# TYPE prefix_my_counter_total counter\n'
      expected +=
        'prefix_my_counter_total{counter_label="counter_label_value_1"} 6\n'

      counter.inc({counter_label: 'counter_label_value_1'}, 1)
      counter.inc({counter_label: 'counter_label_value_1'}, 2)
      counter.inc({counter_label: 'counter_label_value_1'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect counter for one metrics with one label and several custom values', async () => {
      const counter = client.makeCounter({
        name: 'my_counter',
        labels: ['counter_label'],
      })
      let expected = ''
      expected += '# HELP prefix_my_counter_total my_counter\n'
      expected += '# TYPE prefix_my_counter_total counter\n'
      expected +=
        'prefix_my_counter_total{counter_label="counter_label_value_1"} 3\n'
      expected +=
        'prefix_my_counter_total{counter_label="counter_label_value_2"} 3\n'

      counter.inc({counter_label: 'counter_label_value_1'}, 1)
      counter.inc({counter_label: 'counter_label_value_1'}, 2)
      counter.inc({counter_label: 'counter_label_value_2'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect counter with several labels', async () => {
      const counter = client.makeCounter({
        name: 'my_counter',
        labels: ['counter_label_1', 'counter_label_2', 'counter_label_3'],
      })
      let expected = ''
      expected += '# HELP prefix_my_counter_total my_counter\n'
      expected += '# TYPE prefix_my_counter_total counter\n'
      expected +=
        'prefix_my_counter_total{counter_label_1="counter_label_value_1"} 1\n'
      expected +=
        'prefix_my_counter_total{counter_label_2="counter_label_value_2"} 2\n'
      expected +=
        'prefix_my_counter_total{counter_label_3="counter_label_value_3"} 3\n'

      counter.inc({counter_label_1: 'counter_label_value_1'}, 1)
      counter.inc({counter_label_2: 'counter_label_value_2'}, 2)
      counter.inc({counter_label_3: 'counter_label_value_3'}, 3)

      expect(await client.getMetrics()).toEqual(expected)
    })

    test('should collect counter with multi labels for one metrics', async () => {
      const counter = client.makeCounter({
        name: 'my_counter',
        labels: ['counter_label_1', 'counter_label_2', 'counter_label_3'],
      })
      let expected = ''
      expected += '# HELP prefix_my_counter_total my_counter\n'
      expected += '# TYPE prefix_my_counter_total counter\n'
      expected +=
        'prefix_my_counter_total{counter_label_1="counter_label_1_value_1"} 3\n'
      expected +=
        'prefix_my_counter_total{counter_label_1="counter_label_1_value_1",counter_label_2="counter_label_2_value_1"} 1\n'
      expected +=
        'prefix_my_counter_total{counter_label_1="counter_label_1_value_1",counter_label_2="counter_label_2_value_1",counter_label_3="counter_label_3_value_1"} 4\n'
      counter.inc({counter_label_1: 'counter_label_1_value_1'}, 3)
      counter.inc(
        {
          counter_label_1: 'counter_label_1_value_1',
          counter_label_2: 'counter_label_2_value_1',
        },
        1,
      )
      counter.inc(
        {
          counter_label_1: 'counter_label_1_value_1',
          counter_label_2: 'counter_label_2_value_1',
          counter_label_3: 'counter_label_3_value_1',
        },
        2,
      )
      counter.inc(
        {
          counter_label_1: 'counter_label_1_value_1',
          counter_label_2: 'counter_label_2_value_1',
          counter_label_3: 'counter_label_3_value_1',
        },
        2,
      )

      expect(await client.getMetrics()).toEqual(expected)
    })
  })
})
