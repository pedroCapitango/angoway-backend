import { HttpStatus } from '@nestjs/common';
import { BaseAppException } from './base.exception';

export class ItemAlreadyExistsException extends BaseAppException {
  constructor(message: string, details?: any) {
    super({ message, code: 'ALREADY_EXISTS', details, status: HttpStatus.CONFLICT }, HttpStatus.CONFLICT);
  }
}
