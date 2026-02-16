// Types for the result object with discriminated union
type Success<T> = {
  data: T
  error: null
}

type Failure<E> = {
  data: null
  error: E
}

export type SimpleResult<T, E = Error> = Success<T> | Failure<E>

// Main wrapper function
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<SimpleResult<T, E>> {
  try {
    const data = await promise
    return {data, error: null}
  } catch (error) {
    return {data: null, error: error as E}
  }
}
