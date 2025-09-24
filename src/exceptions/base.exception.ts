import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorPayload {
  message: string;
  code: string;
  details?: any;
  status?: number;
}

export class BaseAppException extends HttpException {
  public readonly errorCode: string;
  public readonly details?: any;
  constructor(payload: ErrorPayload, status?: HttpStatus) {
    super(payload.message, status || (payload.status as HttpStatus) || HttpStatus.BAD_REQUEST);
    this.errorCode = payload.code;
    this.details = payload.details;
  }
  toResponse(path: string) {
    return {
      message: this.message,
      code: this.errorCode,
      status: this.getStatus(),
      path,
      timestamp: new Date().toISOString(),
      details: this.details,
    };
  }
}
