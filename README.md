# PostPipe 2.0 🧪

**Bridge the gap between your browser and your data, securely and efficiently.**

PostPipe 2.0 is a cutting-edge platform designed to enable secure data access without exposing your database credentials. Built on the principle of **Zero Trust**, it ensures that your sensitive keys never leave your infrastructure.

## 🌟 Core Philosophy

Traditional secure tunnels or cloud proxies often require some level of trust in the intermediary. PostPipe flips this on its head by utilizing a **Zero Trust Connector** model.

**Your database credentials should never leave your infrastructure.**

## 🛠️ How It Works

The PostPipe architecture consists of three main components:

1.  **PostPipe SaaS (The Lab)**: The central orchestration layer and dashboard. It manages forms and connectors but **never sees your database credentials**.
2.  **The Connector**: A self-hosted, lightweight Node.js secure agent that lives next to your database (on your laptop, server, or cloud VPC). It connects outbound to PostPipe SaaS using a secure ID and Secret.
3.  **The Browser**: The client-side interface that initiates requests.

testing

### The Zero Trust Flow

1.  **Request**: User initiates a request (e.g., submits a form) via the Browser to PostPipe SaaS.
2.  **Handoff**: PostPipe SaaS identifies the active connector.
3.  **Execution**: The **Connector** receives the instruction, executes the query locally using credentials stored **only** in its local `.env` file, and securely sends the result back.
4.  **Delivery**: PostPipe SaaS relays the result to the browser.

## 🚀 Key Features

- **🔒 Zero Trust Connectors**: Secure interactions without exposing DB credentials.
- **🌍 Universal Database Support**: Connect to MongoDB, PostgreSQL, DocumentDB, and more.
- **⚡ CLI Ecosystem**: A powerful suite of CLI tools (`create-postpipe-connector`, `create-postpipe-ecommerce`, etc.) to scaffold applications in seconds.
- **🧪 Dynamic Lab**: A sophisticated testing environment for your integrations.
- **📦 Monorepo Architecture**: specific, modular, and scalable codebase.

## 📖 Documentation

Expertly crafted documentation to get you up and running:

- **[Introduction](./documentation/introduction.md)**: Deep dive into the philosophy and architecture.
- **[Getting Started](./documentation/getting-started.md)**: Step-by-step guide to running your first simulation.
- **[Architecture](./documentation/architecture.md)**: Technical overview of the system.
- **[CLI Tools](./documentation/cli/index.md)**: Comprehensive guide to the PostPipe CLI ecosystem.

## ⚡ Quick Start (The "Dynamic Lab")

1.  **Start the SaaS (The Lab)**:

    ```bash
    npm run dev:lab
    # Runs on http://localhost:3000
    ```

2.  **Create a Connector**:

    ```bash
    # Open a new terminal
    node cli/create-postpipe-connector/dist/index.js my-test-connector
    cd my-test-connector
    npm install
    ```

3.  **Configure & Run**:
    - Set `PORT=3001` in `my-test-connector/.env`.
    - Run `npm run dev`.

4.  **Connect**:
    - Go to `http://localhost:3000/connector-demo`.
    - Enter Connector URL: `http://localhost:3001/postpipe/ingest`.
    - Generate credentials and add them to your connector's `.env`.

See the full **[Getting Started Guide](./documentation/getting-started.md)** for details.

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License**.

See the [LICENSE](./LICENSE) file for the full text.

---

_Built with ❤️ by the PostPipe Team_
