# PostPipe Connector Security Policy

## 🛡️ Core Security Model

The PostPipe Connector is designed with a **Zero Trust** architecture.
It assumes that the network is hostile and that PostPipe (the sender) is a potential vector for attack if compromised.

### 1. Authentication (HMAC-SHA256)

Every request sent to `/postpipe/ingest` is signed.

- **Header**: `X-PostPipe-Signature`
- **Algorithm**: HMAC-SHA256
- **Key**: `POSTPIPE_CONNECTOR_SECRET`

**Mitigation**: The connector recalculates the HMAC of the raw request body and compares it using `crypto.timingSafeEqual` to prevent timing attacks.

### 2. Replay Protection

Requests include a timestamp in the payload.
**Mitigation**: The connector rejects any request where `|CurrentTime - RequestTime| > 5 minutes`.
This prevents an attacker from capturing a valid request and re-sending it later.

### 3. Credential Isolation

- **Database Credentials**: Stored ONLY in `.env` on this server.
- **PostPipe**: Has NO access to your database credentials. It relies solely on the `POSTPIPE_CONNECTOR_ID` to route the webhook.

## 🔑 Secret Rotation

If you suspect your `POSTPIPE_CONNECTOR_SECRET` is compromised:

1.  Generate a new Secret in the PostPipe Dashboard.
2.  Update the `POSTPIPE_CONNECTOR_SECRET` in your `.env` file.
3.  Restart the connector.

**Note**: During rotation, requests signed with the old secret will fail. Schedule maintenance if high volume.

## 🕸️ Network Security

- **Public Access**: The specific endpoint `/postpipe/ingest` must be public.
- **HTTPS**: You **MUST** use HTTPS in production. If using Docker/Node, put a reverse proxy (Nginx/Cloudflare) in front.
- **Firewall**: Optionally whitelist PostPipe's egress IPs (check PostPipe docs for list) for defence-in-depth.

## 🐛 Reporting Vulnerabilities

If you find a security flaw in this connector implementation, please contact strict-security@postpipe.io.
