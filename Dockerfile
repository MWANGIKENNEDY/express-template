# syntax=docker/dockerfile:1

ARG NODE_VERSION=20

########################################
# 🚀 STAGE 1: Dependencies Installation
########################################
FROM node:${NODE_VERSION}-alpine AS dependencies

WORKDIR /usr/src/app

# Install system dependencies (Prisma needs openssl)
RUN apk add --no-cache openssl

# Copy package files first for caching
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies including devDependencies
RUN npm install

# Install required type definitions
RUN npm install --save-dev @types/node @types/express @types/multer

# Generate Prisma client
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate

########################################
# 🚀 STAGE 2: Builder (compile TypeScript)
########################################
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /usr/src/app

# Copy everything from dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .

# Verify type definitions are present
RUN ls -la node_modules/@types

# Build TypeScript to JavaScript
RUN npm run build

# Debug: Check if dist directory exists
RUN ls -la /usr/src/app/dist || { echo "Error: dist directory not found"; exit 1; }

########################################
# 🚀 STAGE 3: Production (optimized)
########################################
FROM node:${NODE_VERSION}-alpine AS prod

WORKDIR /usr/src/app

# Install runtime dependencies (Prisma needs openssl)
RUN apk add --no-cache openssl

# Copy package files (needed for Prisma)
COPY package*.json ./
COPY prisma ./prisma/

# Copy compiled JS and production node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Copy Prisma client
COPY --from=dependencies /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Set production environment
ENV NODE_ENV=production

# Run as non-root user
USER node

EXPOSE 3000

# Start the app
CMD ["node", "dist/server.js"]