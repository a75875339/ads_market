import type {OnApplicationShutdown} from '@nestjs/common'
import {Injectable} from '@nestjs/common'
import {Redis} from 'ioredis'

@Injectable()
export class RedisClient extends Redis implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    this.disconnect()
  }
}
