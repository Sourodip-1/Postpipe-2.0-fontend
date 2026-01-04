# PostPipe Connector

This is a self-hosted connector for [PostPipe](https://postpipe.in).
It acts as a secure bridge between PostPipe's Ingest API and your private database.

## 🚨 Security Principles

1.  **Zero Trust**: This connector never trusts the payload blindly. It verifies the request signature `X-PostPipe-Signature` using your `POSTPIPE_CONNECTOR_SECRET`.
2.  **No Leaks**: Database credentials exist ONLY in this environment. PostPipe never sees them.
3.  **Audit**: All security logic is in `src/lib/security.ts`. You are encouraged to read it.

## 🚀 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy `.env.example` to `.env` and fill in your details:

```env
POSTPIPE_CONNECTOR_ID=pp_conn_...
POSTPIPE_CONNECTOR_SECRET=...     # Keep this secret!
DB_TYPE=mongodb                   # mongodb | postgres | supabase
```

### 3. Run Locally

```bash
npm run dev
```

The server will listen on port 3000.
Endpoint: `POST http://localhost:3000/postpipe/ingest`

## 📦 Deployment

### Docker

```bash
docker build -t my-connector .
docker run -p 3000:3000 --env-file .env my-connector
```

### Vercel / Serverless

This project is set up as a standard Express app. To deploy to Vercel, simply add a `vercel.json`:

```json
{
  "version": 2,
  "builds": [{ "src": "src/server.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.ts" }]
}
```

## 🛠 Troubleshooting

- **Invalid Signature**: Check that `POSTPIPE_CONNECTOR_SECRET` matches exactly what is in your PostPipe Dashboard.
- **Timestamp Skew**: Ensure your server's clock is synced (NTP). Requests older than 5 minutes are rejected.

## 🌐 Multi-Database Routing

This connector supports routing submissions to different databases based on the Form configuration.

### 1. Configure in Web App

In the **Form Builder**, use the **Target Database** feature:

1.  Click **[+ Add DB]**.
2.  Enter an ID (e.g., `marketing`).
3.  Select this ID for your form.

### 2. Configure Connector Environment

The connector dynamically looks for an environment variable matching the ID:

```env
# Default DB
MONGODB_URI=mongodb+srv://...

# Secondary DB (ID: "marketing")
MONGODB_URI_MARKETING=mongodb+srv://...

# Another DB (ID: "finance")
MONGODB_URI_FINANCE=mongodb+srv://...
```

**Note**: The connector automatically maps the ID to uppercase and prepends `MONGODB_URI_`.

### 3. Data Fetching

You can fetch submissions directly from the connector (bypassing PostPipe cloud) using the local API:

**Endpoint**: `GET /api/postpipe/forms/:formId/submissions`

**Parameters**:

- `limit` (optional): Number of records (default 50).

**CORS**: Enabled by default for all origins.
