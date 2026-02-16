import {describe, expect, test} from 'vitest'
import {HASH_METHOD} from '../hash-map/index.js'
import {HashSet} from './hash-set.js'

class Address {
  constructor(private readonly val: string) {}

  [HASH_METHOD](): string {
    return this.val
  }

  isValid(): boolean {
    return this.val.startsWith('0x')
  }

  toString(): string {
    return this.val
  }

  toJSON(): string {
    return this.val
  }
}

describe('HashSet ', () => {
  const addressA1 = new Address('A')
  const addressA2 = new Address('A')
  const addressB = new Address('B')

  test('Should use hash for storing objects', () => {
    const hashSet = new HashSet<Address>()

    hashSet.add(addressA1)
    hashSet.add(addressA2)
    hashSet.add(addressB)

    expect(hashSet.size).toEqual(2)
    expect(hashSet.has(addressA1)).toEqual(true)
    expect(hashSet.has(addressB)).toEqual(true)
  })

  test('Should create correct set with init values', () => {
    const hashSet = new HashSet<Address>([addressA1, addressA2, addressB])

    expect(hashSet.size).toEqual(2)
    expect(hashSet.has(addressA1)).toEqual(true)
    expect(hashSet.has(addressB)).toEqual(true)
  })

  test('Should stringify', () => {
    const hashSet = new HashSet<Address>([addressA1, addressA2, addressB])

    expect(JSON.stringify(hashSet)).toEqual('["A","B"]')
  })
})
