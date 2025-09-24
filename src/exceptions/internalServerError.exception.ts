import { HttpStatus } from '@nestjs/common';
import { BaseAppException } from './base.exception';

export class InternalServerErrorAppException extends BaseAppException {
  constructor(message = 'Erro interno do servidor', details?: any) {
    super({ message, code: 'INTERNAL_ERROR', details, status: HttpStatus.INTERNAL_SERVER_ERROR }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
