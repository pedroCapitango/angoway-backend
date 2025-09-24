import { Prisma } from '@prisma/client';
import { ItemAlreadyExistsException } from './itemAlreadyExists.exception';
import { InvalidDataException } from './invalidData.exception';
import { ItemNotFoundException } from './itemNotFound.exception';

export function mapPrismaToAppException(e: any) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return new ItemAlreadyExistsException('Registro duplicado', { target: (e.meta as any)?.target });
      case 'P2003':
        return new InvalidDataException('Relacionamento inválido', { field: (e.meta as any)?.field_name });
      case 'P2025':
        return new ItemNotFoundException('Registro', e.meta);
      default:
        return new InvalidDataException('Erro de banco de dados', { code: e.code, meta: e.meta });
    }
  }
  return null;
}
