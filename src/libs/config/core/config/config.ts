import './zod-patch.js'

import fs from 'node:fs'
import path from 'node:path'
import deepmerge from 'deepmerge'
import {config as readDotEnv} from 'dotenv'
import yaml from 'js-yaml'
import {ZodNullable, ZodObject, ZodOptional, ZodRecord, ZodType} from 'zod'

import {ConfigError} from './config.error.js'
import type {Key, Keys, KeyType} from './types.js'
import {setValue} from './utils/set-value/index.js'

export const getConfig = <Config>(
  schema: ZodType<Config>,
  params: {
    folder: string
    files: string[]
  },
): Config => {
  const {files, folder} = params

  if (!path.isAbsolute(folder)) {
    throw new ConfigError(`Path for folder must be absolute`)
  }

  let rawConfig = {}
  const dotEnvConfig = {} as any

  readDotEnv({
    path: path.resolve(folder, '.env'),
    processEnv: dotEnvConfig,
  })

  files.forEach((file) => {
    const filePath = path.isAbsolute(file) ? file : path.resolve(folder, file)

    const content = fs.readFileSync(filePath, {encoding: 'utf-8'})
    const json = yaml.load(content) as Record<string, unknown>

    rawConfig = deepmerge(rawConfig, json)
  })

  const configKeys = getKeysFromSchema(schema)

  for (const configKey of configKeys) {
    updateConfig(configKey, rawConfig, dotEnvConfig)
  }

  return schema.parse(rawConfig)
}

function updateConfig(
  configKey: Key,
  rawConfig: Record<string, unknown>,
  dotEnvConfig: Record<string, unknown>,
) {
  const envKey = keyToEnvString(configKey)

  if (configKey.type === 'recordWithOverwrite') {
    const keys = Object.keys(process.env).filter((k) => k.startsWith(envKey))

    const resultObject: Record<string, unknown> = {}

    for (const key of keys) {
      const value = process.env[key] ?? dotEnvConfig[key]

      if (value !== undefined) {
        const resultKey = extractRemainingKeyParts(configKey.path, key)

        resultObject[resultKey] = value
      }
    }

    if (Object.keys(resultObject).length > 0) {
      setValue(rawConfig, configKey.path, resultObject)
    }
  } else if (configKey.type === 'record') {
    const keys = Object.keys(process.env).filter((k) => k.startsWith(envKey))

    for (const key of keys) {
      const value = process.env[key] ?? dotEnvConfig[key]

      if (value !== undefined) {
        const resultKey = extractRemainingKeyParts(configKey.path, key)

        setValue(rawConfig, configKey.path, {[resultKey]: value}, 'merge')
      }
    }
  } else if (configKey.type === 'basic') {
    const value = process.env[envKey] ?? dotEnvConfig[envKey]

    if (value !== undefined) {
      setValue(rawConfig, configKey.path, value)
    }
  }
}

function extractRemainingKeyParts(path: string[], key: string) {
  // 'CHAIN_1_KEK_LOL_1'.slice('CHAIN_1'.length + 1 + 'KEK'.length + 1)
  const itemsToSlice = path.reduce(
    (acc, element) => acc + element.length + 1,
    0,
  )

  return key.slice(itemsToSlice).toLowerCase()
}

function getKeysFromSchema(schema: ZodType): Keys {
  const results: Keys = []

  if (schema instanceof ZodObject) {
    for (const key of Object.keys(schema.shape)) {
      let nextSchema = schema.shape[key]

      if (
        nextSchema instanceof ZodOptional ||
        nextSchema instanceof ZodNullable
      ) {
        nextSchema = nextSchema.unwrap()
      }

      const type = getTypeOfKey(nextSchema)

      const subTree = getKeysFromSchema(nextSchema)

      const newKeys = subTree.length
        ? subTree.map((k) => ({
            path: [key, ...k.path],
            type: k.type,
          }))
        : [
            {
              path: [key],
              type,
            },
          ]

      results.push(...newKeys)
    }
  }

  return results
}

function getTypeOfKey(zodType: ZodType): KeyType {
  if (zodType.metadata()?.type === 'recordWithOverwrite') {
    return 'recordWithOverwrite'
  }

  if (zodType instanceof ZodRecord) {
    return 'record'
  }

  return 'basic'
}

function keyToEnvString(key: Key): string {
  return key.path.join('_').toUpperCase()
}
