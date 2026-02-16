import type {Type} from '@nestjs/common'
import {Duration} from '../../../../libs/domain/index.js'
import type {ILogger} from '../../../logger/index.js'

export interface IMetrics {
  registerWorkerLoopLatency(result: {
    name: string
    status: 'fail' | 'success'
    duration: Duration
  }): void
}

export interface ScheduleModuleOptions {
  cronJobs?: boolean
  intervals?: boolean
  timeouts?: boolean
}

export interface ScheduleModuleParams<T extends Inject> {
  imports?: Type[]
  injectLogger?: T
  injectMetrics?: T
  useLogger(...args: ArrayOfInstances<T>): Promise<ILogger> | ILogger
  useMetrics(...args: ArrayOfInstances<T>): Promise<IMetrics> | IMetrics
}

type Instance<T> = T extends new (...args: unknown[]) => infer Val ? Val : never

// biome-ignore lint/complexity/noBannedTypes: fuck
export type RegisterParams = {}

export type Inject = [Type] | [Type, Type] | [Type, Type, Type]
export type ArrayOfInstances<T> = T extends [infer A]
  ? [Instance<A>]
  : T extends [infer A, infer B]
    ? [Instance<A>, Instance<B>]
    : T extends [infer A, infer B, infer C]
      ? [Instance<A>, Instance<B>, Instance<C>]
      : never
