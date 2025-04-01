import express from 'express';
import { prisma } from './utils/prismaClient';
import router from './routes/car.route';

import { NextFunction, Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/cars",router)

//this is the error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  res.status(error.status || 500).json({
    message: error.message || "Something went wrong!",
    status: error.status,
    stack: error.stack,
  });
});


const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// Gracefully shutdown Prisma Client on process exit
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected');
  process.exit(0);
});