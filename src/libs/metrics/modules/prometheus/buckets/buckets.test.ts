import {describe, expect, test} from 'vitest'
import {Buckets, ExponentialBuckets, LinearBuckets} from './buckets.js'

describe('Bucket', () => {
  describe('Buckets', () => {
    describe('should create buckets from values', () => {
      test('should not create bucket because values is empty', async () => {
        expect(() => new Buckets([])).toThrow()
      })

      test('should create bucket from one value', async () => {
        expect(new Buckets([1]).getValues()).toEqual([1])
      })

      test('should create bucket from two values', async () => {
        expect(new Buckets([1, 2]).getValues()).toEqual([1, 2])
      })

      test('should create bucket from many values', async () => {
        expect(
          new Buckets([1, 2, 3, 4, 5, 6, 7, 8, 9, 100]).getValues(),
        ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 100])
      })
    })

    describe('should create linear buckets', () => {
      test('should not create linear bucket because bucket empty', async () => {
        expect(
          () => new LinearBuckets({start: 0, width: 10, count: 0}),
        ).toThrow()
      })

      test('should create linear bucket for one value', async () => {
        expect(
          new LinearBuckets({start: 0, width: 10, count: 1}).getValues(),
        ).toEqual([0])
      })

      test('should create linear bucket for many values', async () => {
        expect(
          new LinearBuckets({start: 0, width: 10, count: 10}).getValues(),
        ).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90])
      })
    })

    describe('should create exponential buckets', () => {
      test('should not create exponential bucket because values are empty', async () => {
        expect(
          () => new ExponentialBuckets({start: 1, width: 2, count: 0}),
        ).toThrow()
      })

      test('should create exponential bucket with one value', async () => {
        expect(
          new ExponentialBuckets({start: 1, width: 2, count: 1}).getValues(),
        ).toEqual([1])
      })

      test('should create exponential bucket with many values', async () => {
        expect(
          new ExponentialBuckets({start: 1, width: 2, count: 10}).getValues(),
        ).toEqual([1, 2, 4, 8, 16, 32, 64, 128, 256, 512])
      })
    })
  })
})
