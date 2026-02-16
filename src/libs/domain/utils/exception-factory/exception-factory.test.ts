import {describe, expect, test} from 'vitest'
import {createErrorClass} from './exception-factory.js'

describe('ExceptionFactory', () => {
  test('should create exception class with default base class', async () => {
    const CustomException = createErrorClass('CustomException')

    try {
      throw new CustomException('test')
    } catch (error) {
      expect(error instanceof Error).toBeTruthy()
      expect(error instanceof CustomException).toBeTruthy()
    }
  })

  test('should create exception class with not default base class', async () => {
    const BaseException = createErrorClass('BaseException', Error)
    const InheritedException = createErrorClass(
      'InheritedException',
      BaseException,
    )

    try {
      throw new InheritedException('test')
    } catch (error) {
      expect(error instanceof BaseException).toBeTruthy()
      expect(error instanceof InheritedException).toBeTruthy()
    }
  })

  test('should create exception class and throw exception with cause', async () => {
    const CustomException = createErrorClass('CustomException')

    try {
      throw new CustomException('test', {cause: new Error('cause')})
    } catch (error) {
      expect((error as Error).name).toEqual('CustomException')
      expect((error as Error).message).toEqual('test')
      expect((error as Error).cause).toEqual(new Error('cause'))
    }
  })
})
