import {DomainError} from '../../../domain/common/exceptions/domain-error.js'
import {createErrorClass} from '../exception-factory/exception-factory.js'

export function createDomainErrorClass(name: string): ErrorConstructor {
  return createErrorClass(name, DomainError)
}
