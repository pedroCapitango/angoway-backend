import { createTestApp, shutdownTestApp, TestContext } from './helpers/e2e-setup';

const skip = !process.env.DATABASE_URL;

(skip ? describe.skip : describe)('Fluxo Completo de Viagem', () => {
  let ctx: TestContext;
  const unique = Date.now();
  let busId: number;
  let driverEmail: string;

  beforeAll(async () => {
    jest.setTimeout(20000);
    ctx = await createTestApp();

    // 1. Criar usuário e login
    const userPayload = { name: 'Traveler', email: `trav_${unique}@t.com`, number: `7${unique}`.slice(0,9), password: 'Secret123!' };
    await ctx.request.post('/user').send(userPayload).expect(201);
    const login = await ctx.request.post('/auth/login').send({ number: userPayload.number, password: userPayload.password }).expect(200);
    ctx.token = login.body.access_token;

    // 2. Criar stops
    await ctx.prisma.stop.createMany({ data: [ { name: `ST-A-${unique}` }, { name: `ST-B-${unique}` } ] });
    const stops = await ctx.prisma.stop.findMany({ orderBy: { id: 'desc' }, take: 2 });
    const stopIds = stops.map(s => s.id);

    // 3. Criar rota
    await ctx.request.post('/routes')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ name: `Rota-${unique}`, origin: 'Orig', destination: 'Dest', stopIdsInOrder: stopIds })
      .expect(201);
    const route = await ctx.prisma.route.findFirst({ where: { name: `Rota-${unique}` } });
    const routeId = route!.id;

    // 4. Criar motorista
    driverEmail = `driver_travel_${unique}@t.com`;
    const driverPayload = { name: 'Driver Travel', email: driverEmail, phone: `94${unique}`.slice(0,9), password: 'Secret123!', licenseNumber: `LIC-T-${unique}`, experienceTime: 4 };
    await ctx.request.post('/driver').set('Authorization', `Bearer ${ctx.token}`).send(driverPayload).expect(201);

    // 5. Criar bus (status OFF_SERVICE explícito)
    const matricula = `MAT-T-${unique}`;
    await ctx.request.post('/bus')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ matricula, routeId, capacity: 40, currentLoad: 0, status: 'OFF_SERVICE' })
      .expect(201);
    const bus = await ctx.prisma.bus.findFirst({ where: { matricula } });
    busId = bus!.id;

    // 6. Atribuir motorista (endpoint ajusta status IN_TRANSIT)
    await ctx.request.put(`/bus/assign-driver/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ driverEmail })
      .expect(200);

    // Forçar OFF_SERVICE e voltar para IN_TRANSIT para garantir criação de travel
    await ctx.request.patch(`/bus/dashboard-details/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ status: 'OFF_SERVICE' })
      .expect(200);
    await ctx.request.patch(`/bus/dashboard-details/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ status: 'IN_TRANSIT' })
      .expect(200);
  });

  afterAll(async () => {
    await shutdownTestApp(ctx);
  });

  it('Cria travel inicial (profit 0)', async () => {
    const travel = await ctx.prisma.travel.findFirst({ where: { busId }, orderBy: { id: 'desc' } });
    expect(travel).toBeTruthy();
    expect(travel!.profit).toBe(0);
  });

  it('Incrementa lucro com currentLoad=3', async () => {
    await ctx.request.patch(`/bus/dashboard-details/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ currentLoad: 3 })
      .expect(200);
    const travel = await ctx.prisma.travel.findFirst({ where: { busId }, orderBy: { id: 'desc' } });
    expect(travel!.profit).toBe(3 * 150);
  });

  it('Incrementa lucro novamente com currentLoad=2 (total 750)', async () => {
    await ctx.request.patch(`/bus/dashboard-details/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ currentLoad: 2 })
      .expect(200);
    const travel = await ctx.prisma.travel.findFirst({ where: { busId }, orderBy: { id: 'desc' } });
    expect(travel!.profit).toBe((3 + 2) * 150);
  });

  it('Fecha viagem mudando status para OFF_SERVICE (departureTime definido)', async () => {
    await ctx.request.patch(`/bus/dashboard-details/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ status: 'OFF_SERVICE' })
      .expect(200);
    const travel = await ctx.prisma.travel.findFirst({ where: { busId }, orderBy: { id: 'desc' } });
    expect(travel!.departureTime).not.toBeNull();
  });
});
