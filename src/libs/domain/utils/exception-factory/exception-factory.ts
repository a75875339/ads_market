import type {Constructor} from './types.js'

export function createErrorClass<
  T extends Error,
  Args extends unknown[] = unknown[],
  BaseClass extends Constructor<T, Args> = Constructor<T, Args>,
>(name: string, Base?: BaseClass | ErrorConstructor): ErrorConstructor {
  if (!Base) {
    // @ts-expect-error
    return class extends Error {
      constructor(message?: string, options?: ErrorOptions) {
        super(message, options)
        this.name = name
      }
    }
  }

  // @ts-expect-error
  return class extends Base {
    constructor(message?: string, options?: ErrorOptions) {
      super(message, options)
      // @ts-expect-error
      this.name = name
    }
  }
}
