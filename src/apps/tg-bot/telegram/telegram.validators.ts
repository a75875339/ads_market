import {Type} from 'typebox'
import {Compile} from 'typebox/compile'

// common validation schemas

// positive integer schema
export const PositiveIntegerSchema = Type.Integer({minimum: 1})

// positive number schema (for amounts, prices)
export const PositiveNumberSchema = Type.Number({exclusiveMinimum: 0})

// non-negative integer schema
export const NonNegativeIntegerSchema = Type.Integer({minimum: 0})

// percentage schema (1-100)
export const PercentageSchema = Type.Integer({minimum: 1, maximum: 100})

// compiled validators
export const validatePositiveInteger = Compile(PositiveIntegerSchema)
export const validatePositiveNumber = Compile(PositiveNumberSchema)
export const validateNonNegativeInteger = Compile(NonNegativeIntegerSchema)
export const validatePercentage = Compile(PercentageSchema)

// validation result helpers
export const isValidPositiveInteger = (value: unknown): value is number => {
  return validatePositiveInteger.Check(value)
}

export const isValidPositiveNumber = (value: unknown): value is number => {
  return validatePositiveNumber.Check(value)
}

export const isValidNonNegativeInteger = (value: unknown): value is number => {
  return validateNonNegativeInteger.Check(value)
}

export const isValidPercentage = (value: unknown): value is number => {
  return validatePercentage.Check(value)
}

// parse and validate integer from string
export const parsePositiveInteger = (str: string): number | null => {
  const parsed = Number.parseInt(str, 10)
  return isValidPositiveInteger(parsed) ? parsed : null
}

// parse and validate non-negative integer from string (for array indexes)
export const parseNonNegativeInteger = (str: string): number | null => {
  const parsed = Number.parseInt(str, 10)
  return isValidNonNegativeInteger(parsed) ? parsed : null
}

// parse and validate float from string
export const parsePositiveNumber = (str: string): number | null => {
  const parsed = parseFloat(str)
  return isValidPositiveNumber(parsed) ? parsed : null
}

// parse and validate percentage from string (1-100)
export const parsePercentage = (str: string): number | null => {
  const parsed = Number.parseInt(str, 10)
  return isValidPercentage(parsed) ? parsed : null
}
