import {DomainError} from '../../exceptions/domain-error.js'

export function shouldNotBeNegative(value: number, name = 'value'): void {
  if (value < 0) {
    throw new DomainError(`${name} should not be negative`)
  }
}
