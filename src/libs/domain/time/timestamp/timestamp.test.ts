import {describe, expect, test} from 'vitest'
import {RoundMode} from '../../common/types/number.js'
import {Duration} from '../duration/duration.js'
import {Timestamp} from './timestamp.js'

describe('Timestamp', () => {
  test('should create from date', () => {
    const date = new Date()
    expect(Timestamp.fromDate(date).toDate()).toEqual(date)
  })

  test('should create from date', () => {
    const date = new Date()
    expect(Timestamp.fromDate(date).toDate()).toEqual(date)
  })

  test('should return valid seconds', () => {
    const date = new Date()

    expect(Timestamp.fromDate(date).toSeconds()).toEqual(date.getTime() / 1000)
    expect(Timestamp.fromDate(date).toSeconds(RoundMode.Down)).toEqual(
      Math.floor(date.getTime() / 1000),
    )
    expect(Timestamp.fromDate(date).toSeconds(RoundMode.Up)).toEqual(
      Math.ceil(date.getTime() / 1000),
    )
    expect(Timestamp.fromDate(date).toSeconds(RoundMode.Round)).toEqual(
      Math.round(date.getTime() / 1000),
    )
  })

  test('should return valid milliseconds', () => {
    const date = new Date()
    expect(Timestamp.fromDate(date).toMilliseconds()).toEqual(date.getTime())
  })

  test('should convert to valid json', () => {
    const json = {
      string: 'string',
      number: 'number',
    }
    const date = new Date()
    expect(
      JSON.stringify({
        ...json,
        timestamp: Timestamp.fromDate(date),
      }),
    ).toEqual(
      JSON.stringify({
        ...json,
        timestamp: date.getTime(),
      }),
    )
  })

  test('should execute valid add, sub operations', () => {
    const a = 2000
    const b = 1995
    const first = Timestamp.fromMilliseconds(a)
    const second = Timestamp.fromMilliseconds(b)
    const secondDuration = Duration.fromMilliseconds(b)

    expect(first.add(secondDuration).toMilliseconds()).toEqual(a + b)

    expect(first.sub(second).toMilliseconds()).toEqual(a - b)
    expect(first.sub(secondDuration).toMilliseconds()).toEqual(a - b)
  })

  test('should return valid after and before timestamp', () => {
    const date = new Date('2023-12-17T03:24:00')
    const beforeDate = new Date('2023-12-17T03:23:00')
    const afterDate = new Date('2023-12-17T03:25:00')

    expect(Timestamp.fromDate(date).isAfter(beforeDate)).toBe(true)
    expect(
      Timestamp.fromDate(date).isAfter(Timestamp.fromDate(beforeDate)),
    ).toBe(true)

    expect(Timestamp.fromDate(date).isBefore(afterDate)).toBe(true)
    expect(
      Timestamp.fromDate(date).isBefore(Timestamp.fromDate(afterDate)),
    ).toBe(true)

    expect(Timestamp.fromDate(date).isAfter(date)).toBe(false)
    expect(Timestamp.fromDate(date).isBefore(date)).toBe(false)
  })
})
