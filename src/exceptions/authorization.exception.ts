import { HttpStatus } from '@nestjs/common';
import { BaseAppException } from './base.exception';

export class AuthorizationException extends BaseAppException {
  constructor(message = 'Token inválido ou expirado', details?: any) {
    super({ message, code: 'AUTH_INVALID', details, status: HttpStatus.UNAUTHORIZED }, HttpStatus.UNAUTHORIZED);
  }
}
