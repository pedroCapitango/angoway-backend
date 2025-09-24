import { createTestApp, shutdownTestApp, TestContext } from './helpers/e2e-setup';

// Skip suite entirely if no DATABASE_URL (environment not prepared)
const dbMissing = !process.env.DATABASE_URL;

(dbMissing ? describe.skip : describe)('Auth E2E', () => {
  let ctx: TestContext;
  const userPayload = {
    name: 'Test User',
    email: 'user@test.com',
    number: '900000001',
    password: 'Secret123!',
    role: 'USER'
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    // ensure unique number/email each run
    const suffix = Date.now();
    userPayload.email = `user_${suffix}@test.com`;
    userPayload.number = `9${suffix}`.slice(0,9); // keep length manageable
    await ctx.request.post('/user').send(userPayload).expect(201);
  });

  afterAll(async () => {
    await shutdownTestApp(ctx);
  });

  it('should login user and return access token', async () => {
    const res = await ctx.request.post('/auth/login').send({ number: userPayload.number, password: userPayload.password }).expect(200);
    expect(res.body).toHaveProperty('access_token');
    ctx.token = res.body.access_token;
  });
});
