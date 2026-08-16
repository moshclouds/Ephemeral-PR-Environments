# Ephemeral PR Environments POC

The **Ephemeral PR Environments** Proof of Concept (POC) repository demonstrates a highly advanced, cost-effective, and scalable approach to spinning up complete microservice environments dynamically for every GitHub Pull Request.

## 🌟 The Vision: True Isolated Testing

The primary goal of this architecture is to provide **Isolated Testing** for every single pull request, inspired by the modern "Preview Branches" paradigm. 

When a developer works on a feature, they shouldn't have to share a staging environment where their disruptive database migrations or experimental code might block other engineers. They need a complete, sandboxed environment tailored exactly to their git branch. 

However, traditionally spinning up a full, isolated replica (with dedicated databases and compute clusters) for *every* PR is incredibly expensive and slow.

This POC solves the cost-speed barrier to isolated testing by implementing a **Hybrid Cloud Architecture**:
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

## 📸 Demo Proofs & Walkthrough

Here is a step-by-step visual walkthrough of the Ephemeral PR Environments in action based on our POC:

### 1. Staging Project Deployment
<img width="1458" height="1279" alt="Image" src="https://github.com/user-attachments/assets/9023fe93-331a-4d1c-acd1-664fa50dfe6e" />
*The base infrastructure is successfully deployed to the persistent Staging VM, serving as our anchor environment.*

### 2. Artifact Registry
<img width="846" height="635" alt="Image" src="https://github.com/user-attachments/assets/6e1411b2-09d1-4187-b162-1dd3a2ea4aa0" />

*Docker images for all microservices are successfully built and pushed to the Google Cloud Artifact Registry.*

### 3. Staging VM Configuration
<img width="1139" height="786" alt="Image" src="https://github.com/user-attachments/assets/90ff72c4-a9b2-4d28-8a30-b4a0ea81647c" />

*The self-hosted GitHub Runner, Docker Compose stack, and local `.env` files are fully configured and running securely on the Staging VM.*

### 4. Opening a Pull Request
<img width="1451" height="1277" alt="Image" src="https://github.com/user-attachments/assets/4cee1ee9-eaf2-4b0a-808a-6e51cd5c9d87" />

*A developer opens a new Pull Request. This instantly triggers the GitHub Actions CI/CD pipeline to evaluate changes and spin up targeted ephemeral resources.*

### 5. Automated PR Comment
<img width="1210" height="1140" alt="Image" src="https://github.com/user-attachments/assets/052b7c55-1ff8-4927-8ff1-02db492c3531" />

*Once the pipeline finishes, the GitHub Action automatically posts a comment on the PR containing the dynamic, clickable preview URLs for QA testing.*

### 6. Frontend Service (PR Isolated)
<img width="1020" height="446" alt="Image" src="https://github.com/user-attachments/assets/54a6f94f-b08b-4c9b-bb8a-863ccb09d7c6" />

*Clicking the preview link opens the Frontend hosted on a completely isolated Cloud Run instance, dynamically injecting PR tracking headers.*

### 7. Order Service (PR Isolated)
<img width="1279" height="507" alt="Image" src="https://github.com/user-attachments/assets/01b353af-7290-4ac7-ad21-fa7771a44f9a" />

*The Order Service successfully intercepts the PR headers and communicates with its own cloned, isolated PostgreSQL database.*

### 8. Inventory Service (PR Isolated)
<img width="966" height="469" alt="Image" src="https://github.com/user-attachments/assets/b3c8aa2c-1f17-41c4-85b9-8496c2940a02" />

*The Inventory Service is dynamically targeted by the Order Service and correctly interacts with its own isolated MySQL database clone.*

### 9. Notification Service (PR Isolated)
<img width="1013" height="372" alt="Image" src="https://github.com/user-attachments/assets/1232da4e-a066-436f-b77c-84546cecf640" />

*The Notification Service successfully processes requests in its ephemeral Cloud Run container using its cloned MongoDB database.*

### 10. Automated Cleanup on Merge
<img width="932" height="736" alt="Image" src="https://github.com/user-attachments/assets/b7c0a462-ca6b-408b-89e4-88568fd58869" />

*When the Pull Request is merged or closed, a cleanup pipeline automatically deletes the ephemeral Cloud Run instances and drops the isolated databases, reducing costs to zero.*

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
