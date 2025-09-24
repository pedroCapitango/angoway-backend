import { createTestApp, shutdownTestApp, TestContext } from './helpers/e2e-setup';

const skip = !process.env.DATABASE_URL;

(skip ? describe.skip : describe)('Fluxo: Motorista inicia viagem', () => {
  let ctx: TestContext;
  let busId: number;
  let driverId: number;
  let routeId: number;
  const unique = Date.now();
  const adminUser = {
    name: 'Admin Trav',
    email: `adm_trav_${unique}@t.com`,
    number: `8${unique}`.slice(0, 9),
    password: 'Secret123!',
  };

  beforeAll(async () => {
    jest.setTimeout(20000);
    ctx = await createTestApp();

    // 1. Criar usuário e login
    await ctx.request.post('/user').send(adminUser).expect(201);
    const login = await ctx.request
      .post('/auth/login')
      .send({ number: adminUser.number, password: adminUser.password })
      .expect(200);
    ctx.token = login.body.access_token;

    // 2. Criar stops
    await ctx.prisma.stop.createMany({
      data: [
        { name: `ST_STA_${unique}` },
        { name: `ST_STB_${unique}` },
      ],
    });
    const stops = await ctx.prisma.stop.findMany({ orderBy: { id: 'desc' }, take: 2 });
    const stopIds = stops.map((s) => s.id);

    // 3. Criar rota
    await ctx.request
      .post('/routes')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ name: `Rota-Start-${unique}`, origin: 'Orig', destination: 'Dest', stopIdsInOrder: stopIds })
      .expect(201);
    const route = await ctx.prisma.route.findFirst({ where: { name: `Rota-Start-${unique}` } });
    routeId = route!.id;

    // 4. Criar motorista (fallback se 400)
    let driverEmail = `drv_start_${unique}@t.com`;
    let driverPayload = {
      name: 'Driver Start',
      email: driverEmail,
      phone: `93${unique}`.slice(0, 9),
      password: 'Secret123!',
      licenseNumber: `LIC-ST-${unique}`,
      experienceTime: 2,
    };
    let res = await ctx.request
      .post('/driver')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send(driverPayload);
    if (res.status === 400) {
      driverPayload.email = `drv_start_${unique}_b@t.com`;
      driverPayload.phone = `92${unique}`.slice(0, 9);
      driverPayload.licenseNumber = `LIC-STB-${unique}`;
      await ctx.request
        .post('/driver')
        .set('Authorization', `Bearer ${ctx.token}`)
        .send(driverPayload)
        .expect(201);
    } else {
      expect(res.status).toBe(201);
    }
    const driver = await ctx.prisma.driver.findFirst({ where: { email: driverPayload.email } });
    driverId = driver!.id;

    // 5. Criar bus OFF_SERVICE
    const matricula = `MAT-ST-${unique}`;
    await ctx.request
      .post('/bus')
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ matricula, routeId, capacity: 40, currentLoad: 0, status: 'OFF_SERVICE' })
      .expect(201);
    const bus = await ctx.prisma.bus.findFirst({ where: { matricula } });
    busId = bus!.id;

    // 6. Atribuir motorista (endpoint altera para IN_TRANSIT mas NÃO cria travel)
    await ctx.request
      .put(`/bus/assign-driver/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ driverEmail: driverPayload.email })
      .expect(200);

    // 7. Forçar OFF_SERVICE para preparar transição válida
    await ctx.request
      .patch(`/bus/dashboard-details/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ status: 'OFF_SERVICE' })
      .expect(200);
  });

  afterAll(async () => {
    await shutdownTestApp(ctx);
  });

  it('Inicia viagem ao mudar status para IN_TRANSIT (gera travel)', async () => {
    // 8. Mudar para IN_TRANSIT (deve criar travel)
    await ctx.request
      .patch(`/bus/dashboard-details/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ status: 'IN_TRANSIT' })
      .expect(200);

    const travel = await ctx.prisma.travel.findFirst({ where: { busId }, orderBy: { id: 'desc' } });
    expect(travel).toBeTruthy();
    expect(travel!.profit).toBe(0);
    expect(travel!.arrivalTime).not.toBeNull();
    expect(travel!.departureTime).toBeNull();
  });

  it('Incrementa lucro com currentLoad=4 (600)', async () => {
    await ctx.request
      .patch(`/bus/dashboard-details/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ currentLoad: 4 })
      .expect(200);
    const travel = await ctx.prisma.travel.findFirst({ where: { busId }, orderBy: { id: 'desc' } });
    expect(travel!.profit).toBe(4 * 150);
  });

  it('Fecha viagem (status OFF_SERVICE) define departureTime', async () => {
    await ctx.request
      .patch(`/bus/dashboard-details/${busId}`)
      .set('Authorization', `Bearer ${ctx.token}`)
      .send({ status: 'OFF_SERVICE' })
      .expect(200);
    const travel = await ctx.prisma.travel.findFirst({ where: { busId }, orderBy: { id: 'desc' } });
    expect(travel!.departureTime).not.toBeNull();
  });
});
