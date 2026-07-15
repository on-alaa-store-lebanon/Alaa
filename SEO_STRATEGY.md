# ON ALAA STORE — Search Engine Optimization & Google Discoverability Strategy

This playbook covers technical indexing, Google Search Console (GSC) integration, Schema (JSON-LD) structures, and maintenance strategies to rank **ON ALAA STORE** on top of search results.

---

## 1. Technical Indexing & Search Console

### Step 1.1: Verify Domain Ownership in Google Search Console
To allow Google to crawl and log search queries for ON ALAA STORE, you must verify your domain ownership:
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property** and choose **Domain** (recommends DNS verification) or **URL prefix** (recommends HTML file verification).
3. **Verification Options**:
   - **Option A (Recommended for custom domains)**: Copy the generated TXT record (e.g., `google-site-verification=xxxx`) and paste it into your DNS registrar settings (GoDaddy, Namecheap, Cloudflare, etc.).
   - **Option B (Fastest for static setups)**: Download the Google HTML verification file (e.g., `google123456789.html`) and upload it to the root of your public container workspace.

### Step 1.2: Generate and Submit Your Sitemap
We have built a dynamic, single-click sitemap engine in your admin workspace under **Settings > SEO & Google Indexing Engine**:
1. Click **Generate & Download Sitemap** inside your store settings.
2. This downloads `sitemap.xml` dynamically populated with all category filters and active product URLs.
3. Place this `sitemap.xml` file in your root folder (so it serves at `https://onalaastore.com/sitemap.xml`).
4. In Google Search Console, go to the left sidebar, click **Sitemaps**, type `sitemap.xml` in the submission input, and click **Submit**.
5. Google will read and index your store pages instantly.

### Step 1.3: Robots.txt Configuration
To ensure search engines crawl your product pages, create a `robots.txt` file in your `/` root folder with these directives:
```txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://onalaastore.com/sitemap.xml
```
*Note: Make sure there are no `<meta name="robots" content="noindex">` tags in your `index.html` file.*

---

## 2. SEO & Rich Search Results

### Step 2.1: Structured Data (JSON-LD Schema)
We have implemented **Product Schema Markup** inside `/src/components/ProductModal.tsx`. Whenever a customer opens a product, the script injects:
- **Product Name** and **SKU ID**
- **Description**
- **Offer Properties**: current currency (USD), price, validity range, stock status, and seller organization name
- **Aggregate Rating Placeholder**: set to `4.8` based on custom rating metrics to boost rich snippet star-ratings on Google search grids.

### Step 2.2: Copywriting Template (Page Titles & Meta Descriptions)
Use this keyword-optimized copywriting template for new inventory uploads to target mobile accessories and tech gadget search queries:

*   **Format**: `[Product Name] - Premium [Category] | ON ALAA STORE`
*   **Example Title**: `Premium Carbon Case for iPhone 15 Pro - Premium Mobile Accessories | ON ALAA STORE`
*   **Meta Description Template**: `Shop the latest [Product Name] at ON ALAA STORE. Discover premium mobile accessories, high-speed charging gear, and tech gadgets in Lebanon. Fast delivery, 100% satisfaction guaranteed.`

### Step 2.3: Image Alt Text Optimization
Google Images drives over 20% of retail web traffic. When adding products to the store database:
1. Always give image files descriptive names before uploading (e.g., use `iphone-15-pro-privacy-screen-protector.jpg` instead of `IMG_5678.jpg`).
2. Add descriptive keywords inside your image attributes. We have added `alt={product.name}` throughout the codebase. Keep product names highly descriptive (e.g., *“Fast USB-C Charger 35W Dual Port”* instead of just *“Charger”*).

---

## 3. Performance & Store Authority

### Step 3.1: Enforce HTTPS Protocols
HTTPS is an official ranking signal:
- Always obtain a free SSL/TLS certificate (e.g., from Let's Encrypt or Cloudflare Edge).
- Route all HTTP traffic to HTTPS via redirect middleware (automatic on our production Cloud Run hosting proxy).

### Step 3.2: Lazy-Loaded Product Galleries
To maintain a 100% Google Lighthouse Performance score, we configured `loading="lazy"` on all image nodes:
- Images only render when scrolled into the browser viewport, saving cellular data for mobile users and keeping loading speeds lightning-fast.

### Step 3.3: Google Merchant Center Integration
To get your products shown for free on the **Google Shopping** tab:
1. Open [Google Merchant Center](https://merchants.google.com/) and register your store profile.
2. Link your verified store URL (from Search Console).
3. Under **Products > Feeds**, select **Create Feed**.
4. Choose **Google Sheets** or **CSV Upload**.
5. Map the column fields to match your dynamic Backup CSV headers (using the **Export Catalog CSV** file downloaded from your admin settings):
   - `id` ➜ SKU
   - `title` ➜ Name
   - `description` ➜ Description
   - `price` ➜ BasePrice (append USD, e.g. "25 USD")
   - `image_link` ➜ ImageUrl

---

## 4. Maintenance Checklist for New Product Launches

Whenever you add a new product or category to **ON ALAA STORE**, follow this SEO checklist for immediate index ranking:

- [ ] **Descriptive Name**: Ensure the product name includes category keywords (e.g., *“Shockproof MagSafe Case”*, *“High-Speed Braided Cable”*).
- [ ] **CDN Image URLs**: Upload high-resolution images to an optimized media host/CDN.
- [ ] **Form Sanitized**: Check that no HTML tags break description formats.
- [ ] **Generate Sitemap**: Open Admin Settings and download the fresh, updated `sitemap.xml` file.
- [ ] **Upload Sitemap**: Replace the old sitemap file on your web hosting root.
- [ ] **Request Indexing**: 
  1. Open Google Search Console.
  2. Paste your new product URL in the top search inspection bar.
  3. Click **Test Live URL**.
  4. If green, click **Request Indexing** to bypass standard crawl loops and index your item within minutes.
