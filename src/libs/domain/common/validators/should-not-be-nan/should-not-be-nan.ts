import {DomainError} from '../../exceptions/domain-error.js'

export function shouldNotBeNaN(value: number, name = 'value'): void {
  if (Number.isNaN(value)) {
    throw new DomainError(`${name} should not be NaN`)
  }
}
