import type {Type} from '@nestjs/common'
import type {ILogger} from '../../../../logger/index.js'
import type {IRedisModuleOptions} from '../../../core/index.js'

type Instance<T> = T extends new (...args: any[]) => infer Val ? Val : never

export type Inject = [Type] | [Type, Type] | [Type, Type, Type]

export type RegisterParams<T extends Inject> = {
  imports?: Type[]
  injectLogger?: T
  inject?: T
  useLogger(...args: ArrayOfInstances<T>): Promise<ILogger> | ILogger
  useConfig(
    ...args: ArrayOfInstances<T>
  ): Promise<IRedisModuleOptions> | IRedisModuleOptions
}

export type ArrayOfInstances<T> = T extends [infer A]
  ? [Instance<A>]
  : T extends [infer A, infer B]
    ? [Instance<A>, Instance<B>]
    : T extends [infer A, infer B, infer C]
      ? [Instance<A>, Instance<B>, Instance<C>]
      : never
