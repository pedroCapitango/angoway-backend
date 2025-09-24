import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseAppException } from './base.exception';
import { mapPrismaToAppException } from './prisma-exception.mapper';
import { InternalServerErrorAppException } from './internalServerError.exception';

@Catch()
export class GeneralExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GeneralExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const prismaMapped = mapPrismaToAppException(exception);
    if (prismaMapped) {
      const body = prismaMapped.toResponse(request.url);
      return response.status(body.status).json(body);
    }

    if (exception instanceof BaseAppException) {
      const body = exception.toResponse(request.url);
      return response.status(body.status).json(body);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as any;
      const message = res?.message || exception.message || 'Erro';
      return response.status(status).json({
        message,
        code: 'HTTP_EXCEPTION',
        status,
        path: request.url,
        timestamp: new Date().toISOString(),
        details: res?.errors || undefined,
      });
    }

    this.logger.error('Unhandled exception', exception.stack || exception);
    const generic = new InternalServerErrorAppException();
    const body = generic.toResponse(request.url);
    return response.status(body.status).json(body);
  }
}
