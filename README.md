# Ephemeral PR Environments POC

The **Ephemeral PR Environments** Proof of Concept (POC) repository demonstrates a highly advanced, cost-effective, and scalable approach to spinning up complete microservice environments dynamically for every GitHub Pull Request.

## 🌟 The Vision

Traditionally, spinning up a full staging environment for every PR is incredibly expensive and slow. You either have to provision new database servers, or you run the entire stack in massive Kubernetes clusters.

This POC solves that by implementing a **Hybrid Cloud Architecture**:
1. **Serverless Compute (Zero Idle Cost):** The actual microservices (Frontend, Order, Inventory, Notification) deploy to **Google Cloud Run**. They scale to zero when not actively being tested.
2. **Shared State (Low Cost Anchor):** All databases (Postgres, MySQL, MongoDB) run on a single, affordable Compute Engine VM.
3. **Dynamic Routing (The Magic):** We only deploy the services that *changed* in the PR. For any service that didn't change, we dynamically route traffic back to the persistent staging environment.

## 🏗️ Architecture & Technologies

- **Frontend:** React + Vite + TailwindCSS
- **Backend Services:** NestJS + Prisma ORM
- **Databases:** PostgreSQL, MySQL, MongoDB
- **Infrastructure:** Google Cloud Platform (Cloud Run, Compute Engine, Serverless VPC Access)
- **CI/CD:** GitHub Actions (Self-hosted runner)

---

## ✨ Key Features & Innovations

### 1. HTTP Header Propagation (Dynamic Routing)
Instead of deploying a full clone of the infrastructure for every PR, we utilize intelligent header propagation to dynamically route requests *only* to the services that were modified in the PR. All other requests seamlessly fall back to the persistent staging environment.

#### The Architectural Flow (Example)
Imagine a developer opens a PR (#5) that modifies the `order-service` and `inventory-service`, but leaves the `notification-service` completely untouched:

1. **The Entrypoint (Frontend UI):**
   - The CI/CD pipeline comments on the PR with a special dynamic URL containing query parameters for the modified services:
     `https://frontend-pr-5-xyz.run.app/?order_pr=5&inventory_pr=5`
2. **Frontend Interceptor (Outbound to Backend):**
   - When the reviewer clicks the link, the React frontend extracts these parameters.
   - An Axios interceptor automatically attaches them as custom HTTP headers to all outgoing API calls:
     - `X-Order-PR: 5`
     - `X-Inventory-PR: 5`
   - Because `order_pr=5` is present, the frontend dynamically targets the ephemeral `order-service` Cloud Run URL instead of the staging URL.
3. **Backend Orchestrator (Order Service):**
   - The ephemeral `order-service-pr-5` receives the request. A NestJS middleware extracts the custom `X-*-PR` headers and stores them securely in Node's `AsyncLocalStorage`, making them available globally for the lifecycle of that specific request.
   - The core business logic in the `order-service` executes normally, completely unaware of the ephemeral setup. It simply attempts to call the inventory service using the standard, hardcoded staging URL:
     `POST http://inventory-svc.ephemeral-poc.run.place/inventory/deduct`
4. **Backend Interceptor (`PrHttpModule`):**
   - Right before the HTTP request leaves the `order-service`, our centralized `PrHttpModule` interceptor catches it.
   - It checks `AsyncLocalStorage` and sees the `X-Inventory-PR: 5` header.
   - It dynamically rewrites the destination URL on the fly:
     *From:* `http://inventory-svc.ephemeral-poc.run.place/inventory/deduct`
     *To:* `https://inventory-service-pr-5-xyz.us-central1.run.app/inventory/deduct`
5. **The Staging Fallback (Notification Service):**
   - Later in the execution, the `order-service` attempts to call the `notification-service`.
   - The `PrHttpModule` intercepts it, but sees there is **no** `X-Notification-PR` header (because the notification service didn't change in this PR).
   - It leaves the URL completely untouched, and the request is safely routed to the stable, always-on staging `notification-service`.

This architecture creates a massive cost reduction, as PRs only provision cloud compute for exactly what they changed, while still behaving like a complete, isolated environment for the reviewer.

### 2. True Database Isolation (Zero Provisioning)
When a backend service changes, we need an isolated database to run schema migrations and tests without breaking the staging environment.
Our GitHub Actions pipeline connects to the staging VM and executes a highly optimized, idempotent `clone_db.sh` script. This script dynamically clones the staging database schema and data into a temporary PR namespace (e.g., `order_db_pr_5`) in milliseconds, without provisioning any new hardware.

### 3. Serverless VPC Egress
To allow Cloud Run services to securely talk to the internal VM databases, we use a Serverless VPC Access Connector. Cloud Run is configured with `--vpc-egress private-ranges-only`. This ensures database traffic stays securely inside the private VPC (`10.x.x.x`), while inter-service communication (Cloud Run to Cloud Run) routes securely over the public internet.

### 4. Automated Teardown
When a Pull Request is merged or closed, a cleanup GitHub Action automatically:
1. Deletes the ephemeral Cloud Run services to stop billing.
2. Connects to the VM and drops the isolated PR databases to free up storage space.

---

## 🚀 Getting Started

If you want to recreate this infrastructure from scratch, we have created a comprehensive, step-by-step setup guide. 

👉 **[Read the Infrastructure Setup Guide](INFRASTRUCTURE_SETUP.md)**

If you want to understand exactly how the GitHub Actions pipelines detect changes, clone databases, and deploy to Cloud Run:
👉 **[Read the CI/CD Workflows Architecture](WORKFLOWS.md)**

### Repository Structure

```text
.
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines
├── app/
│   ├── frontend/               # React Vite Frontend
│   ├── inventory-service/      # NestJS + MySQL
│   ├── notification-service/   # NestJS + MongoDB
│   └── order-service/          # NestJS + Postgres
├── infra/
│   ├── nginx/                  # Reverse Proxy configuration
│   └── docker-compose.staging.yml # Anchor VM Database Stack
└── scripts/                    # Automated database cloning & cleanup scripts
```

## 🧠 Lessons Learned
- **VM Access Scopes:** By default, GCP limits VM access scopes. To allow a self-hosted GitHub runner to delete Cloud Run services, the VM must be explicitly configured with "Allow full access to all Cloud APIs".
- **MongoDB in Docker:** MongoDB requires a stable hostname for replica sets. Hardcoding `mongo-db:27017` in the replica set initialization prevents `RsGhost` errors when containers restart and get new Docker IDs.
- **Idempotency is Key:** CI/CD pipelines must check if a PR database already exists before cloning. This prevents developers from losing their test data when pushing consecutive commits to the same PR.
