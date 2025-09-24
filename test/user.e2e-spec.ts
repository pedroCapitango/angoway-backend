import { createTestApp, shutdownTestApp, TestContext } from './helpers/e2e-setup';

const dbMissing = !process.env.DATABASE_URL;

(dbMissing ? describe.skip : describe)('User E2E', () => {
  let ctx: TestContext;
  const userPayload = {
    name: 'User Two',
    email: 'user2@test.com',
    number: '900000002',
    password: 'Secret123!',
    role: 'USER'
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    const suffix = Date.now();
    userPayload.email = `user2_${suffix}@test.com`;
    userPayload.number = `8${suffix}`.slice(0,9);
    await ctx.request.post('/user').send(userPayload).expect(201);
    const login = await ctx.request.post('/auth/login').send({ number: userPayload.number, password: userPayload.password }).expect(200);
    ctx.token = login.body.access_token;
  });

  afterAll(async () => {
    await shutdownTestApp(ctx);
  });

  it('GET /user/me should return profile', async () => {
    const res = await ctx.request.get('/user/me').set('Authorization', `Bearer ${ctx.token}`).expect(200);
    expect(res.body).toHaveProperty('id');
    ctx.created.userId = res.body.id;
  });

  it('PATCH /user/:id should update name', async () => {
    const res = await ctx.request.patch(`/user/${ctx.created.userId}`).set('Authorization', `Bearer ${ctx.token}`).send({ name: 'User Two Updated' }).expect(200);
    expect(res.body.code).toBe(200);
  });

  it('GET /user/:id should return user (without password)', async () => {
    const res = await ctx.request.get(`/user/${ctx.created.userId}`).set('Authorization', `Bearer ${ctx.token}`).expect(200);
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
  });
});
