---
title: Static Connector Setup
description: Connect your database to PostPipe.in using the PostPipe Connector.
---

> [!TIP] > **Ready to go securely?**  
> PostPipe's Static Connector creates an encrypted tunnel between your database and our platform. No firewall changes needed.

## 📊 Visual Flow: How Data Moves

```mermaid
graph LR
    A[Frontend Form] -- "1. POST Payload" --> B(PostPipe SaaS)
    B -- "2. Signature Header" --> C{PostPipe Connector}
    C -- "3. Verify Signature" --> C
    C -- "4. Save to DB" --> D[(Your Database)]
    
    style B fill:#6366f1,color:#fff
    style C fill:#4f46e5,color:#fff
    style D fill:#10b981,color:#fff
```

## ⚡ Prerequisites

Before we blast off, ensure you have the following:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org))
- 🆔 **Account** at [PostPipe.in](https://postpipe.in)

---

## 🚀 Step 1: Create & Configure

Head over to the **[Static Connector Dashboard](https://www.postpipe.in/static)** and follow these moves:

### Option A: The "One-Click" Deploy (Recommended)

1.  **Name It**: Enter a cool name, e.g., `my-production-db`.
2.  **Fork It**: Click the **Fork Template** button to copy the connector code to your GitHub.
3.  **Deploy It**: Use **Vercel**, **Railway**, or **Azure** to deploy your new repo.
4.  **Config It**: In your deployment's dashboard (e.g., Vercel), navigate to **Environment Variables** and paste your credentials.
5.  **Install Command**: Ensure your build settings use `npm install` as the install command (Vercel usually detects this automatically).

### 🗄️ Database Setup

Depending on your database, set these variables in your environment:

#### **MongoDB**

- `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname`

#### **PostgreSQL / Supabase / Neon**

- `POSTGRES_URL=postgres://user:pass@host:5432/dbname` (or `DATABASE_URL`)

---

## 🛠️ Advanced Configuration

### 🌐 Multi-Database Routing

You can connect multiple databases to a single connector.

1. In the **Form Builder**, add a **Target Database ID** (e.g., `marketing`).
2. Add a corresponding environment variable: `MONGODB_URI_MARKETING` (all uppercase suffix).
3. The connector will automatically route submissions to the correct DB.

### 🧠 Smart Resolution

PostPipe 2.0 automatically resolves the database type per-form. If you name your target database something like `production-pg` or `neon-db`, the connector will intelligently use the PostgreSQL adapter even if your default `DB_TYPE` is set to `mongodb`.

### 🔒 Env Var Prefixing

If you have conflicting variable names in your hosting provider, set `POSTPIPE_VAR_PREFIX=MYAPP`. The connector will then look for `MYAPP_POSTPIPE_CONNECTOR_ID`, etc.

---

## 📡 Local Data Fetching (Bypassing SaaS)

Your connector acts as its own API. You can fetch submissions directly from your own infrastructure:

**Endpoint**: `GET /api/postpipe/forms/:formId/submissions`  
**Query Params**:

- `limit`: Number of records (default 50)
- `dbType`: `mongodb` or `postgres` (optional)

Example:

```bash
curl http://your-connector.vercel.app/api/postpipe/forms/form_123/submissions?limit=10
```

---

## 📝 Step 2: Create a Form

1. Log in to [PostPipe Dashboard](https://postpipe.in).
2. Navigate to **[Forms](https://www.postpipe.in/dashboard/forms) → New Form**.
3. Fill in the details and hit **Save**.

---

## 🧪 Step 3: Test the Flow

1. Copy the **HTML/React code snippet** provided by your new Form.
2. Paste it into your local project.
3. Submit test data and watch it appear in your DB!

> [!IMPORTANT] > **Check Your Firewall!**  
> Ensure your database allows incoming connections from your deployed connector's IP or whitelist `0.0.0.0/0` for testing.

---

## 🎉 NEXT STEPS

- [ ] [Learn about CLI Components](/docs/guides/cli-components)
- [ ] [View Architecture Details](/docs/architecture)
- [ ] [Join our Discord](https://discord.gg/postpipe)
