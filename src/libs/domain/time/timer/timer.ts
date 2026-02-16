import * as process from 'node:process'
import {Duration} from '../duration/duration.js'

/**
 * Class for precise measuring of execution time of code path
 *
 * @example
 * const timer = new Timer()
 * // some code to measure
 * const duration = timer.elapsed()
 */
export class Timer {
  private readonly start = process.hrtime.bigint()

  public elapsed(): Duration {
    const durationNs = process.hrtime.bigint() - this.start

    return Duration.fromMilliseconds(Number(durationNs) / 1_000_000)
  }
}
