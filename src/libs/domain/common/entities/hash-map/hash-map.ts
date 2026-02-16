import {HASH_METHOD} from './constants.js'
import type {Hashable, HashValue} from './types.js'

export class HashMap<Key extends Hashable, Value = unknown> {
  private readonly map: Map<HashValue, [Key, Value]>

  constructor(entries?: Readonly<[Key, Value][]>) {
    this.map = new Map(entries?.map((d) => [this.getHash(d[0]), d]))
  }

  get size(): number {
    return this.map.size
  }

  /**
   * Inspired by https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy
   */
  static groupBy<T, Key extends Hashable>(
    arr: Iterable<T>,
    elementToKeyFn: (t: T) => Key,
  ): HashMap<Key, T[]> {
    const res = new HashMap<Key, T[]>()

    for (const val of arr) {
      const key = elementToKeyFn(val)

      const groupedArr = res.getOrDefault(key, [])

      groupedArr.push(val)

      res.set(key, groupedArr)
    }

    return res
  }

  public set(key: Key, value: Value): HashMap<Key, Value> {
    const hash = this.getHash(key)

    this.map.set(hash, [key, value])

    return this
  }

  public get(key: Key): Value | undefined {
    const hash = this.getHash(key)

    return this.map.get(hash)?.[1]
  }

  public getOrDefault(key: Key, defaultVal: Value): Value {
    return this.get(key) ?? defaultVal
  }

  public has(key: Key): boolean {
    const hash = this.getHash(key)

    return this.map.has(hash)
  }

  public delete(keyOrMap: Key | HashMap<Key, Value>): HashMap<Key, Value> {
    if (keyOrMap instanceof HashMap) {
      const keys = keyOrMap.keys()

      keys.forEach((k) => {
        this.delete(k)
      })

      return this
    }

    const hash = this.getHash(keyOrMap)

    this.map.delete(hash)

    return this
  }

  public entries(): [Key, Value][] {
    return [...this.map.values()]
  }

  public values(): Value[] {
    return this.entries().map(([, value]) => value)
  }

  public keys(): Key[] {
    return this.entries().map(([key]) => key)
  }

  /**
   * Merges passed hashmap into self
   */
  public merge(other: HashMap<Key, Value>): HashMap<Key, Value> {
    other.entries().forEach(([key, value]) => {
      this.set(key, value)
    })

    return this
  }

  public clone(): HashMap<Key, Value> {
    return new HashMap<Key, Value>().merge(this)
  }

  public toJSON(): Record<string, Value> {
    const entries = this.entries().map(
      ([key, val]) => [key.toString(), val] as const,
    )

    return Object.fromEntries(entries)
  }

  private getHash(key: Key): HashValue {
    if (typeof key === 'string' || typeof key === 'number') {
      return key
    }

    return key[HASH_METHOD]()
  }
}
