import client from 'prom-client'

export class Buckets {
  constructor(protected values: number[]) {
    if (this.isEmpty()) {
      throw new Error('Buckets must have at least one value')
    }
  }

  getValues(): number[] {
    return this.values
  }

  isEmpty(): boolean {
    return this.values.length === 0
  }
}

export class LinearBuckets extends Buckets {
  constructor(params: {start: number; width: number; count: number}) {
    super(client.linearBuckets(params.start, params.width, params.count))
  }
}

export class ExponentialBuckets extends Buckets {
  constructor(params: {start: number; width: number; count: number}) {
    super(client.exponentialBuckets(params.start, params.width, params.count))
  }
}
