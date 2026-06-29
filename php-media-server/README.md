# HolidayMart PHP Media Server Setup Guide (cPanel)

This folder contains the standalone, secure, production-ready PHP scripts to host image uploads and deletions for the subdomain `https://media.holidaymartbd.com`.

## 📁 Files Included
- `upload.php` - Processes image uploads, performs security checks (mime content, file size max 2MB), and generates unique cryptographically random names.
- `delete.php` - Deletes files, checks permissions, and protects against Path Traversal vulnerabilities.

---

## 🚀 Deployment Instructions for cPanel

1. **Create Subdomain**:
   - Log into your cPanel dashboard.
   - Go to **Domains** -> **Subdomains** and create a subdomain `media.holidaymartbd.com`.
   - Take note of the document root folder for the subdomain (usually `/public_html/media` or `/media.holidaymartbd.com`).

2. **Upload Scripts**:
   - Open cPanel **File Manager** and navigate to your subdomain's document root.
   - Upload `upload.php` and `delete.php` directly into the root folder.

3. **Create Upload Directories**:
   - Inside the subdomain root, create a folder named `uploads`.
   - Inside `uploads`, create three subfolders:
     - `products`
     - `vendors`
     - `categories`

4. **Configure Folder Permissions**:
   - Select the `uploads` folder and verify permissions.
   - The folders must be writable by the web server (typically permission code `0755`, or `0777` if required by your specific hosting config).

---

## 🔒 Security Requirements

### Change Shared API Key
To protect your media server from unauthorized uploads/deletions, both scripts require a header key `X-API-Key`.
1. Open both `upload.php` and `delete.php`.
2. Locate the line:
   ```php
   define('API_KEY', 'HolidayMartMediaSecuredToken2026!');
   ```
3. Change `'HolidayMartMediaSecuredToken2026!'` to a strong random passphrase of your choice. Ensure they match exactly in both files.

---

## 🧪 Testing the APIs

You can test your APIs using Postman or `curl` on your terminal.

### 1. Test Image Upload
Run the following command (replace with your domain and key):

```bash
curl -X POST \
  -H "X-API-Key: HolidayMartMediaSecuredToken2026!" \
  -F "folder=products" \
  -F "file=@/path/to/test-image.png" \
  https://media.holidaymartbd.com/upload.php
```

#### Successful JSON Response:
```json
{
  "status": "success",
  "message": "File uploaded successfully.",
  "filename": "7ef2b779a1f28b3401bde089aef7c510.png",
  "folder": "products",
  "url": "https://media.holidaymartbd.com/uploads/products/7ef2b779a1f28b3401bde089aef7c510.png"
}
```

---

### 2. Test Image Deletion (By URL)
Run the following command:

```bash
curl -X POST \
  -H "X-API-Key: HolidayMartMediaSecuredToken2026!" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://media.holidaymartbd.com/uploads/products/7ef2b779a1f28b3401bde089aef7c510.png"}' \
  https://media.holidaymartbd.com/delete.php
```

#### Successful JSON Response:
```json
{
  "status": "success",
  "message": "File deleted successfully.",
  "filename": "7ef2b779a1f28b3401bde089aef7c510.png",
  "folder": "products"
}
```

---

### 3. Test Image Deletion (By Folder and Filename)
Run the following command:

```bash
curl -X POST \
  -H "X-API-Key: HolidayMartMediaSecuredToken2026!" \
  -H "Content-Type: application/json" \
  -d '{"folder": "products", "filename": "7ef2b779a1f28b3401bde089aef7c510.png"}' \
  https://media.holidaymartbd.com/delete.php
```
