import {describe, expect, it} from 'vitest'
import {Duration} from '../../../../libs/domain/index.js'
import {s} from './schema.js'

describe('Schema', () => {
  it('should validate string', () => {
    const schema = s.string()

    expect(schema.parse('string')).toEqual('string')
    expect(() => schema.parse(1)).toThrow()
  })

  it('should validate bignumber', () => {
    const schema = s.bignumber()

    expect(schema.parse('123.123')).toEqual('123.123')
    expect(() => schema.parse(1.123)).toThrow()
  })

  it('should validate int', () => {
    const schema = s.int()

    expect(schema.parse('1312')).toEqual(1312)
    expect(schema.parse(1312)).toEqual(1312)
    expect(() => schema.parse(1.123)).toThrow()
    expect(() => schema.parse('1.123')).toThrow()
  })

  it('should validate fraction', () => {
    const schema = s.fraction()

    expect(schema.parse('0')).toEqual(0)
    expect(schema.parse('1')).toEqual(1)
    expect(schema.parse('0.5')).toEqual(0.5)
    expect(schema.parse(0.5)).toEqual(0.5)
    expect(() => schema.parse(1.1)).toThrow()
    expect(() => schema.parse('-1')).toThrow()
  })

  it('should validate percent', () => {
    const schema = s.percent()

    expect(schema.parse('0')).toEqual(0)
    expect(schema.parse('100')).toEqual(100)
    expect(schema.parse('50')).toEqual(50)
    expect(schema.parse(0.5)).toEqual(0.5)
    expect(() => schema.parse(100.1)).toThrow()
    expect(() => schema.parse('-1')).toThrow()
  })

  it('should validate bigint', () => {
    const schema = s.bigint()

    expect(schema.parse('0')).toEqual(0n)
    expect(schema.parse(1000n)).toEqual(1000n)
    expect(() => schema.parse(100.1)).toThrow()
    expect(() => schema.parse('100.1')).toThrow()
  })

  it('should validate object', () => {
    const schema = s.object({
      key: s.string(),
    })

    expect(schema.parse({key: 'test'})).toEqual({key: 'test'})
    expect(schema.parse({key: 'test', otherKey: 'test'})).toEqual({
      key: 'test',
    })
    expect(() => schema.parse({otherKey: 'string'})).toThrow()
    expect(() => schema.parse({key: 1})).toThrow()
  })

  it('should validate enum', () => {
    enum Chain {
      eth = 1,
      bsc = 56,
    }

    enum ChainName {
      eth = 'eth',
      bsc = 'bsc',
    }

    const schema = s.enum(Chain)

    expect(schema.parse(1)).toEqual(Chain.eth)
    expect(schema.parse('1')).toEqual(Chain.eth)
    expect(() => schema.parse('eth')).toThrow()
    expect(() => schema.parse('2')).toThrow()

    const schema2 = s.enum(ChainName)

    expect(schema2.parse('eth')).toEqual(ChainName.eth)
    expect(schema2.parse('bsc')).toEqual(ChainName.bsc)
    expect(() => schema2.parse('1')).toThrow()
    expect(() => schema2.parse('2')).toThrow()
  })

  it('should validate options', () => {
    const schema = s.options(['minor', 'major', 'patch'])

    expect(schema.parse('minor')).toEqual('minor')
    expect(schema.parse('major')).toEqual('major')
    expect(() => schema.parse('pathc')).toThrow()
  })

  it('should validate url', () => {
    const schema = s.url()

    expect(schema.parse('http://localhost:4000')).toEqual(
      'http://localhost:4000',
    )
    expect(schema.parse('localhost:3000')).toEqual('localhost:3000')
    expect(schema.parse('https://some.io/path')).toEqual('https://some.io/path')
    expect(schema.parse('https://tokens.lol.app/')).toEqual(
      'https://tokens.lol.app/',
    )
    expect(() => schema.parse('localhost')).toThrow()
  })

  it('should validate host', () => {
    const schema = s.host()

    expect(schema.parse('localhost')).toEqual('localhost')
    expect(schema.parse('0.0.0.0')).toEqual('0.0.0.0')
    expect(schema.parse('127.0.0.1')).toEqual('127.0.0.1')
    expect(schema.parse('1.1.1.1')).toEqual('1.1.1.1')
    expect(schema.parse('redis-staging-master')).toEqual('redis-staging-master')
  })

  it('should validate boolean', () => {
    const schema = s.boolean()

    expect(schema.parse(true)).toEqual(true)
    expect(schema.parse(false)).toEqual(false)
    expect(schema.parse('true')).toEqual(true)
    expect(schema.parse('false')).toEqual(false)
    expect(() => schema.parse('yes')).toThrow()
    expect(() => schema.parse('enable')).toThrow()
  })

  it('should validate duration', () => {
    const schema = s.duration()

    expect(schema.parse('1s')).toEqual(Duration.fromFormat('1s'))
    expect(() => schema.parse('1')).toThrow()
    expect(() => schema.parse('some')).toThrow()
  })

  it('should validate array of strings', () => {
    const schema = s.array(s.string())

    expect(schema.parse('')).toEqual([])
    expect(schema.parse('[]')).toEqual([])
    expect(schema.parse('1')).toEqual(['1'])
    expect(schema.parse('1,2')).toEqual(['1', '2'])
    expect(schema.parse('["1","2"]')).toEqual(['1', '2'])
  })
})
