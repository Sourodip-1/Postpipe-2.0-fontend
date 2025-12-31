# Connector CLI (`create-postpipe-connector`) 🔌

The `create-postpipe-connector` tool scaffolds the "Zero Trust Agent" that lives in your infrastructure. This is the piece of software that actually talks to your database.

## Usage

```bash
# Syntax: node [path-to-cli] [project-name]
# Or via npx if published

npx create-postpipe-connector my-secure-connector
```

## How It Works

The generated connector is a lightweight Node.js application. It:

1.  **Polls** (or opens a WebSocket to) the PostPipe SaaS platform.
2.  **Listens** for query instructions targeted at its unique Connector ID.
3.  **Executes** the query against your local database (MongoDB, Postgres, etc.).
4.  **Returns** the encrypted results to PostPipe SaaS.

## Configuration

The connector relies heavily on environment variables for security. It never stores credentials in code.

**`.env` Example:**

```env
# Networking
PORT=3001

# Connection to PostPipe SaaS
POSTPIPE_SAAS_URL=https://api.postpipe.io (or http://localhost:3000 for local testing)
POSTPIPE_CONNECTOR_ID=generated_id_from_dashboard
POSTPIPE_CONNECTOR_SECRET=generated_secret_from_dashboard

# YOUR Database Credentials
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/
```

## Deployment

Since the connector is just a Node.js app, you can deploy it anywhere:

- **Local Machine**: For development.
- **Docker**: `Dockerfile` is often included or easy to add.
- **AWS EC2 / DigitalOcean Droplet**: Any VM with outbound internet access.
- **Internal Kubernetes Cluster**: Behind your corporate firewall.

**Note**: The connector does NOT need inbound ports open to the public internet. It only needs outbound access to PostPipe SaaS.
