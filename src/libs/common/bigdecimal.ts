import BN, {BigNumber} from 'bignumber.js'

export const BigDecimal = (BN as unknown as BigNumber.Constructor).clone({
  DECIMAL_PLACES: 32,
  EXPONENTIAL_AT: 1e9,
})

export type BigDecimal = BigNumber

export type NumberLike = BigNumber.Value

export function isZero(n: NumberLike): boolean {
  return new BigDecimal(n).isZero()
}

export type BigDecimalRoundingMode = BigNumber.RoundingMode
