import {Timestamp} from '../../domain/index.js'

/**
 * Handle time for function execution
 */
export const withMetric = async <T, L extends string>(
  metric: (
    status: string,
    endTime: number,
    labels?: Record<Exclude<L, 'status'>, string | number>,
  ) => void,
  fn: () => Promise<T>,
  additionalLabels?: Record<Exclude<L, 'status'>, string | number>,
): Promise<T> => {
  const startTimestamp = Timestamp.now()

  const res = await fn().catch((err) => {
    metric(
      'fail',
      Timestamp.now().sub(startTimestamp).toMilliseconds(),
      additionalLabels,
    )

    throw err
  })

  metric(
    'success',
    Timestamp.now().sub(startTimestamp).toMilliseconds(),
    additionalLabels,
  )

  return res
}
