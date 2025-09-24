import { createTestApp, shutdownTestApp, TestContext } from './helpers/e2e-setup';

const dbMissing = !process.env.DATABASE_URL;

(dbMissing ? describe.skip : describe)('Routes E2E', () => {
  let ctx: TestContext;
  let stopIds: number[] = [];
  beforeAll(async () => {
    ctx = await createTestApp();
    // seed a user + login
    const userPayload = { name: 'RouteUser', email: `routes_${Date.now()}@t.com`, number: `7${Date.now()}`.slice(0,9), password: 'Secret123!' };
    await ctx.request.post('/user').send(userPayload).expect(201);
    const login = await ctx.request.post('/auth/login').send({ number: userPayload.number, password: userPayload.password }).expect(200);
    ctx.token = login.body.access_token;
    // seed stops directly through prisma
    const created = await ctx.prisma.stop.createMany({ data: [ { name: 'Stop A' }, { name: 'Stop B' }, { name: 'Stop C' } ] });
    // fetch stops to get IDs
    const allStops = await ctx.prisma.stop.findMany({ take: 3, orderBy: { id: 'desc' } });
    stopIds = allStops.map(s => s.id);
  });

  afterAll(async () => {
    await shutdownTestApp(ctx);
  });

  it('POST /routes creates route with stops', async () => {
    const res = await ctx.request.post('/routes').set('Authorization', `Bearer ${ctx.token}`).send({ name: 'Rota Teste', origin: 'Origem', destination: 'Destino', stopIdsInOrder: stopIds }).expect(201);
    expect(res.body.code).toBe(201);
  });

  it('GET /routes/count returns count', async () => {
    const res = await ctx.request.get('/routes/count').set('Authorization', `Bearer ${ctx.token}`).expect(200);
    expect(res.body).toHaveProperty('count');
  });

  it('GET /routes/suggestions sem auth retorna array ou vazio', async () => {
    await ctx.request.get('/routes/suggestions?lat=0&lng=0').expect(200);
  });
});
