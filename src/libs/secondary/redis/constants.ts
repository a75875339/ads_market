import {Duration} from '../../domain/index.js'
import type {RedlockOptions} from './types.js'

export const defaultRedlockOptions: RedlockOptions = {
  // 15 minutes
  lockTtl: Duration.fromSeconds(15 * 60),
  silent: false,
  retryCount: 120,
  retryDelay: Duration.fromFormat('100ms'),
}
