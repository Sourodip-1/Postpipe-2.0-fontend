# Introduction to PostPipe 2.0 🧪

Welcome to **PostPipe 2.0**, a cutting-edge platform designed to bridge the gap between your browser and your data, securely and efficiently.

## Core Philosophy

PostPipe is built on the principle of **Zero Trust**. In a world where data security is paramount, we believe that your database credentials should never leave your infrastructure.

Traditional secure tunnels or cloud proxies often require some level of trust in the intermediary. PostPipe flips this on its head by utilizing a **Zero Trust Connector** model.

## How It Works

The PostPipe architecture consists of three main components:

1.  **PostPipe SaaS (The Lab)**: The central dashboard and interface where you manage your forms, connectors, and view your data. It acts as the orchestration layer but _never_ sees your database credentials.
2.  **The Connector**: A self-hosted, lightweight Node.js secure agent that lives next to your database (on your laptop, server, or cloud VPC). It connects outbound to PostPipe SaaS.
3.  **The Browser**: The client-side interface that initiates requests.

### The Flow

1.  **Request Initiation**: When a user submits a form or requests data, the request goes to PostPipe SaaS.
2.  **Secure Handoff**: PostPipe SaaS identifies the correct active connector for that resource.
3.  **Local Execution**: The Connector receives the instruction, executes the database query locally using your credentials (which are stored ONLY in the connector's `.env` file), and securely sends the result back.
4.  **Result Delivery**: PostPipe SaaS relays the result to the browser.

This ensures that **PostPipe never holds the keys to your kingdom**.

## Key Features

- **Zero Trust Connectors**: Secure interactions without exposing DB credentials.
- **Universal Database Support**: Connect to MongoDB, PostgreSQL, DocumentDB, and more.
- **CLI Ecosystem**: A powerful suite of CLI tools to scaffold everything from Authentication to E-commerce backends in seconds.
- **Dynamic Lab**: A sophisticated testing environment for your integrations.
- **Monorepo Architecture**: specific, modular, and scalable codebase.

## Ready to Dive In?

Check out the [Getting Started](./getting-started.md) guide to spin up your first connector in minutes.
