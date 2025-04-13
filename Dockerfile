# syntax=docker/dockerfile:1

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

# Install system dependencies for Prisma
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy package files and Prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client using build arguments
ARG DATABASE_URL
RUN DATABASE_URL=${DATABASE_URL} npx prisma generate

# Install TypeScript and ts-node globally
RUN npm install -g typescript ts-node nodemon

USER node

# Copy the rest of the files
COPY . .

EXPOSE 3000

CMD ["nodemon", "--watch", "src/**/*.ts", "--exec", "ts-node", "server.ts"]