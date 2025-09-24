import { HttpStatus } from '@nestjs/common';
import { BaseAppException } from './base.exception';

export class FileErrorException extends BaseAppException {
  constructor(message = 'Erro ao processar arquivo', details?: any) {
    super({ message, code: 'FILE_ERROR', details, status: HttpStatus.BAD_REQUEST }, HttpStatus.BAD_REQUEST);
  }
}
