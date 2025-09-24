import { HttpStatus } from '@nestjs/common';
import { BaseAppException } from './base.exception';

export class ItemNotFoundException extends BaseAppException {
  constructor(entity: string, details?: any) {
    super({ message: `${entity} não encontrado(a)`, code: 'NOT_FOUND', details, status: HttpStatus.NOT_FOUND }, HttpStatus.NOT_FOUND);
  }
}
