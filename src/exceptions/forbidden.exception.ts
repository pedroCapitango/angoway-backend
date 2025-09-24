import { HttpStatus } from '@nestjs/common';
import { BaseAppException } from './base.exception';

export class ForbiddenAppException extends BaseAppException {
  constructor(message = 'Acesso negado', details?: any) {
    super({ message, code: 'FORBIDDEN', details, status: HttpStatus.FORBIDDEN }, HttpStatus.FORBIDDEN);
  }
}
