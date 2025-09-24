import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

export class DomainException extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: any;
  constructor(message: string, code: ErrorCode, status: HttpStatus, details?: any) {
    super(message, status);
    this.code = code;
    this.details = details;
  }
}

export class NotFoundDomainException extends DomainException {
  constructor(entity: string, details?: any) {
    super(`${entity} não encontrado(a)`, ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, details);
  }
}

export class ConflictDomainException extends DomainException {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.CONFLICT, HttpStatus.CONFLICT, details);
  }
}

export class ValidationDomainException extends DomainException {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, details);
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(message = 'Não autorizado') {
    super(message, ErrorCode.AUTH_UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(message = 'Acesso negado') {
    super(message, ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
  }
}
