# System Architecture 🏗️

PostPipe 2.0 uses a modern Monorepo architecture managed by TurboRepo. This allows us to maintain the core SaaS platform, the CLI tools, and shared UI libraries in a single, cohesive repository.

## Directory Structure

The high-level structure of the codebase is as follows:

```text
PostPipe-2.0/
├── apps/               # Next.js Applications
│   ├── web/            # The Main SaaS Platform (Dynamic Lab)
│   ├── dynamic/        # Dynamic App components (Internal)
│   └── static/         # Static Site Generation components (Internal)
├── cli/                # The CLI Ecosystem
│   ├── create-postpipe-connector/ # Scaffolder for connectors
│   └── components-cli/            # Storage for CLI Templates & Logic
├── packages/           # Shared Libraries
│   └── ui/             # Shared React/Shadcn UI components
├── documentation/      # You are here!
└── templates/          # Standard templates for various tech stacks
```

## Key Components

### 1. The SaaS Platform (`apps/web`)

This is the heart of PostPipe's cloud offering. It is a Next.js 14 application that handles:

- User Authentication (Dashboard login)
- Connector Management (Registration, Heartbeats)
- Form Building & Management
- Data Ingestion & Relay (The "Pipe" in PostPipe)

### 2. The CLI Ecosystem (`cli/`)

PostPipe allows developers to scaffold complex systems locally.

- **Wrapper**: The CLI tools are typically run via `npx`.
- **Templates**: The actual logic for generating code (e.g., Auth systems, E-commerce backends) resides in `cli/components-cli`. This modular approach allows us to update templates without forcing users to update a global binary.

### 3. Shared Packages (`packages/`)

To ensure design consistency between the SaaS platform and the generated user dashboards (where applicable), we share UI components (buttons, inputs, layouts) via the `packages/ui` workspace.

## Data Flow: The Zero Trust Model

The architecture is designed to support the Zero Trust flow:

1.  **Ingress**: A request hits `apps/web` (The Lab).
2.  **Routing**: The Lab looks up the `ConnectorID` and prepares the signed payload.
3.  **Tunneling**: The Lab forwards the payload to the specific active Connector instance.
4.  **Verification**: The Connector verifies the `X-PostPipe-Signature`.
5.  **Smart Execution**: The Connector resolves the `Target Database` and `DB Type` (Smart Resolution) and executes the operation.
6.  **Egress**: The result is sent back to `apps/web` and displayed to the user.
