import {Duration} from '../../domain/index.js'

export interface RedlockOptions {
  lockTtl: Duration
  silent: boolean
  retryCount: number
  retryDelay: Duration
}
