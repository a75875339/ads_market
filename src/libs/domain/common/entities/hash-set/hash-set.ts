import type {Hashable} from '../hash-map/index.js'
import {HashMap} from '../hash-map/index.js'

export class HashSet<Value extends Hashable> {
  private readonly hashMap: HashMap<Value, undefined>

  constructor(values?: Readonly<Value[]>) {
    this.hashMap = new HashMap(values?.map((value) => [value, undefined]))
  }

  public get size(): number {
    return this.hashMap.size
  }

  public add(value: Value): HashSet<Value> {
    this.hashMap.set(value, undefined)

    return this
  }

  public has(value: Value): boolean {
    return this.hashMap.has(value)
  }

  public delete(value: Value): HashSet<Value> {
    this.hashMap.delete(value)

    return this
  }

  public values(): Value[] {
    return this.hashMap.keys()
  }

  public merge(other: HashSet<Value>): HashSet<Value> {
    other.values().forEach((value) => {
      this.add(value)
    })

    return this
  }

  public clone(): HashSet<Value> {
    return new HashSet<Value>().merge(this)
  }

  public toJSON(): Value[] {
    return this.values()
  }
}
