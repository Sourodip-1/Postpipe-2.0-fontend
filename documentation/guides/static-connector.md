---
title: Static Connector Setup
description: Connect your database to PostPipe.in using the PostPipe Connector.
---

> [!TIP] > **Ready to go securely?**  
> PostPipe's Static Connector creates an encrypted tunnel between your database and our platform. No firewall changes needed.

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
4.  **Config It**: In your deployment's "Environment Variables" settings, paste these:
    - `POSTPIPE_CONNECTOR_ID` (From Dashboard)
    - `POSTPIPE_CONNECTOR_SECRET` (From Dashboard)
    - `DB_TYPE` (e.g., `mongodb`)
    - `MONGODB_URI` (Your actual database connection string)

> [!NOTE] > **Using Multiple Databases?**  
> No problem! Just add more env vars like `MONGODB_URI_MAIN`, `MONGODB_URI_ANALYTICS`, etc.
> Then, map them in the [Database Dashboard](https://www.postpipe.in/dashboard/database) using the same variable names.

### Option B: The "Hacker" Way (CLI)

Prefer the terminal? We got you.

```bash
# Scaffold your agent
npx create-postpipe-connector my-agent

# Enter the void
cd my-agent

# Install dependencies
npm install
```

---

## 📝 Step 2: Create a Form

Now that we are connected, let's create a destination for your data.

1.  Log in to [PostPipe Dashboard](https://postpipe.in).
2.  Navigate to **[Forms](https://www.postpipe.in/dashboard/forms) → New Form**.
3.  Fill in the details and hit **Save**.

---

## 🧪 Step 3: Test the Flow

Time to see the magic happen! ✨

1.  Copy the **HTML/React code snippet** provided by your new Form.
2.  Paste it into your local project.
3.  **Save & Run**. Submit some test data.

> [!IMPORTANT] > **Check Your Firewall!**  
> Ensure your database allows incoming connections from your deployed connector (or all IPs `0.0.0.0/0` if you're testing).

---

## 🎉 DONE!

**Success!** Your data is now securely flowing into your database via PostPipe.

> [!SUCCESS]
> You have successfully bridged the gap between your frontend and your backend database. High five! ✋
