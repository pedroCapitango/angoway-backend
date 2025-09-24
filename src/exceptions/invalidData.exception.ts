import { HttpStatus } from '@nestjs/common';
import { BaseAppException } from './base.exception';

export class InvalidDataException extends BaseAppException {
  constructor(message = 'Dados inválidos', details?: any) {
    super({ message, code: 'INVALID_DATA', details, status: HttpStatus.BAD_REQUEST }, HttpStatus.BAD_REQUEST);
  }
}
