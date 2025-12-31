# Getting Started with PostPipe 2.0 🚀

This guide will walk you through setting up the PostPipe environment and running your first Zero Trust Connector simulation.

## Prerequisites

Before we begin, ensure you have the following installed:

- **Node.js 18+**: Required for all apps and CLI tools.
- **npm** (similiar package manager): Usually comes with Node.js.
- **MongoDB or Postgres**: securely running locally or in the cloud (for the connector to talk to).
- **Docker (Optional)**: If you plan on testing container deployments.

## The "Dynamic Lab" Simulation

PostPipe 2.0 comes with a fully simulated environment called the "Dynamic Lab" to test the flow:
`Browser -> PostPipe SaaS -> User Connector -> DB`.

### Step 1: Start the SaaS Simulation (The Lab)

The "Dynamic Lab" is the Next.js application that hosts the Dashboard and Mock Ingest API.

1.  Navigate to the project root.
2.  Run the development server:

    ```bash
    npm run dev:lab
    ```

    This will start the Lab on `http://localhost:3000`.

### Step 2: Create & Run a Connector

In a **separate terminal window**, you will generate and run your secure connector.

1.  **Generate a Connector**:
    Use the CLI to scaffold a new connector project.

    ```bash
    node cli/create-postpipe-connector/dist/index.js my-test-connector
    ```

2.  **Install & Configure**:
    Go into the new directory and install dependencies.

    ```bash
    cd my-test-connector
    npm install
    ```

3.  **Configure Ports (CRITICAL)**:
    Since the Lab runs on port 3000, your connector must run on a different port (e.g., 3001) to avoid conflicts locally.
    Open the `.env` file in `my-test-connector` and set:

    ```env
    PORT=3001
    ```

4.  **Start the Connector**:

    ```bash
    npm run dev
    ```

### Step 3: Test the Flow

Now that both the Lab (SaaS) and your Connector are running, let's connect them.

1.  Open the **Connector Demo Page** at [http://localhost:3000/connector-demo](http://localhost:3000/connector-demo).
2.  Enter your **Connector URL**: `http://localhost:3001/postpipe/ingest`.
    _(This tells the Lab where your local connector is listening)_
3.  Click **Generate Credentials**.
4.  Copy the generated `POSTPIPE_CONNECTOR_ID` and `SECRET`.
5.  Paste these values into your connector's `.env` file:
    ```env
    POSTPIPE_CONNECTOR_ID=...
    POSTPIPE_CONNECTOR_SECRET=...
    ```
6.  Restart your connector terminal to apply the changes.
7.  Go back to the browser and Submit the form on the Demo Page!

If successful, you will see data flow from the Browser, through the Lab, to your Connector, and back!

## Converting to CLI Usage

For everyday use, you can access the powerful CLI tools directly using `npx`. See the [CLI Documentation](./cli/index.md) for more details.
