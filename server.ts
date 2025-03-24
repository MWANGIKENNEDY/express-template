import express from 'express';
import { prisma } from './utils/prismaClient';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("kennedy")

// Gracefully shutdown Prisma Client on process exit
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected');
  process.exit(0);
});