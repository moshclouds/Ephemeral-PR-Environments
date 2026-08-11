# Inventory Service

The **Inventory Service** is a core microservice in our Ephemeral PR Environments POC. It is responsible for managing product stock, validating item availability, and communicating with the Order Service to process successful orders.

## Technology Stack
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MySQL
- **ORM:** Prisma
- **HTTP Client:** Axios (with custom interceptors for Ephemeral PR routing)

## Architecture & Ephemeral Routing
This service includes a specialized Axios interceptor (`header-propagation.interceptor.ts`). 
During Ephemeral PR deployments, if it receives HTTP requests containing an `X-Order-PR` or `X-Notification-PR` header, it dynamically rewrites outgoing requests to target the isolated Google Cloud Run instances instead of the default Staging VM instances. This ensures true environment isolation during cross-service communication.

## Getting Started Locally

### Prerequisites
- Node.js (v20+)
- Docker (for local MySQL database)

### Installation
```bash
npm install
```

### Database Setup
Ensure your local MySQL container is running, then apply migrations and seed the database:
```bash
npx prisma db push
npx prisma db seed
```

### Running the App
```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

### Testing
```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```
