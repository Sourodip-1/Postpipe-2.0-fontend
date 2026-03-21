---
title: Choosing Your Path
description: Learn which PostPipe integration is right for your project.
---

# 🧭 Choosing Your Path

PostPipe offers two primary ways to integrate backend logic into your projects. Choosing the right one depends on your current setup and goals.

## 📊 Comparison Table

| Feature | **Static (Connector)** | **Dynamic (CLI)** |
| :--- | :--- | :--- |
| **Best For** | Existing apps, static sites | New projects, Next.js apps |
| **Setup Time** | 5-10 minutes | 2 minutes (Scaffolding) |
| **Control** | High (Your own DB/Server) | Full (Generated Code) |
| **Infrastructure** | Your Server + DB | Ready-to-use Modules |
| **Customization** | Via the Connector code | Direct code editing |
| **Pricing** | Free (Self-hosted bridge) | Free (Standard Modules) |

---

## 🔌 Static: The Connector

Use this if you already have a database and a frontend, but you want to securely ingest data (like form submissions) without writing complex API routes or handling SMTP yourself.

**The Workflow:**
1.  Deploy the **PostPipe Connector** (a small Express bridge).
2.  Configure your DB credentials in the Connector's environment.
3.  Link the Connector URL in your PostPipe Dashboard.
4.  Embed a simple script or use our Fetch API.

[Read Static Setup Guide](/docs/guides/static-connector)

---

## 🚀 Dynamic: CLI Components

Use this if you are starting a new Next.js project and want to "borrow" professional-grade backend logic for Auth, Payments, or Databases.

**The Workflow:**
1.  Run `npx create-postpipe-app@latest` in your terminal.
2.  Choose the components you need (e.g., Auth, Dashboard).
3.  The CLI scaffolds a complete, ready-to-use Next.js application.
4.  Deploy to Vercel/Netlify instantly.

[Read CLI Components Guide](/docs/guides/cli-components)

---

## 🤔 Still Unsure?

If you want to **keep your existing server**, go with the **Static Connector**. 
If you want to **build something brand new** with the best practices already baked in, go with the **CLI**.

[Back to Introduction](/docs/introduction)
