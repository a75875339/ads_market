import {Injectable} from '@nestjs/common'
import {Redis} from '../../core/index.js'
import {RedisClient} from './redis-client.service.js'

@Injectable()
export class RedisManagerService extends Redis {
  constructor(client: RedisClient) {
    super(client)
  }
}
