import {err, ok, Result} from 'neverthrow'
import type {SimpleResult} from './simple-result.js'
import {tryCatch} from './simple-result.js'

export type CallRepeaterReturn<RESULT> =
  | {
      value: RESULT
      isOk: true
      error: undefined
    }
  | {
      value: undefined
      isOk: false
      error: Error | undefined
    }

export async function repeatWhileThrow<T>(
  call: () => Promise<T> | T,
  maxRepeatCount = 10,
  delayMs = 100,
): Promise<CallRepeaterReturn<T>> {
  let lastError: Error | undefined
  for (let i = 0; i < maxRepeatCount; i++) {
    try {
      const result = await call()
      return {value: result, isOk: true, error: undefined}
    } catch (error) {
      lastError = error as Error
    }

    await waitBeforeRetry(delayMs)
  }

  return {value: undefined, isOk: false, error: lastError}
}

function waitBeforeRetry(delayMs: number): Promise<void> {
  return sleep(delayMs)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 100,
): Promise<T> {
  const res = await retryResult(
    () =>
      fn()
        .then((v) => ok(v))
        .catch((e) => err(e)),
    retries,
    delay,
  )
  if (res.isErr()) {
    throw res.error
  }
  return res.value
}

export async function retrySimpleResult<T, E>(
  fn: () => Promise<SimpleResult<T, E>>,
  retries: number = 3,
  delay: number = 100,
): Promise<SimpleResult<T, E>> {
  const res = await retryResult(
    () => fn().then((r) => (r.data == null ? err(r.error) : ok(r.data))),
    retries,
    delay,
  )
  if (res.isOk()) {
    return {
      data: res.value,
      error: null,
    }
  }
  return {
    data: null,
    error: res.error!,
  }
}

export async function tryCatchRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 100,
): Promise<SimpleResult<T, Error>> {
  return tryCatch(retry(fn, retries, delay))
}

export async function retryResult<T, E>(
  fn: () => Promise<Result<T, E>>,
  retries: number = 3,
  delay: number = 100,
): Promise<Result<T, E>> {
  let attempt = 0

  while (attempt < retries) {
    const res = await fn()
    if (res.isOk()) {
      return res
    }

    attempt++
    if (attempt >= retries) {
      return res
    }

    await sleep(delay)
  }

  throw new Error('unreachable')
}
