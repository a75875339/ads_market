import {describe, expect, test} from 'vitest'
import {DomainError} from '../../../domain/common/exceptions/domain-error.js'
import {createDomainErrorClass} from './domain-exception-factory.js'

describe('DomainExceptionFactory', () => {
  test('should create exception class with domain exception base class', async () => {
    const CustomException = createDomainErrorClass('CustomException')

    try {
      throw new CustomException('test')
    } catch (error) {
      expect(error instanceof DomainError).toBeTruthy()
      expect(error instanceof CustomException).toBeTruthy()
    }
  })

  test('should create exception class and throw exception with cause', async () => {
    const CustomException = createDomainErrorClass('CustomException')

    try {
      throw new CustomException('test', {cause: new Error('cause')})
    } catch (error) {
      expect((error as Error).name).toEqual('CustomException')
      expect((error as Error).message).toEqual('test')
      expect((error as Error).cause).toEqual(new Error('cause'))
    }
  })
})
