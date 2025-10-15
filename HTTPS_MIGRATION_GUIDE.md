# 🔒 HTTPS Migration Guide

## Current Status: HTTP Only

Your application currently uses **HTTP** on these URLs:
- Frontend: `http://20.82.140.166:5173`
- Backend: `http://20.82.140.166:3001`

---

## Why HTTPS Matters

### Security Benefits
- ✅ **Encrypted traffic** - Prevents eavesdropping
- ✅ **Browser trust** - No "Not Secure" warnings
- ✅ **Microphone access** - Modern browsers require HTTPS for getUserMedia()
- ✅ **SEO benefits** - Google ranks HTTPS sites higher
- ✅ **Professional appearance** - Users trust HTTPS sites

### Browser Requirements
Modern browsers (Chrome, Firefox, Safari) **require HTTPS** for:
- Microphone/camera access
- Geolocation
- Service workers
- Push notifications

**Important:** Your AI interview platform uses **microphone access**, which works on `localhost` or HTTPS but **may be blocked on HTTP with IP addresses** in some browsers.

---

## Migration Options

### Option 1: Quick SSL with Caddy (Recommended for Azure VM)

**Pros:**
- Automatic SSL certificates (Let's Encrypt)
- Auto-renewal
- Simple configuration
- No manual certificate management

**Cons:**
- Requires domain name (can't use IP address)

**Requirements:**
- Domain name pointing to 20.82.140.166
- Ports 80 and 443 open in Azure NSG

---

### Option 2: Nginx Reverse Proxy with Let's Encrypt

**Pros:**
- Industry standard
- Flexible configuration
- Great documentation

**Cons:**
- Manual certificate management
- More complex setup
- Requires domain name

---

### Option 3: Azure Application Gateway (Enterprise)

**Pros:**
- Managed SSL termination
- Built-in DDoS protection
- Load balancing
- Web Application Firewall

**Cons:**
- Costs money (~$150/month)
- Overkill for single VM

---

### Option 4: Self-Signed Certificates (Development Only)

**Pros:**
- Works with IP address
- Free
- Quick setup

**Cons:**
- Browser warnings ("Not Secure")
- Not trusted by default
- Users must manually accept certificate
- **NOT for production**

---

## 🚀 Recommended Approach: Caddy with Domain

### Prerequisites

1. **Domain Name** (required)
   - Purchase from: Namecheap, GoDaddy, Google Domains, etc.
   - Or use free subdomain from: Freenom, No-IP, DuckDNS
   
2. **DNS Configuration**
   - Point A record to: `20.82.140.166`
   - Wait for DNS propagation (5-60 minutes)

3. **Azure NSG Rules**
   - Port 80 (HTTP) - for Let's Encrypt validation
   - Port 443 (HTTPS) - for secure traffic

---

## Step-by-Step: Caddy Setup

### Step 1: Get a Domain Name

**Free Options:**
- **DuckDNS** (https://www.duckdns.org)
  - Free subdomain: `your-interview-platform.duckdns.org`
  - Easy setup
  - Good for testing

**Paid Options:**
- Namecheap, GoDaddy, etc.
  - ~$10-15/year
  - Custom domain
  - Professional

### Step 2: Configure DNS

Point your domain to Azure VM:
```
Type: A
Name: @  (or subdomain)
Value: 20.82.140.166
TTL: 300
```

Verify DNS propagation:
```bash
nslookup your-domain.com
# Should show: 20.82.140.166
```

### Step 3: Install Caddy

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Step 4: Configure Caddy

Create `/etc/caddy/Caddyfile`:
```
your-domain.com {
    # Frontend (React)
    reverse_proxy localhost:5173
    
    # Backend API
    handle /api/* {
        reverse_proxy localhost:3001
    }
    
    # Enable automatic HTTPS
    tls {
        protocols tls1.2 tls1.3
    }
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # CORS (if needed)
    @cors_preflight method OPTIONS
    handle @cors_preflight {
        header Access-Control-Allow-Origin "*"
        header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        header Access-Control-Allow-Headers "Content-Type, Authorization"
        respond 204
    }
}
```

### Step 5: Update Environment Variables

Edit `/home/azureuser/webapp/.env`:
```env
# Change from HTTP to HTTPS
VITE_API_URL=https://your-domain.com

# Keep other variables the same
VITE_SUPABASE_URL=https://...
VITE_LIVEKIT_URL=wss://...
...
```

### Step 6: Update Azure NSG Rules

1. Go to Azure Portal
2. Your VM → Networking → Network Security Group
3. Add inbound rules:
   - **Port 80**: HTTP (for Let's Encrypt)
   - **Port 443**: HTTPS (for secure traffic)

### Step 7: Start Caddy

```bash
# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Start Caddy
sudo systemctl enable caddy
sudo systemctl start caddy
sudo systemctl status caddy
```

### Step 8: Restart Application

```bash
cd /home/azureuser/webapp
./cleanup-ports.sh
./start-all.sh
```

### Step 9: Test HTTPS

```bash
# Test SSL certificate
curl -I https://your-domain.com

# Should show:
# HTTP/2 200
# server: Caddy
# ...
```

**In browser:** `https://your-domain.com` ✅

---

## Alternative: Self-Signed Certificate (Development Only)

### When to Use
- Testing HTTPS locally
- No domain name available
- Development/staging only

### Setup

1. **Generate Self-Signed Certificate**
```bash
cd /home/azureuser/webapp
mkdir -p ssl
cd ssl

# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate (valid 365 days)
openssl req -new -x509 -key server.key -out server.crt -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=20.82.140.166"
```

2. **Update Backend for HTTPS**

Create `server/https-server.js`:
```javascript
const https = require('https');
const fs = require('fs');
const app = require('./index.js'); // Your Express app

const options = {
  key: fs.readFileSync('/home/azureuser/webapp/ssl/server.key'),
  cert: fs.readFileSync('/home/azureuser/webapp/ssl/server.crt')
};

const PORT = process.env.PORT || 3001;

https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 Backend HTTPS server running on https://20.82.140.166:${PORT}`);
});
```

3. **Update Vite for HTTPS**

Edit `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    https: {
      key: fs.readFileSync('/home/azureuser/webapp/ssl/server.key'),
      cert: fs.readFileSync('/home/azureuser/webapp/ssl/server.crt'),
    },
    strictPort: true
  }
})
```

4. **Update `.env`**
```env
VITE_API_URL=https://20.82.140.166:3001
```

5. **Accept Certificate in Browser**
- Visit `https://20.82.140.166:5173`
- Browser shows warning: "Not Secure"
- Click "Advanced" → "Proceed anyway"
- Certificate accepted for this session

**⚠️ Limitations:**
- Browser warnings every time
- Not trusted by users
- Can't be used in production
- Some browsers may block microphone access

---

## Code Changes Required

### Files to Update

1. **`.env`**
   ```env
   VITE_API_URL=https://your-domain.com
   ```

2. **`.env.example`**
   ```env
   VITE_API_URL=https://your-domain.com
   ```

3. **All Documentation** (*.md files)
   - Replace `http://20.82.140.166` with `https://your-domain.com`
   - Update examples and URLs

### Components (No Changes Needed!)

All React components already use:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://20.82.140.166:3001'
```

They will automatically use HTTPS once `VITE_API_URL` is updated.

---

## Testing HTTPS

### 1. SSL Certificate Validity
```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null

# Check expiration date
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 2. Security Headers
```bash
curl -I https://your-domain.com
```

Should include:
```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

### 3. SSL Labs Test
Visit: https://www.ssllabs.com/ssltest/
Enter your domain to check SSL configuration quality.

### 4. Browser Test
1. Open `https://your-domain.com`
2. Click padlock icon in address bar
3. Should show "Connection is secure"
4. Certificate issued by "Let's Encrypt"

---

## Troubleshooting

### Certificate Not Issuing

**Check DNS:**
```bash
nslookup your-domain.com
# Should return: 20.82.140.166
```

**Check Port 80:**
```bash
curl http://your-domain.com
# Let's Encrypt needs port 80 for validation
```

**Check Caddy Logs:**
```bash
sudo journalctl -u caddy -f
```

### Mixed Content Warnings

**Problem:** Page loads HTTPS but some resources use HTTP

**Solution:** Ensure all resources use HTTPS:
- API calls
- Images
- Scripts
- Stylesheets

### CORS Errors with HTTPS

**Problem:** CORS errors after switching to HTTPS

**Solution:** Backend already configured for CORS:
```javascript
app.use(cors({
  origin: '*',
  credentials: true
}))
```

Should work automatically.

---

## Maintenance

### Certificate Renewal
Caddy handles this automatically! Certificates renew 30 days before expiration.

**Check renewal status:**
```bash
sudo caddy list-modules
sudo journalctl -u caddy | grep -i renew
```

### Monitoring
```bash
# Check Caddy status
sudo systemctl status caddy

# View logs
sudo journalctl -u caddy -f

# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile
```

---

## Cost Comparison

| Option | Setup | Monthly Cost | Maintenance |
|--------|-------|--------------|-------------|
| **Caddy + Free Domain** | 1 hour | $0 | Auto |
| **Caddy + Paid Domain** | 1 hour | ~$1 | Auto |
| **Nginx + Let's Encrypt** | 2 hours | $0 | Manual renewal |
| **Azure App Gateway** | 30 min | ~$150 | Managed |
| **Self-Signed Cert** | 15 min | $0 | N/A (dev only) |

---

## Recommendation for Your Project

### For Production (Recommended)
1. **Get domain:** DuckDNS (free) or Namecheap ($10/year)
2. **Use Caddy:** Automatic SSL, easy setup
3. **Update environment variables** to use HTTPS
4. **Open ports 80 and 443** in Azure NSG
5. **Restart application**

**Total time:** 1-2 hours  
**Cost:** Free (or ~$10/year for domain)

### For Development/Testing
1. **Use HTTP** (current setup)
2. **Access via localhost** on VM
3. **Or use self-signed certificate** with browser warnings

### For Enterprise
1. **Azure Application Gateway**
2. **Managed SSL certificates**
3. **DDoS protection**
4. **Web Application Firewall**

---

## Current vs HTTPS URLs

### HTTP (Current)
```
Frontend: http://20.82.140.166:5173
Backend:  http://20.82.140.166:3001
```

### HTTPS (After Migration)
```
Frontend: https://your-domain.com
Backend:  https://your-domain.com/api
```

Note: Caddy reverse proxy routes both frontend and backend through single domain!

---

## Next Steps

1. **Decide on approach**
   - Production: Get domain + Caddy
   - Development: Keep HTTP or use self-signed cert

2. **If using Caddy:**
   - Register domain
   - Configure DNS
   - Follow setup steps above

3. **Update environment variables**
   - Change `VITE_API_URL` to HTTPS

4. **Update Azure NSG**
   - Open ports 80 and 443

5. **Test thoroughly**
   - SSL certificate validity
   - All API endpoints work
   - Microphone access works
   - No mixed content warnings

---

## Questions?

**Q: Can I use HTTPS with just an IP address?**  
A: Not with Let's Encrypt. You need a domain name. You can use self-signed certificates with IP, but browsers will show warnings.

**Q: Is HTTP okay for development?**  
A: Yes, but some browser features (microphone access) may not work on non-localhost HTTP.

**Q: How much does a domain cost?**  
A: Free (DuckDNS, Freenom) to ~$10-15/year (Namecheap, GoDaddy).

**Q: Will HTTPS slow down my app?**  
A: Negligible impact. Modern SSL/TLS is very fast.

**Q: Do I need to change my code?**  
A: Only environment variables. React components automatically use `VITE_API_URL`.

---

## Summary

**Current Status:** HTTP only (works but not secure)  
**Best Option:** Caddy + domain name (free/cheap, automatic SSL)  
**Time Required:** 1-2 hours  
**Difficulty:** Medium  
**Benefit:** Secure, trusted, professional

**Want to proceed with HTTPS migration? Let me know and I'll help with the specific setup!**
