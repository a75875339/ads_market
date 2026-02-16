import {SetMetadata} from '@nestjs/common'
import {Duration} from '../../../libs/domain/index.js'
import {INTERVAL_DECORATOR_METADATA_KEY} from './metadata.keys.js'

export function Interval(interval: Duration): MethodDecorator {
  return SetMetadata(INTERVAL_DECORATOR_METADATA_KEY, interval)
}
