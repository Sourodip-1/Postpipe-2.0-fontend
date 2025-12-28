# PostPipe CLI Ecosystem 🛠️

PostPipe offers a suite of modular CLI tools to help you scaffold authentication, appointments, forms, user management, and email utilities in seconds.

You can install the **Full Suite** or pick **Individual Modules**.

## Available Tools

| Category       | Command                           | Description                                                                                          |
| :------------- | :-------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **Core**       | `npx create-postpipe-connector`   | **The Essential Tool.** Scaffolds the self-hosted database connector.                                |
| **Auth**       | `npx create-postpipe-auth`        | [**Master Tool**](./auth.md). Scaffolds a complete Authentication system (Login, Signup, DB, Email). |
| **E-commerce** | `npx create-postpipe-ecommerce`   | [**E-commerce Suite**](./ecommerce.md). Full-stack shop backend & frontend logic.                    |
| **E-commerce** | `npx create-postpipe-shop`        | Scaffolds specific Shop features like Cart and Wishlist.                                             |
| **E-commerce** | `npx create-postpipe-delivery`    | Delivery tracking and management components.                                                         |
| **E-commerce** | `npx create-postpipe-payment`     | Components for payment processing integration.                                                       |
| **Features**   | `npx create-postpipe-appointment` | Appointment Booking System (Models, APIs).                                                           |
| **Features**   | `npx create-postpipe-form`        | Interactive Form APIs (Contact, Feedback, Newsletter).                                               |
| **Features**   | `npx create-postpipe-profile`     | User Profile management (Update Name, Change Password).                                              |
| **Features**   | `npx create-postpipe-cms`         | Scaffolds simple Content Management System capabilities.                                             |
| **Features**   | `npx create-postpipe-search`      | Scaffolds search functionality.                                                                      |
| **Features**   | `npx create-postpipe-notify`      | Notification system (Emails, Alerts).                                                                |
| **Features**   | `npx create-postpipe-analytics`   | Analytics tracking components.                                                                       |
| **Features**   | `npx create-postpipe-upload`      | File upload utilities.                                                                               |
| **Admin**      | `npx create-postpipe-admin`       | Scaffolds an Admin Dashboard.                                                                        |
| **Dev**        | `npx create-postpipe-crud`        | Basic CRUD (Create, Read, Update, Delete) template.                                                  |
| **Utils**      | `npx create-postpipe-email`       | Sets up Resend email utility.                                                                        |

## General Usage

All tools are designed to be run with `npx`.

```bash
npx [command-name]
```

Most tools will detect your project structure and ask configuration questions before generating files.

## Supported Databases

Currently, our CLI tools are optimized for:

- ✅ **MongoDB** (Fully Supported via Mongoose)
- 🚧 **PostgreSQL** (Coming Soon)
- 🚧 **DocumentDB** (Supported in select tools)

## Deep Dives

- [Authentication System](./auth.md)
- [E-commerce & Shop](./ecommerce.md)
- [Connectors](./connectors.md)
