import {describe, expect, test} from 'vitest'
import {shouldNotBeNegative} from './should-not-be-negative.js'

describe('shouldBePositive validator', () => {
  test('should throw error because value is negative', () => {
    expect(() => shouldNotBeNegative(-1)).toThrow()
  })

  test('should not throw error because value is positive or zero', () => {
    expect(() => shouldNotBeNegative(1)).not.toThrow()
    expect(() => shouldNotBeNegative(0)).not.toThrow()
  })
})
