# E-commerce CLI (`create-postpipe-ecommerce`) 🛒

Build a scalable, feature-rich E-commerce backend in minutes with `create-postpipe-ecommerce`.

## Overview

This tool scaffolds all the necessary API routes, Database Models, and Server Actions required to run a modern online store. It is designed to work seamlessly with Next.js App Router.

## Usage

```bash
npx create-postpipe-ecommerce
```

## Features Included

### 1. Product & Cart Management

- **Cart Logic**: Server-side cart validation.
- **Wishlist**: User-specific wishlists.
- **Reviews**: Product review system with ratings.

### 2. Order Processing

- **Order Model**: Comprehensive schema for tracking order status, payment info, and delivery details.
- **Checkout API**: Secure endpoints to handle order creation.

### 3. Advanced Features

- **Analytics**: Basic tracking for sales and views.
- **Notifications**: System for sending transactional emails (Order Confirmation, Reset Password).
- **Admin Dashboard Ready**: The data structures are designed to be easily consumed by an admin panel.

## Directory Structure Created

```text
src/
├── app/
│   └── api/
│       └── shop/          # All e-commerce API routes
├── lib/
│   ├── actions/
│   │   └── shop.ts        # Server Actions (addToCart, etc.)
│   └── models/
│       ├── Cart.ts
│       ├── Order.ts
│       ├── Product.ts
│       ├── Review.ts
│       └── Wishlist.ts
```

## Integration

This tool pairs perfectly with `create-postpipe-auth` for handling the user accounts that these e-commerce features depend on.
