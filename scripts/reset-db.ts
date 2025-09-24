import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('Starting database reset...');

    await prisma.notification.deleteMany({});
    await prisma.feedback.deleteMany({});
    await prisma.travel.deleteMany({});
    await prisma.routeStop.deleteMany({});
    await prisma.stop.deleteMany({});
    await prisma.routeSchedule.deleteMany({});
    await prisma.bus.deleteMany({});
    await prisma.driver.deleteMany({});
    await prisma.route.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Database reset successfully. (niaSequence skipped)');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});
