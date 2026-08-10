# ⚙️ CI/CD Workflow Architecture

This document explains the exact execution flow of the GitHub Actions workflows that power the Ephemeral PR Environments.

Our CI/CD architecture is designed to be **hyper-efficient**. Instead of blindly building and deploying the entire infrastructure for every Pull Request, the pipelines intelligently analyze what changed, deploy *only* the modified services to Cloud Run, isolate their databases, and dynamically link them together.

---

## 1. The Deployment Pipeline (`deploy-pr.yml`)
Triggered automatically when a Pull Request is opened or synchronized.

### Phase 1: Intelligent Change Detection (`dorny/paths-filter`)
The workflow begins by running a path filter. It analyzes the git diff of the PR to figure out exactly which microservices were modified.
- If `app/order-service/**` changed -> Mark `order-service` for deployment.
- If `app/frontend/**` changed -> Mark `frontend` for deployment.
- This outputs a dynamic JSON array (e.g., `["order-service", "frontend"]`) which is passed to the next job.

### Phase 2: Dynamic Matrix Deployment
Using GitHub Actions' `matrix` strategy, the pipeline dynamically spawns parallel deployment jobs *only* for the services detected in Phase 1. If only one service changed, only one job runs!

For each modified backend service, the pipeline executes the following steps:

#### Step A: Idempotent Database Cloning (`scripts/clone_db.sh`)
Before deploying the code, the pipeline SSHs into the Staging VM and runs the `clone_db.sh` script, passing the service name and PR number as arguments.

**Example DB Name Mapping:**
If PR #5 is opened, the script creates isolated namespaces by appending the PR number:
- **Order Service:** Clones staging `order_db` ➔ Creates PR isolated `order_db_pr_5`
- **Inventory Service:** Clones staging `inventory_db` ➔ Creates PR isolated `inventory_db_pr_5`
- **Notification Service:** Clones staging `notification_db` ➔ Creates PR isolated `notification_db_pr_5`


**1. The Environment Setup:**
The script defines a base `COMPOSE_CMD` that injects the `.env` file so the script can dynamically read the root database passwords:
`COMPOSE_CMD="docker compose -f infra/docker-compose.staging.yml --env-file $HOME/.../.env"`

**2. Idempotency Check:**
To prevent overwriting test data if a developer pushes a second commit, the script runs a non-interactive query to check if the PR database (e.g., `order_db_pr_5`) already exists.
- **Postgres:** `$COMPOSE_CMD exec -T postgres-db psql ... -tAc "SELECT 1 FROM pg_database WHERE datname='order_db_pr_5'"`
- **MySQL:** `$COMPOSE_CMD exec -T mysql-db mysql ... -se "SELECT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'inventory_db_pr_5')"`
- **MongoDB:** `$COMPOSE_CMD exec -T mongo-db mongosh --quiet --eval "db.getMongo().getDBNames().indexOf('notification_db_pr_5') >= 0"`
If any of these queries return true/1, the script outputs *"Skipping clone to preserve PR data."* and immediately exits with a success code (`exit 0`), skipping the rest of the clone process.

**3. The Lightning-Fast Data Piping:**
If the database does not exist, the script creates it, and then directly pipes the data from the staging database into the new PR database. This happens entirely within the Docker container network (no files are saved to the VM disk, making it extremely fast). Note the use of `-T` to disable pseudo-TTY allocation, which prevents GitHub Actions from hanging:

- **Postgres (Order Service):**
  `$COMPOSE_CMD exec -T postgres-db pg_dump -U user order_db | $COMPOSE_CMD exec -i postgres-db psql -U user -d order_db_pr_5`
- **MySQL (Inventory Service):**
  `$COMPOSE_CMD exec -T mysql-db mysqldump -u root -p password inventory_db | $COMPOSE_CMD exec -i mysql-db mysql -u root -p password inventory_db_pr_5`
- **MongoDB (Notification Service):**
  Because MongoDB is document-based, we use the `--archive` flag to stream the BSON data across the pipe, and the `--nsFrom/--nsTo` flags to dynamically rename the collections from the staging DB to the PR DB on the fly!
  `$COMPOSE_CMD exec -T mongo-db mongodump --db=notification_db --archive | $COMPOSE_CMD exec -i mongo-db mongorestore --archive --nsFrom="notification_db.*" --nsTo="notification_db_pr_5.*"`

#### Step B: Build & Push Container
- The service is built into a Docker container.
- For the **Frontend**, specific build arguments (`VITE_CLOUD_RUN_SUFFIX` and staging fallback URLs) are baked into the image so it knows how to route traffic dynamically.
- The container is pushed to Google Artifact Registry (GAR).

#### Step C: Deploy to Cloud Run
The container is deployed to Google Cloud Run as an ephemeral instance.
- **VPC Egress:** Backend services are deployed with `--vpc-egress private-ranges-only` and attached to the Serverless VPC Connector. This allows them to securely talk to the isolated PR databases inside the Staging VM (`10.x.x.x`), while routing inter-service traffic over the public internet.
- **Environment Variables:** The deployment dynamically sets the `DATABASE_URL` to point to the freshly cloned PR database on the internal VM IP.

### Phase 3: The PR Comment Bot
Once all matrix deployment jobs finish, a final aggregation job runs.
- It constructs a dynamic "Magic Link" for the reviewer.
- The link takes the ephemeral frontend URL (or the staging frontend URL if the frontend wasn't changed) and appends query parameters for *only* the backend services that were deployed (e.g., `?order_pr=5&inventory_pr=5`).
- The bot posts this link as a comment on the GitHub PR, allowing the reviewer to instantly test the isolated environment with a single click.

---

## 2. The Cleanup Pipeline (`cleanup-pr.yml`)
Triggered automatically when a Pull Request is **closed** or **merged**. 

Orphaned Cloud Run instances and unused databases cost money and waste storage. This workflow ensures zero waste by systematically tearing down everything the PR created.

### Phase 1: Database Teardown (`scripts/cleanup_pr.sh`)
- The workflow SSHs into the Staging VM and executes the `cleanup_pr.sh` script.
- Like the cloning script, it uses the `COMPOSE_CMD` to securely authenticate against the databases without hardcoding credentials in the script.
- Based on the service that changed, the script connects to the corresponding database container via `docker compose exec` and safely executes a drop command:
  - **Postgres:**
    `$COMPOSE_CMD exec -T postgres-db psql -U user -d postgres -c "DROP DATABASE IF EXISTS order_db_pr_5;"`
  - **MySQL:**
    `$COMPOSE_CMD exec -T mysql-db mysql -u root -p password -e "DROP DATABASE IF EXISTS inventory_db_pr_5;"`
  - **MongoDB:**
    Since MongoDB doesn't use SQL, it executes a JavaScript evaluation via the new `mongosh` CLI to drop the specific database namespace:
    `$COMPOSE_CMD exec -T mongo-db mongosh --eval "db.getSiblingDB('notification_db_pr_5').dropDatabase()"`

### Phase 2: Cloud Run Teardown
- The workflow authenticates with Google Cloud using the VM's built-in Service Account.
- It forcefully deletes the specific Cloud Run services created for the PR (e.g., `order-service-pr-5`, `frontend-pr-5`).
- *(Note: This requires the VM to be configured with the "Allow full access to all Cloud APIs" access scope).*

---

## 💡 Summary of Efficiency
By combining **Path Filtering**, **Matrix Deployments**, and **Idempotent DB Cloning**, a developer can push 10 commits to a PR that only modifies the `inventory-service`, and the pipeline will:
- Skip deploying the Frontend.
- Skip deploying the Order Service.
- Skip deploying the Notification Service.
- Clone the Inventory DB exactly *once* on the first commit.
- Simply perform an ultra-fast Cloud Run image update for the Inventory Service on subsequent commits.
