# Cloud Deployment Guide: College Complaint Management System

This guide outlines step-by-step instructions to deploy the application and its MySQL database to production on cloud hosting platforms.

---

## 🌟 Method 1: Deploy on Railway (Recommended & Fastest - 5 Minutes)

Railway provides both **Node.js Web Service** and **Managed MySQL Database** within the same project with automatic linking.

### Step 1: Push Repository to GitHub
Ensure the latest code is on GitHub:
```bash
git push origin main
```

### Step 2: Create a New Project on Railway
1. Go to [railway.app](https://railway.app) and sign in with your GitHub account.
2. Click **"New Project"** &rarr; select **"Provision MySQL"**.
3. Railway will provision a dedicated MySQL instance in under 1 minute.

### Step 3: Seed the Remote Database
1. Click on the MySQL card in Railway &rarr; go to the **Connect** tab.
2. Copy the `MYSQL_URL` (or connection variables: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, etc.).
3. From your local terminal, run the seed script targeting the cloud database:
   ```bash
   DATABASE_URL="<PASTE_YOUR_RAILWAY_MYSQL_URL>" npm run seed
   ```
   *(This initializes all 7 tables and seeds the demo student/staff/admin accounts).*

### Step 4: Deploy the Web Service
1. In the same Railway project, click **"New"** &rarr; select **"GitHub Repo"**.
2. Select `Roshnipbehera/college-complaint-management-system`.
3. In the Web service **Variables** tab, add:
   - `DATABASE_URL`: `${{MySQL.MYSQL_URL}}` *(Railway auto-completes this reference)*
   - `JWT_SECRET`: `college_complaint_jwt_secret_production_2026`
   - `JWT_EXPIRES_IN`: `1d`
   - `COOKIE_SECRET`: `college_complaint_cookie_production_2026`
   - `NODE_ENV`: `production`
4. Go to **Settings** &rarr; **Networking** &rarr; click **"Generate Domain"**.
5. Your app is live at `https://<your-project>.up.railway.app`!

---

## 🚀 Method 2: Deploy on Render + TiDB Cloud / Aiven (Free Tier)

Render hosts Node.js applications with free web services, paired with free cloud MySQL from TiDB Cloud or Aiven.

### Step 1: Provision a Free Cloud MySQL Database (TiDB Cloud / Aiven)
1. Go to [TiDB Cloud](https://tidbcloud.com) (Free Serverless Tier) or [Aiven](https://aiven.io).
2. Create a free MySQL cluster named `college_complaint_management`.
3. Note your connection details: `Host`, `User`, `Password`, `Port` (4000 for TiDB, 3306 for Aiven).
4. Run the seed script locally to populate the remote tables:
   ```bash
   DB_HOST="<HOST>" DB_USER="<USER>" DB_PASSWORD="<PASSWORD>" DB_PORT="<PORT>" DB_NAME="college_complaint_management" DB_SSL="true" npm run seed
   ```

### Step 2: Deploy Web Service on Render
1. Go to [render.com](https://render.com) and log in with GitHub.
2. Click **"New +"** &rarr; **"Web Service"**.
3. Connect your GitHub repository `Roshnipbehera/college-complaint-management-system`.
4. Configure the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `DB_HOST`: `<Your Cloud DB Host>`
   - `DB_USER`: `<Your Cloud DB User>`
   - `DB_PASSWORD`: `<Your Cloud DB Password>`
   - `DB_PORT`: `<Your Cloud DB Port>`
   - `DB_NAME`: `college_complaint_management`
   - `DB_SSL`: `true`
   - `JWT_SECRET`: `<A Secure Random String>`
   - `COOKIE_SECRET`: `<A Secure Random String>`
6. Click **"Deploy Web Service"**.
7. Once deployed, access the app at `https://college-complaint-management-system.onrender.com`.

---

## 🐳 Method 3: Run with Docker Compose (Local or VPS)

To deploy on any virtual private server (AWS EC2, DigitalOcean, Hetzner, or local machine) with Docker installed:

```bash
# Clone the repository
git clone https://github.com/Roshnipbehera/college-complaint-management-system.git
cd college-complaint-management-system

# Build and start both MySQL 8.0 and Node.js containers
docker compose up -d

# Seed the database inside the container network
docker compose exec web npm run seed
```
The app will be available at `http://<server-ip>:5000`.
