import {describe, expect, test} from 'vitest'
import {RoundMode} from '../../common/types/number.js'
import {Duration} from './duration.js'

describe('Duration domain', () => {
  const ms = 10_000_202
  const sec = 10_004

  test('should create and get valid milliseconds', () => {
    expect(Duration.fromMilliseconds(ms).toMilliseconds()).toEqual(ms)
  })

  test('should create and convert to valid seconds', () => {
    expect(Duration.fromMilliseconds(ms).toSeconds()).toEqual(ms / 1000)
    expect(Duration.fromMilliseconds(ms).toSeconds(RoundMode.Up)).toEqual(
      Math.ceil(ms / 1000),
    )
    expect(Duration.fromMilliseconds(ms).toSeconds(RoundMode.Down)).toEqual(
      Math.floor(ms / 1000),
    )
    expect(Duration.fromMilliseconds(ms).toSeconds(RoundMode.Round)).toEqual(
      Math.round(ms / 1000),
    )
  })

  test('should create from seconds', () => {
    expect(Duration.fromSeconds(sec).toMilliseconds()).toEqual(sec * 1000)
  })

  test('should convert to format string', () => {
    expect(Duration.fromMilliseconds(ms).toString()).toEqual(`${ms / 1000}s`)
  })

  test('should convert to valid json', () => {
    const json = {
      string: 'string',
      number: 'number',
    }
    expect(
      JSON.stringify({
        ...json,
        duration: Duration.fromSeconds(sec),
      }),
    ).toEqual(
      JSON.stringify({
        ...json,
        duration: sec * 1000,
      }),
    )
  })

  test('should execute valid add, sub, mul, div operations', () => {
    const a = 215
    const b = 100
    const first = Duration.fromMilliseconds(a)
    const second = b

    expect(
      first.add(Duration.fromMilliseconds(second)).toMilliseconds(),
    ).toEqual(a + b)

    expect(
      first.sub(Duration.fromMilliseconds(second)).toMilliseconds(),
    ).toEqual(a - b)

    expect(first.mul(second).toMilliseconds()).toEqual(a * b)

    expect(first.div(second).toMilliseconds()).toEqual(a / b)
  })

  test('should convert format ms string to duration', () => {
    expect(Duration.fromFormat('1d').toSeconds()).toEqual(24 * 60 * 60)
    expect(Duration.fromFormat('1s').toMilliseconds()).toEqual(1000)
  })
})
