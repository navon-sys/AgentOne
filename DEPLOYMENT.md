# 🚀 Deployment Guide

Complete guide for deploying the AI Interview Platform to production.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Supabase database schema deployed
- [ ] API keys have sufficient credits
- [ ] Build passes locally (`npm run build`)
- [ ] Setup verification passes (`npm run verify`)

## 🌐 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) [Recommended]

**Advantages:**
- ✅ Free tier available
- ✅ Auto-scaling
- ✅ Easy setup
- ✅ CI/CD included

#### Frontend to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables in Vercel dashboard:
# Settings → Environment Variables → Add:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_LIVEKIT_URL

# 5. Redeploy
vercel --prod
```

#### Backend to Railway

```bash
# 1. Go to https://railway.app
# 2. Create new project
# 3. Connect GitHub repo or deploy from CLI
# 4. Add environment variables:
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
DEEPGRAM_API_KEY
OPENAI_API_KEY
PORT=3001

# 5. Railway auto-deploys
```

#### Connect Frontend to Backend

Update `.env` in Vercel:
```env
VITE_API_URL=https://your-app.railway.app
```

---

### Option 2: Netlify (Frontend) + Render (Backend)

#### Frontend to Netlify

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build
npm run build

# 3. Deploy
netlify deploy --prod --dir=dist

# 4. Set environment variables in Netlify dashboard
```

#### Backend to Render

```bash
# 1. Go to https://render.com
# 2. New → Web Service
# 3. Connect GitHub repo
# 4. Configure:
   - Build Command: npm install
   - Start Command: npm run server
# 5. Add environment variables
```

---

### Option 3: DigitalOcean App Platform (Full Stack)

```bash
# 1. Create app.yaml
cat > app.yaml << 'EOF'
name: ai-interview-platform
services:
  - name: frontend
    github:
      repo: your-username/ai-interview-platform
      branch: main
    build_command: npm run build
    run_command: npm run preview
    envs:
      - key: VITE_SUPABASE_URL
        value: ${VITE_SUPABASE_URL}
      - key: VITE_SUPABASE_ANON_KEY
        value: ${VITE_SUPABASE_ANON_KEY}
      - key: VITE_LIVEKIT_URL
        value: ${VITE_LIVEKIT_URL}
    
  - name: backend
    github:
      repo: your-username/ai-interview-platform
      branch: main
    build_command: npm install
    run_command: npm run server
    envs:
      - key: LIVEKIT_API_KEY
        value: ${LIVEKIT_API_KEY}
      - key: LIVEKIT_API_SECRET
        value: ${LIVEKIT_API_SECRET}
      - key: DEEPGRAM_API_KEY
        value: ${DEEPGRAM_API_KEY}
      - key: OPENAI_API_KEY
        value: ${OPENAI_API_KEY}
      - key: PORT
        value: "3001"
EOF

# 2. Deploy via DigitalOcean dashboard or CLI
```

---

### Option 4: Docker + Cloud Run / AWS ECS

#### Create Dockerfile for Frontend

```dockerfile
# Dockerfile.frontend
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Create Dockerfile for Backend

```dockerfile
# Dockerfile.backend
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server ./server
COPY .env .env

EXPOSE 3001
CMD ["npm", "run", "server"]
```

#### Deploy to Google Cloud Run

```bash
# Frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/interview-frontend
gcloud run deploy interview-frontend --image gcr.io/PROJECT_ID/interview-frontend

# Backend
gcloud builds submit --tag gcr.io/PROJECT_ID/interview-backend
gcloud run deploy interview-backend --image gcr.io/PROJECT_ID/interview-backend
```

---

## 🔐 Environment Variables Setup

### Frontend Variables (Public)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_API_URL=https://your-backend.com (if separate deployment)
```

### Backend Variables (Private)

```env
LIVEKIT_API_KEY=APIxxx...
LIVEKIT_API_SECRET=secret...
DEEPGRAM_API_KEY=xxx...
OPENAI_API_KEY=sk-...
PORT=3001
CORS_ORIGIN=https://your-frontend.com
```

---

## 📊 Database Migration (Supabase)

Your Supabase database is already cloud-hosted, but ensure:

1. **Verify Tables Exist**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. **Check RLS Policies**
   ```sql
   SELECT * FROM pg_policies;
   ```

3. **Test Authentication**
   - Create a test user
   - Verify email confirmation works
   - Test login flow

---

## 🔒 Security Checklist

### Before Going Live

- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Set up CORS properly
- [ ] Use environment variables (never commit secrets)
- [ ] Enable Supabase RLS policies
- [ ] Set up rate limiting on APIs
- [ ] Configure API key restrictions (domain/IP)
- [ ] Enable Supabase email confirmations
- [ ] Set up monitoring and alerts

### API Key Security

#### OpenAI
- Set spending limits
- Restrict by domain/IP if possible
- Monitor usage dashboard

#### Deepgram
- Set up usage alerts
- Monitor credit consumption

#### LiveKit
- Set room expiration times
- Limit concurrent rooms
- Monitor bandwidth usage

---

## 📈 Performance Optimization

### Frontend

```javascript
// vite.config.js - Add code splitting
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'livekit': ['livekit-client', '@livekit/components-react']
        }
      }
    }
  }
})
```

### Backend

```javascript
// Add caching
import NodeCache from 'node-cache'
const cache = new NodeCache({ stdTTL: 600 })

// Rate limiting
import rateLimit from 'express-rate-limit'
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use('/api/', limiter)
```

---

## 🔍 Monitoring

### Set Up Monitoring

1. **Vercel/Netlify**
   - Built-in analytics
   - Real-time logs
   - Performance metrics

2. **Sentry** (Error Tracking)
   ```bash
   npm install @sentry/react @sentry/node
   ```

3. **LogRocket** (Session Replay)
   ```bash
   npm install logrocket
   ```

4. **Supabase**
   - Built-in analytics
   - Query performance
   - Auth metrics

---

## 🧪 Testing Production Build

Before deployment:

```bash
# 1. Build frontend
npm run build

# 2. Test production build locally
npm run preview

# 3. Test backend
NODE_ENV=production npm run server

# 4. Run verification
npm run verify

# 5. Check build size
ls -lh dist/assets/
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      # Deploy to Railway/Render/etc
```

---

## 🌍 Custom Domain

### Vercel
```bash
vercel domains add yourdomain.com
```

### Railway
1. Go to project settings
2. Add custom domain
3. Update DNS records

### Netlify
1. Domain settings → Add custom domain
2. Configure DNS

---

## 📧 Email Configuration

### Supabase Email Templates

1. Go to Authentication → Email Templates
2. Customize:
   - Confirmation email
   - Password reset
   - Magic link

3. Set up custom SMTP (optional):
   - Settings → Auth → SMTP Settings

---

## 🎯 Post-Deployment

### Verify Everything Works

```bash
# Health check
curl https://your-backend.com/api/health

# Test frontend
open https://your-frontend.com

# Check logs
vercel logs
railway logs
```

### Update Documentation

- [ ] Update README with production URLs
- [ ] Document any custom configurations
- [ ] Update .env.example if needed

---

## 🔧 Troubleshooting Production

### Frontend Issues

**White screen / Nothing loads**
```bash
# Check console for errors
# Verify environment variables in hosting dashboard
# Check if API URL is correct
```

**Supabase connection fails**
```bash
# Verify VITE_SUPABASE_URL is set
# Check CORS settings in Supabase
# Verify anon key is correct
```

### Backend Issues

**API returns 500**
```bash
# Check environment variables
# View logs: railway logs / render logs
# Verify all API keys are set
```

**LiveKit connection fails**
```bash
# Check LIVEKIT_URL format (wss://)
# Verify API key and secret
# Check CORS settings
```

---

## 💰 Cost Estimation

### Free Tier Limits

| Service | Free Tier | Sufficient For |
|---------|-----------|----------------|
| Supabase | 500MB DB, 2GB bandwidth | ~100 interviews/month |
| Vercel | 100GB bandwidth | ~10,000 visits/month |
| Railway | $5 credit/month | ~500 hours runtime |
| LiveKit | Development use | Testing only |
| Deepgram | $200 credit | ~30 hours audio |
| OpenAI | Pay per use | Variable |

### Estimated Monthly Cost (100 interviews)

- Hosting: $0-20
- LiveKit: $20-50
- Deepgram: $5-15
- OpenAI: $10-30
- **Total: ~$35-115/month**

---

## 📱 Mobile Optimization

Ensure these are set:

```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="mobile-web-app-capable" content="yes">
```

Test on:
- iOS Safari
- Android Chrome
- Various screen sizes

---

## ✅ Launch Checklist

Final steps before going live:

- [ ] All features tested
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificates active
- [ ] Custom domain configured
- [ ] Email templates customized
- [ ] Monitoring set up
- [ ] Error tracking active
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team trained on platform

---

## 🎉 You're Live!

Your AI Interview Platform is now deployed and ready for production use!

**Next Steps:**
1. Monitor initial usage
2. Gather user feedback
3. Optimize based on metrics
4. Scale as needed

**Support Resources:**
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- LiveKit Docs: https://docs.livekit.io

---

*For issues or questions, check logs and monitoring dashboards first.*
