import { Prisma } from '@prisma/client';
import { ConflictDomainException, DomainException, NotFoundDomainException, ValidationDomainException } from './domain-exceptions';
import { ErrorCode } from './error-codes.enum';
import { HttpStatus } from '@nestjs/common';

export function mapPrismaError(e: any): DomainException | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return new ConflictDomainException('Registro duplicado', { target: (e.meta as any)?.target });
      case 'P2003':
        return new ValidationDomainException('Relacionamento inválido (FK)', { field: (e.meta as any)?.field_name });
      case 'P2025':
        return new NotFoundDomainException('Registro', e.meta);
      default:
        return new DomainException('Erro de banco de dados', ErrorCode.PRISMA_CONSTRAINT, HttpStatus.BAD_REQUEST, { code: e.code, meta: e.meta });
    }
  }
  return null;
}
