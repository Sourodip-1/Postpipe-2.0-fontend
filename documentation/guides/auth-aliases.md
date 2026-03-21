---
title: Auth Aliases
description: Learn how to manage multiple authentication systems using environment variable aliases.
---

# 🕵️ Auth Aliases

As your project grows, you might need different authentication settings for different parts of your application (e.g., a staging site, a blog, and a main app). PostPipe's **Auth Alias** system allows you to define custom suffixes for your environment variables, preventing collisions and making configuration management a breeze.

## 📝 Why use Auth Aliases?

By default, PostPipe looks for environment variables like `JWT_SECRET` or `SMTP_HOST`. However, if you have multiple "presets" (authentication configurations), you might want to use different secrets for each.

With an alias, you can tell PostPipe to look for `JWT_SECRET_MYAPP` instead of the global `JWT_SECRET`.

## ⚙️ How to Configure

1.  **Go to the Dashboard**: Navigate to the **Auth Preset Generator**.
2.  **Define an Alias**: In the "Advanced Settings" (or during creation), provide a **Preset Alias** (e.g., `BENTP`).
3.  **Update your .env**: Your environment variables should now use that alias as a suffix:
    ```env
    # Global variables
    FRONTEND_URL=https://postpipe.in

    # Aliased variables for "BENTP" preset
    FRONTEND_URL_BENTP=https://myapp.com
    JWT_SECRET_BENTP=your_super_secret_key
    SMTP_HOST_BENTP=smtp.mailgun.org
    ```

## 🚀 Usage in CDN

When initializing the PostPipe script in your frontend, you simply pass the `alias` parameter:

```html
<script 
  src="https://postpipe.in/api/public/cdn/auth.js" 
  data-alias="BENTP"
></script>
```

The script will now automatically pull the configuration associated with the `BENTP` suffix.

## ⚠️ Important Notes

-   **Case Sensitivity**: Aliases are usually converted to uppercase in environment variables (e.g., `bentp` becomes `_BENTP`).
-   **Fallback**: If an aliased variable is not found, PostPipe will NOT fallback to the global one by default to ensure security and prevent accidental configuration leaks.
-   **Branding**: Aliases also help in branding, as they are often used to derive project-specific identifiers.

---

[Back to Introduction](/docs/introduction)
