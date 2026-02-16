import type {Type} from '@nestjs/common'

export interface MetricsRegistryInterface {
  getMetrics(): Promise<string>
}

export type Params = {
  imports?: Type[]
  inject?: Type[]
  useMetrics(...args: unknown[]): Promise<MetricsRegistryInterface>
}
