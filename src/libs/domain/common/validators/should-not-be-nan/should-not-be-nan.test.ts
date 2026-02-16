import {describe, expect, test} from 'vitest'
import {shouldNotBeNaN} from './should-not-be-nan.js'

describe('shouldNotBeNaN validator', () => {
  test('should throw error because value is NaN', () => {
    expect(() => shouldNotBeNaN(Number('some'))).toThrow()
  })

  test('should not throw error because value is number or zero', () => {
    const positive = 10
    const negative = -10
    const zero = 0
    expect(() => shouldNotBeNaN(positive)).not.toThrow()
    expect(() => shouldNotBeNaN(positive)).not.toThrow()
    expect(() => shouldNotBeNaN(zero)).not.toThrow()
    expect(() => shouldNotBeNaN(Number(`${positive}`))).not.toThrow()
    expect(() => shouldNotBeNaN(Number(`${negative}`))).not.toThrow()
    expect(() => shouldNotBeNaN(Number(`${zero}`))).not.toThrow()
  })
})
