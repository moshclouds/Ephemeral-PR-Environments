# Order Service

The **Order Service** is a core microservice in our Ephemeral PR Environments POC. It is responsible for handling customer orders, communicating with the Inventory Service to deduct stock, and notifying the Notification Service to send confirmations.

## Technology Stack
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **HTTP Client:** Axios (with custom interceptors for Ephemeral PR routing)

## Architecture & Ephemeral Routing
This service includes a specialized Axios interceptor (`header-propagation.interceptor.ts`). 
During Ephemeral PR deployments, if it receives HTTP requests containing `X-Inventory-PR` or `X-Notification-PR` headers, it will dynamically rewrite outgoing requests to target the isolated Google Cloud Run instances instead of the default Staging VM instances.

## Getting Started Locally

### Prerequisites
- Node.js (v20+)
- Docker (for local database)

### Installation
```bash
npm install
```

### Database Setup
Ensure your local PostgreSQL container is running, then apply migrations and seed the database:
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

## API Endpoints
- `GET /orders` - Fetch all orders
- `POST /orders` - Create a new order (Requires `itemId` and `quantity`)
