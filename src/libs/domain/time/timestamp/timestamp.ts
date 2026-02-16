import {HASH_METHOD} from '../../common/index.js'
import {RoundMode} from '../../common/types/number.js'
import {Duration} from '../duration/duration.js'

export class Timestamp {
  private readonly duration: Duration

  private constructor(duration: Duration) {
    this.duration = duration
  }

  static fromDate(date: Date): Timestamp {
    const timestamp = date.getTime()

    return new Timestamp(Duration.fromMilliseconds(timestamp))
  }

  static fromSeconds(sec: number): Timestamp {
    return new Timestamp(Duration.fromSeconds(sec))
  }

  static fromMilliseconds(ms: number): Timestamp {
    return new Timestamp(Duration.fromMilliseconds(ms))
  }

  static now(): Timestamp {
    return Timestamp.fromMilliseconds(Date.now())
  }

  toSeconds(round: RoundMode = RoundMode.No): number {
    return this.duration.toSeconds(round)
  }

  toMilliseconds(): number {
    return this.duration.toMilliseconds()
  }

  toDate(): Date {
    return new Date(this.duration.toMilliseconds())
  }

  toString(): string {
    return this.duration.toString()
  }

  toJSON(): number {
    return this.toMilliseconds()
  }

  add(value: Duration): Timestamp {
    return Timestamp.fromMilliseconds(this._add(value).toMilliseconds())
  }

  sub(value: Timestamp): Duration

  sub(value: Duration): Timestamp

  sub(value: Timestamp | Duration): Timestamp | Duration {
    if (value instanceof Duration) {
      return Timestamp.fromMilliseconds(this._sub(value).toMilliseconds())
    }

    return this._sub(Duration.fromMilliseconds(value.toMilliseconds()))
  }

  isAfter(value: Timestamp | Date): boolean {
    const valueTimestamp =
      value instanceof Date ? Timestamp.fromDate(value) : value

    return this.duration.toMilliseconds() > valueTimestamp.toMilliseconds()
  }

  isBefore(value: Timestamp | Date): boolean {
    const valueTimestamp =
      value instanceof Date ? Timestamp.fromDate(value) : value

    return this.duration.toMilliseconds() < valueTimestamp.toMilliseconds()
  }

  [HASH_METHOD](): string {
    return this.duration[HASH_METHOD]()
  }

  private _add(value: Duration): Duration {
    return this.duration.add(value)
  }

  private _sub(value: Duration): Duration {
    return this.duration.sub(value)
  }
}
