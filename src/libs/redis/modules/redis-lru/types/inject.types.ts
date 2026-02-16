import type {DynamicModule, Type} from '@nestjs/common'
import type {IRedisLRUOptions} from '../../../core/index.js'
import type {Inject} from '../../redis/types/index.js'

export type RegisterParams<T extends Inject> = {
  imports: Type[] | DynamicModule[] | Promise<DynamicModule>[]
  inject?: T
  config: IRedisLRUOptions
}
