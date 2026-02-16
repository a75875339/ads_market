import {Injectable} from '@nestjs/common'
import type {IRedisLRUOptions} from '../../core/index.js'
import {RedisLru} from '../../core/index.js'
import {RedisClient} from '../redis/index.js'

@Injectable()
export class RedisLruService<T> extends RedisLru<T> {
  constructor(client: RedisClient, config: IRedisLRUOptions) {
    super(client, config)
  }
}
