import {describe, expect, it} from 'vitest'
import {setValue} from './set-value.js'

describe('SetValue', () => {
  it('Should set value for empty object', () => {
    const obj = {}
    setValue(obj, ['test'], 1)
    setValue(obj, ['field'], 2)
    setValue(obj, ['0'], 3)
    setValue(obj, ['field'], 4)

    expect(obj).toEqual({
      test: 1,
      field: 4,
      0: 3,
    })
  })

  it('Should set deep value for empty object', () => {
    const obj = {}
    setValue(obj, ['test', 'deep', 'prop'], 1)

    expect(obj).toEqual({
      test: {
        deep: {
          prop: 1,
        },
      },
    })
  })
})
