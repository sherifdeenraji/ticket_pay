# OAU TicketPay — Digital Transport Ticketing System

TicketPay is a centralized digital payment and ticketing platform designed to replace the prepaid physical ticket system at Obafemi Awolowo University (OAU). It allows students to fund their digital wallets via virtual accounts, pay for rides instantly using QR codes or driver codes, and enables drivers and administrators to monitor payments, statistics, and revenues in real-time.

---

## 🏗️ Project Architecture

This repository is structured as a monorepo containing three core applications:

```text
ticketpay/
├── .github/workflows/   # CI/CD Pipeline (Build gates & VPS deployment)
├── admin/               # Next.js Admin Dashboard (React, Tailwind, Shadcn)
├── backend/             # Express.js REST API (TypeScript, Postgres, Redis)
├── frontend/            # Next.js Student/User App (React, Tailwind, Shadcn)
├── docker-compose.yml   # Production-ready PostgreSQL & Redis services
└── init.sql             # SQL Database Schema (Auto-applied by Docker)
```

### Tech Stack
*   **Backend:** Node.js, Express.js (TypeScript), PostgreSQL, Redis, JWT.
*   **Frontends (Student & Admin):** Next.js (App Router), Tailwind CSS, Shadcn UI, Radix UI.
*   **Payment Gateway:** Nomba API (Virtual Accounts generation and HMAC-SHA256 Webhook processing).
*   **Process Management:** PM2 (for hosting and process recovery on a VPS).
*   **CI/CD:** GitHub Actions (Automated build gates and SSH deployment).

---

## 🛠️ Prerequisites

Make sure you have the following installed on your machine:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Git](https://git-scm.com/)

---

## 🚀 Local Development Setup

### 1. Database Setup (Docker)
We use Docker Compose to manage local PostgreSQL (PostGIS) and Redis instances.

1.  Make sure Docker is running on your machine.
2.  Start the database services in the background:
    ```bash
    docker compose up -d
    ```
    *This will automatically pull the local images, start the containers, and run the [[init.sql](file:///C:/Users/sheri/Desktop/Projects/ticketpay/init.sql)] script to create your database tables.*

---

### 2. Backend API Setup
1.  Navigate into the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables:
    *   Duplicate `.env.example` and rename it to `.env`.
    *   Add your Nomba Credentials (`NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, `NOMBA_ACCOUNT_ID`, `NOMBA_WEBHOOK_SECRET`).
    *   The database variables (`DB_USER`, `DB_PASSWORD`, `DB_NAME`) are already pre-configured to connect to your local Docker database.
4.  Seed the initial Admin user:
    ```bash
    npm run seed:admin
    ```
5.  Start the API server in watch/development mode:
    ```bash
    npm run dev
    ```
    *The API will start running at `http://localhost:5000`.*

---

### 3. Student/User Frontend Setup
1.  Navigate into the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    *The student app will start running at `http://localhost:3000`.*

---

### 4. Admin Dashboard Setup
1.  Navigate into the `admin` directory:
    ```bash
    cd ../admin
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *The admin dashboard will start running at `http://localhost:3001`.*

---

## 🔒 Security & Payment Integration (Nomba)

Secure transaction flows are managed via **Nomba**:
*   **OAuth 2.0 Auth Caching:** Access tokens are fetched via Nomba Client Credentials (`POST /v1/auth/token/issue`) and cached locally in-memory until expiration.
*   **Virtual Accounts:** When a student enters their phone number to complete their profile, Nomba generates a unique virtual bank account (`POST /v1/accounts/virtual`).
*   **HMAC-SHA256 Signature Verification:** Webhooks at `/api/wallet/webhook/nomba` are secured using the `nomba-signature` header and verified using your secret key to prevent payload spoofing.

---

## 📝 Logging System

Structured logging is implemented using a custom environment-aware logger:
*   **Local Development:** Logs are pretty-printed and color-coded for readability.
*   **Production:** Logs are output as structured, single-line JSON strings to stdout/stderr. This matches container/CloudWatch logging standards.
*   **HTTP Request Logging:** Every request, response code, and latency is automatically logged.

---

## 🚀 CI/CD Pipeline & Production Deployment

Deployment to a single VPS is managed via GitHub Actions.

### Build Verification Gate (CI)
Before any code is deployed, the pipeline compiles the Express API, Student Frontend, and Admin Dashboard on a virtual runner. If a compilation, syntax, or typescript check fails, the deployment halts.

### Deployment (CD)
If the build verification succeeds, the pipeline connects to your VPS via SSH and runs:
1.  `git pull` to fetch the latest changes.
2.  `docker compose up -d` to restart/update database services.
3.  `npm install --production` and `npm run build` on the apps.
4.  `pm2 reload` to restart your application processes under **PM2** with zero downtime.

#### Required GitHub Secrets:
Add the following secrets under your GitHub Repository Settings (Settings ➔ Secrets ➔ Actions):
*   `VPS_HOST` - The public IP of your VPS.
*   `VPS_USERNAME` - The SSH log-in username (e.g., `ubuntu`).
*   `VPS_SSH_KEY` - The private key used to connect to your server.
