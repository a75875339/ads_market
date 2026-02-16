export function setValue(
  obj: unknown,
  keyPath: string[],
  value: unknown,
  type: 'overwrite' | 'merge' = 'overwrite',
): void {
  if (!keyPath.length) {
    throw new Error(
      'keyPath can not be empty (this is probably config lib bug)',
    )
  }

  const last = keyPath[keyPath.length - 1]
  const keys = keyPath.slice(0, -1)
  let currentObj = obj as any

  for (const key of keys) {
    if (!currentObj[key]) {
      currentObj[key] = {}
    }

    currentObj = currentObj[key]
  }

  if (type === 'merge' && value instanceof Object) {
    currentObj[last] = {...currentObj[last], ...value}
  } else {
    currentObj[last] = value
  }
}
