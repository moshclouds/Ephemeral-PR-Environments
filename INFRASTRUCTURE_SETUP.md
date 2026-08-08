# 🚀 End-to-End Staging Infrastructure Setup Guide

Welcome to the infrastructure guide! This document explains exactly how to take a brand-new, empty Virtual Machine (VM) and turn it into a fully automated, SSL-secured staging environment for our microservices architecture. 

Whether you are a junior developer or a seasoned DevOps engineer, this guide will walk you through the **"how"** and the **"why"** of our setup.

---

## 🏗️ 1. Cloud Provider & Networking Setup

Before touching the terminal, you need a server and domain names.

1. **Spin up a Virtual Machine:**
   - We recommend **Ubuntu 22.04 LTS** on Google Cloud Platform (GCP), AWS EC2, or DigitalOcean.
   - It must have a static Public IP Address.

2. **Configure Firewalls (Security Groups):**
   - Your cloud provider blocks traffic by default. You must explicitly allow:
     - `Port 22` (TCP) - For SSH access.
     - `Port 80` (TCP) - For HTTP web traffic and Let's Encrypt SSL generation.
     - `Port 443` (TCP) - For secure HTTPS web traffic.

3. **Configure DNS (Domain Names):**
   - Go to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare).
   - Create three **A Records** pointing to your VM's Public IP:
     - `order-svc.yourdomain.com`
     - `inventory-svc.yourdomain.com`
     - `notification-svc.yourdomain.com`

---

## 🐳 2. VM Initialization & Docker Installation

SSH into your new VM. Our entire architecture runs on Docker, so we need to install the Docker Engine.

```bash
# 1. Update the VM's package manager
sudo apt-get update && sudo apt-get upgrade -y

# 2. Download and run the official Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Add your user to the "docker" group
# (This allows you to run docker commands without typing 'sudo' every time)
sudo usermod -aG docker $USER
```
⚠️ **CRITICAL:** After running the above commands, you **must type `exit`** to close your SSH session, and then log back in. The group permissions won't apply until you reconnect!

---

## 🤖 3. GitHub Actions CI/CD Pipeline Setup

We use GitHub Actions to automatically deploy code when it is pushed to the `main` branch. 
Instead of giving GitHub our server passwords, we install a **Self-Hosted Runner** directly on the VM. This runner actively listens to GitHub and pulls code securely.

1. On your computer, open this GitHub Repository in your browser.
2. Go to **Settings** -> **Actions** -> **Runners**.
3. Click **New self-hosted runner** and select **Linux**.
4. GitHub will give you a list of commands. Copy and paste them into your VM terminal to download and configure the runner.
5. **Install it as a background service** so it stays running even when you log out:
```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

---

## 🔐 4. The Secret Vault (Environment Variables)

For security reasons, passwords and database credentials are NEVER committed to GitHub. They are ignored by our `.gitignore` file. 
Because GitHub Actions cannot pull them, **you must manually create them on the VM.**

First, let's create the folder structure where our code will live:
```bash
mkdir -p ~/Ephemeral-PR-Environments/app/order-service
mkdir -p ~/Ephemeral-PR-Environments/app/inventory-service
mkdir -p ~/Ephemeral-PR-Environments/app/notification-service
mkdir -p ~/Ephemeral-PR-Environments/infra
```

Now, create the four hidden `.env` files. Notice how the database URLs use internal Docker network names (like `postgres-db`) instead of `localhost`. This is because the microservices talk to the databases securely inside Docker's internal network!

**1. Order Service Secrets:**
```bash
cat << 'EOF' > ~/Ephemeral-PR-Environments/app/order-service/.env
PORT=3000
DATABASE_URL="postgresql://user:password@postgres-db:5432/order_db?schema=public"
EOF
```

**2. Inventory Service Secrets:**
```bash
cat << 'EOF' > ~/Ephemeral-PR-Environments/app/inventory-service/.env
PORT=3001
DATABASE_URL="mysql://root:password@mysql-db:3306/inventory_db"
EOF
```

**3. Notification Service Secrets:**
```bash
cat << 'EOF' > ~/Ephemeral-PR-Environments/app/notification-service/.env
PORT=3002
DATABASE_URL="mongodb://mongo-db:27017/notification_db"
EOF
```

**4. Infrastructure Database Passwords:**
```bash
cat << 'EOF' > ~/Ephemeral-PR-Environments/infra/.env
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=order_db
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=inventory_db
EOF
```

---

## 🔒 5. The SSL "Chicken and Egg" Problem

We use NGINX as a reverse proxy to route internet traffic to our microservices. Our NGINX configuration (`default.conf`) mandates strict HTTPS security.

**The Problem:** If you try to start NGINX right now, it will crash. It will look for SSL certificates on the disk, fail to find them, and instantly shut down. But usually, NGINX *is the server* that Let's Encrypt uses to generate certificates!

**The Solution:** We run a temporary standalone server to generate the certificates *before* we ever start NGINX.

Run these three commands on your VM to generate independent certificates for each microservice. *(Change the emails and domains to your actual values!)*

```bash
cd ~/Ephemeral-PR-Environments/infra

# 1. Order Service Certificate
docker run -it --rm --name certbot \
  -v "$(pwd)/certbot_conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot_www:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --agree-tos --no-eff-email \
  -m your.email@example.com \
  -d order-svc.yourdomain.com

# 2. Inventory Service Certificate
docker run -it --rm --name certbot \
  -v "$(pwd)/certbot_conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot_www:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --agree-tos --no-eff-email \
  -m your.email@example.com \
  -d inventory-svc.yourdomain.com

# 3. Notification Service Certificate
docker run -it --rm --name certbot \
  -v "$(pwd)/certbot_conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot_www:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --agree-tos --no-eff-email \
  -m your.email@example.com \
  -d notification-svc.yourdomain.com
```
When these finish, your certificates will be safely saved in `infra/certbot_conf/live/`.

---

## 🚀 6. Triggering the Deployment

The environment is fully prepped! You have your runner, your secret `.env` files, and your SSL certificates.

**To deploy the application:**
Simply push a commit to the `main` branch on GitHub! 

**What happens next?**
1. Our `deploy.yml` workflow triggers the self-hosted runner.
2. It uses `rsync` to safely copy the new code to the VM without deleting your precious `.env` files or SSL certificates.
3. It runs `docker compose -f docker-compose.staging.yml up --build -d`.
4. Docker brings up the databases and **waits** (via Healthchecks) until they are fully initialized.
5. Docker brings up the Node.js microservices.
6. NGINX starts, finds the SSL certificates we generated earlier, and opens the floodgates to the internet!

---

## 🛠️ 7. Troubleshooting Cheatsheet

If something goes wrong, use these commands on your VM to debug:

**View the status of all containers:**
```bash
docker ps
```

**View the logs of a specific service:**
```bash
# E.g., if inventory-service crashes
docker logs infra-inventory-service-1
```

**View the logs of the entire infrastructure:**
```bash
cd ~/Ephemeral-PR-Environments/infra
docker compose -f docker-compose.staging.yml logs -f
```

**Restart everything cleanly:**
```bash
cd ~/Ephemeral-PR-Environments/infra
docker compose -f docker-compose.staging.yml down
docker compose -f docker-compose.staging.yml up -d
```
