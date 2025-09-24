import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import * as supertest from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  request: ReturnType<typeof supertest>;
  token?: string;
  driverToken?: string;
  created: Record<string, any>;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  // debug start
  // eslint-disable-next-line no-console
  console.log('[TEST] Initializing Nest application...');
  await app.init();
  // eslint-disable-next-line no-console
  console.log('[TEST] Nest application initialized');

  const prisma = app.get(PrismaService);
  const agent = supertest(app.getHttpServer());
  return { app, prisma, request: agent, created: {} };
}

export async function shutdownTestApp(ctx: TestContext) {
  await ctx.prisma.$disconnect();
  await ctx.app.close();
}
