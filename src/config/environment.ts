import {config} from './config.js'

export const getEnvironment = (): string => process.env.APP_ENV || 'development'
export const isProd = (): boolean => getEnvironment() === 'production'
export const isStaging = (): boolean => getEnvironment() === 'stage'
export const isTest = (): boolean => getEnvironment() === 'test'
export const isDev = (): boolean => getEnvironment() === 'development'
export const isDocker = (): boolean => config.docker
