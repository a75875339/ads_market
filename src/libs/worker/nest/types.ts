import type {Type} from '@nestjs/common'
import type {ILogger} from '../../logger/index.js'
import type {IMetrics} from '../core/index.js'

type Instance<T> = T extends new (...args: unknown[]) => infer Val ? Val : never

export type RegisterParams<T extends Inject> = {
  imports?: Type[]
  injectLogger?: T
  injectMetrics?: T
  useLogger(...args: ArrayOfInstances<T>): Promise<ILogger> | ILogger
  useMetrics(...args: ArrayOfInstances<T>): Promise<IMetrics> | IMetrics
}

export type Inject = [Type] | [Type, Type] | [Type, Type, Type]
export type ArrayOfInstances<T> = T extends [infer A]
  ? [Instance<A>]
  : T extends [infer A, infer B]
    ? [Instance<A>, Instance<B>]
    : T extends [infer A, infer B, infer C]
      ? [Instance<A>, Instance<B>, Instance<C>]
      : never
