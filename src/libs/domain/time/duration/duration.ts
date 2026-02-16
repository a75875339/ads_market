import msLibrary, {
  type StringValue as MsStringValue,
} from '../../../ms/index.js'
import {DomainError, HASH_METHOD} from '../../common/index.js'
import {RoundMode} from '../../common/types/number.js'
import {
  shouldNotBeNaN,
  shouldNotBeNegative,
} from '../../common/validators/index.js'
import {DURATION_FIXED_DEFAULT} from './constants.js'

export class Duration {
  private readonly milliseconds: number

  private constructor(milliseconds: number, name = 'value') {
    this.milliseconds = milliseconds

    shouldNotBeNegative(this.milliseconds, name)
    shouldNotBeNaN(this.milliseconds, name)
  }

  static fromSeconds(sec: number): Duration {
    return new Duration(sec * 1000)
  }

  static fromMilliseconds(ms: number): Duration {
    return new Duration(ms)
  }

  static fromFormat(format: string): Duration {
    const isNumber = !Number.isNaN(Number(format))

    if (isNumber) {
      throw new DomainError('format is not valid')
    }

    return new Duration(msLibrary(format as MsStringValue))
  }

  toSeconds(round: RoundMode = RoundMode.No): number {
    const seconds = this.milliseconds / 1000

    switch (round) {
      case RoundMode.Down:
        return Math.floor(seconds)
      case RoundMode.Up:
        return Math.ceil(seconds)
      case RoundMode.Round:
        return Math.round(seconds)
      default:
        return seconds
    }
  }

  toMilliseconds(): number {
    return this.milliseconds
  }

  toString(): string {
    const sec = this.milliseconds / 1000
    const fractional = this.getFractional(sec, DURATION_FIXED_DEFAULT)

    if (fractional > 0 && sec) return `${sec.toFixed(DURATION_FIXED_DEFAULT)}s`

    return `${sec}s`
  }

  toJSON(): number {
    return this.toMilliseconds()
  }

  add(value: Duration): Duration {
    return Duration.fromMilliseconds(this.milliseconds + value.toMilliseconds())
  }

  sub(value: Duration): Duration {
    return Duration.fromMilliseconds(this.milliseconds - value.toMilliseconds())
  }

  mul(value: number): Duration {
    return Duration.fromMilliseconds(this.milliseconds * value)
  }

  div(value: number): Duration {
    return Duration.fromMilliseconds(this.milliseconds / value)
  }

  lessThan(other: Duration): boolean {
    return this.toMilliseconds() < other.toMilliseconds()
  }

  lessThanOrEqual(other: Duration): boolean {
    return this.toMilliseconds() <= other.toMilliseconds()
  }

  greaterThan(other: Duration): boolean {
    return this.toMilliseconds() > other.toMilliseconds()
  }

  greaterThanOrEqual(other: Duration): boolean {
    return this.toMilliseconds() >= other.toMilliseconds()
  }

  equals(other: Duration): boolean {
    return this.toMilliseconds() === other.toMilliseconds()
  }

  [HASH_METHOD](): string {
    return this.milliseconds.toString()
  }

  private getFractional(value: number, fixed: number): number {
    return Math.floor((value % 1) * 10 ** fixed)
  }
}
