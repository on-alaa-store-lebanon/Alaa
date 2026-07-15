# ON ALAA STORE — Production Deployment Blueprint & Hardening Guide

This blueprint covers the steps required to transition **ON ALAA STORE** from a local/preview development sandbox to a production-ready web storefront.

---

## 1. System Environment Configuration

Always store operational configurations and credentials in secure server-side environment files (`.env`). Create a `.env` file in your production server's root with the following declarations:

```env
# Node environment
NODE_ENV=production
PORT=3000

# Security Credentials
# CHANGE THIS key in production to secure administrative overrides!
ADMIN_MASTER_PASSWORD=A123321A

# Secure Salt for administrative credentials
SECURITY_HASH_SALT=::alaa-store-secure-salt-2026
```

---

## 2. High-Performance Build & Compression

To run the application with fast response times and low memory footprints:

### Step 2.1. Compile and Bundle Static Assets
Execute the optimized compiler script to strip development comments, bundle Tailwind utility styles, and compile assets:
```bash
npm run build
```
This yields the production assets inside the `/dist` output folder.

### Step 2.2. Verify Static Assets Asset Compression
Confirm that assets (CSS, JS) are served with Gzip or Brotli compression enabled via your server proxy (Nginx, Cloudflare, or Apache) for sub-second loading on mobile devices.

---

## 3. Media Hosting Optimization (Video & Images)

Because browser `localStorage` constraints limit local file sizes to ~5MB, production media MUST be hosted via a durable CDN or Object Storage container:

1. **Brand Logos**: Upload your brand logo image to a CDN (e.g., Cloudinary, Imgur, AWS S3) and save the direct HTTPS link in **Store Settings**.
2. **Hero Videos**: Upload MP4/WebM videos to an optimized media host or S3 Bucket. Direct-link the hosted URL under **Header Media Customizer > Use a Hosted Video URL**. This offloads browser rendering overhead and eliminates client-side buffer lag.

---

## 4. Hardening Security Checklist

Ensure the following security mitigations are fully validated prior to launching the public domain:

- [ ] **HTTPS Enforced**: Enforce strict HTTP Strict Transport Security (HSTS) headers. All commerce traffic and checkout links must execute over TLS (HTTPS).
- [ ] **Master Password Rotated**: Ensure the default master password (`A123321A`) is updated in `src/lib/auth.ts` or set through a cloud environment key.
- [ ] **Sanitized SQL & XSS Layers**: Confirm input values on administrative forms are routed through the `sanitizeInput` security engine.
- [ ] **Session Inactivity Lifespans**: Verify that administrative sessions expire and self-terminate after 10 minutes of user inactivity.
- [ ] **Audit Trail Active**: Verify that the "System & Security Audit Log" terminal is active and accessible via the **Team Management** dashboard to track rogue authorization failures.
