# ================ Stage 1: Build ==================
FROM node:20-alpine AS builder
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
# Need prisma.config.ts if present
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# ================ Stage 2: Production =================
FROM node:20-alpine
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy generated Prisma Client from builder
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Start the application
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
