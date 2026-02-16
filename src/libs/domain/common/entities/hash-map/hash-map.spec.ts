import {describe, expect, it} from 'vitest'
import {HASH_METHOD} from './constants.js'
import {HashMap} from './hash-map.js'

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

describe('HashMap ', () => {
  it('Should use hash for storing objects', () => {
    const map = new Map<Address, number>()
    const hashMap = new HashMap<Address, number>()

    const addressA1 = new Address('A')
    const addressA2 = new Address('A')
    const addressB = new Address('B')

    map.set(addressA1, 1)
    hashMap.set(addressA1, 1)

    expect(map.has(addressA1)).toBe(true)
    expect(map.has(addressA2)).toBe(false)

    expect(hashMap.has(addressA1)).toBe(true)
    expect(hashMap.has(addressA2)).toBe(true)

    map.set(addressA2, 2)
    hashMap.set(addressA2, 2)

    expect(map.has(addressA1)).toBe(true)
    expect(map.has(addressA2)).toBe(true)
    expect(map.size).toBe(2)
    expect(map.get(addressA1)).toBe(1)
    expect(map.get(addressA2)).toBe(2)

    expect(hashMap.has(addressA1)).toBe(true)
    expect(hashMap.has(addressA2)).toBe(true)
    expect(hashMap.size).toBe(1)
    expect(hashMap.get(addressA1)).toBe(2)
    expect(hashMap.get(addressA2)).toBe(2)

    map.set(addressB, 3)
    hashMap.set(addressB, 3)

    expect(map.has(addressB)).toBe(true)
    expect(map.size).toBe(3)
    expect(map.get(addressB)).toBe(3)

    expect(hashMap.has(addressB)).toBe(true)
    expect(hashMap.size).toBe(2)
    expect(hashMap.get(addressB)).toBe(3)
  })

  it('should stringify with JSON.stringify', () => {
    const hashMap = new HashMap<Address, Address>()

    expect(JSON.stringify(hashMap)).toBe('{}')

    const addressA = new Address('A')
    const addressB = new Address('B')

    hashMap.set(addressA, addressB)

    expect(JSON.stringify(hashMap)).toBe('{"A":"B"}')
  })

  it('Should create correct map with init values', () => {
    const addressA = new Address('A')
    const addressB = new Address('B')

    const hashMap = new HashMap<Address, Address>([[addressA, addressB]])

    expect(hashMap.size).toBe(1)
    expect(JSON.stringify(hashMap)).toBe('{"A":"B"}')
  })

  it('Should correct .groupBy', () => {
    const addresses = [new Address('a'), new Address('b'), new Address('0x123')]
    const map = HashMap.groupBy(addresses, (a) =>
      a.isValid() ? 'valid' : 'invalid',
    )

    expect(map.get('valid')).toEqual([new Address('0x123')])
    expect(map.get('invalid')).toEqual([new Address('a'), new Address('b')])

    // @ts-expect-error only correct keys can be looked up
    map.get('unknown_key')
  })
})
