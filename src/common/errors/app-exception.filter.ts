import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DomainException } from './domain-exceptions';
import { mapPrismaError } from './prisma-exception.mapper';
import { ErrorCode } from './error-codes.enum';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Map Prisma first
    const prismaMapped = mapPrismaError(exception);
    if (prismaMapped) {
      return response.status(prismaMapped.getStatus()).json({
        message: prismaMapped.message,
        code: prismaMapped.code,
        status: prismaMapped.getStatus(),
        timestamp: new Date().toISOString(),
        path: request.url,
        details: prismaMapped['details'] || undefined,
      });
    }

    if (exception instanceof DomainException) {
      return response.status(exception.getStatus()).json({
        message: exception.message,
        code: exception.code,
        status: exception.getStatus(),
        timestamp: new Date().toISOString(),
        path: request.url,
        details: exception['details'] || undefined,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody: any = exception.getResponse();
      const message = (responseBody && responseBody.message) || exception.message || 'Erro';
      return response.status(status).json({
        message,
        code: ErrorCode.INTERNAL_ERROR,
        status,
        timestamp: new Date().toISOString(),
        path: request.url,
        details: responseBody?.errors || undefined,
      });
    }

    this.logger.error('Unhandled exception', exception.stack || exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Erro interno do servidor',
      code: ErrorCode.INTERNAL_ERROR,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
