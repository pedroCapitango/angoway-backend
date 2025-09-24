import { createTestApp, shutdownTestApp, TestContext } from './helpers/e2e-setup';

const dbMissing = !process.env.DATABASE_URL;

(dbMissing ? describe.skip : describe)('Driver & Bus E2E', () => {
  let ctx: TestContext;
  let routeId: number;
  let busId: number;
  let driverId: number;
  const unique = Date.now();

  beforeAll(async () => {
    ctx = await createTestApp();
    // user + login
    const userPayload = { name: 'DBUser', email: `db_${unique}@t.com`, number: `6${unique}`.slice(0,9), password: 'Secret123!' };
    await ctx.request.post('/user').send(userPayload).expect(201);
    const login = await ctx.request.post('/auth/login').send({ number: userPayload.number, password: userPayload.password }).expect(200);
    ctx.token = login.body.access_token;
    // stops
    await ctx.prisma.stop.createMany({ data: [ { name: 'S1' }, { name: 'S2' } ] });
    const stops = await ctx.prisma.stop.findMany({ take: 2, orderBy: { id: 'desc' } });
    const stopIds = stops.map(s => s.id);
    // route
    await ctx.request.post('/routes').set('Authorization', `Bearer ${ctx.token}`).send({ name: 'Rota DB', origin: 'O', destination: 'D', stopIdsInOrder: stopIds }).expect(201);
    const route = await ctx.prisma.route.findFirst({ where: { name: 'Rota DB' }, orderBy: { id: 'desc' } });
    routeId = route!.id;
  });

  afterAll(async () => {
    await shutdownTestApp(ctx);
  });

  it('POST /driver cria driver', async () => {
    const driverPayload = { name: 'Driver One', email: `driver_${unique}@t.com`, phone: `95${unique}`.slice(0,9), password: 'Secret123!', licenseNumber: `LIC${unique}`, experienceTime: 2 };
    await ctx.request.post('/driver').set('Authorization', `Bearer ${ctx.token}`).send(driverPayload).expect(201);
    const driver = await ctx.prisma.driver.findFirst({ where: { email: driverPayload.email } });
    driverId = driver!.id;
  });

  it('POST /bus cria bus', async () => {
    const busPayload = { matricula: `MAT-${unique}`, routeId, capacity: 40, currentLoad: 0 };
    const res = await ctx.request.post('/bus').set('Authorization', `Bearer ${ctx.token}`).send(busPayload).expect(201);
    const bus = await ctx.prisma.bus.findFirst({ where: { matricula: busPayload.matricula } });
    busId = bus!.id;
  });

  it('PUT /bus/assign-driver/:busId atribui driver', async () => {
    const driver = await ctx.prisma.driver.findUnique({ where: { id: driverId } });
    await ctx.request.put(`/bus/assign-driver/${busId}`).set('Authorization', `Bearer ${ctx.token}`).send({ driverEmail: driver!.email }).expect(200);
  });

  it('GET /bus/count retorna contagem', async () => {
    const res = await ctx.request.get('/bus/count').set('Authorization', `Bearer ${ctx.token}`).expect(200);
    expect(res.body).toHaveProperty('count');
  });
});
