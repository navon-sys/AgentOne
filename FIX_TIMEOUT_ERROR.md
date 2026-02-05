# 🔧 Fix: ERR_CONNECTION_TIMED_OUT Error

## 🚨 The Problem

```
POST http://20.82.140.166:3001/api/admin/create-user 
net::ERR_CONNECTION_TIMED_OUT
```

**Root Cause:** Frontend is trying to connect to Azure VM IP (20.82.140.166) instead of localhost.

---

## ✅ SOLUTION (Quick Fix)

### Option 1: Use Restart Script (Recommended)
```bash
cd /home/user/webapp
./restart-all.sh
```

This will:
- ✅ Stop all running services
- ✅ Verify .env configuration
- ✅ Clear Vite cache
- ✅ Start backend on localhost:3001
- ✅ Start frontend on localhost:5173

### Option 2: Manual Restart
```bash
# 1. Stop everything
pkill -f "node.*server"
pkill -f "vite"

# 2. Verify .env has correct URL
cd /home/user/webapp
grep VITE_API_URL .env
# Should show: VITE_API_URL=http://localhost:3001

# 3. Clear Vite cache
rm -rf .vite node_modules/.vite

# 4. Start backend
npm run server &

# 5. Start frontend (in new terminal or tab)
npm run dev
```

---

## 🔍 Why This Happened

### Problem 1: Wrong API URL in .env
The `.env.example` had:
```bash
VITE_API_URL=http://20.82.140.166:3001  # ❌ Azure VM IP
```

This should be:
```bash
VITE_API_URL=http://localhost:3001  # ✅ Local development
```

### Problem 2: Frontend Not Restarted
Environment variables are loaded when Vite dev server starts. If you:
1. Changed .env file
2. But didn't restart frontend
3. Old URL is still being used

### Problem 3: Vite Cache
Vite caches environment variables. Must clear cache after .env changes.

---

## ✅ Verification Steps

### Step 1: Check .env File
```bash
cd /home/user/webapp
cat .env | grep VITE_API_URL
```

**Expected output:**
```
VITE_API_URL=http://localhost:3001
```

**If you see anything else** (like 20.82.140.166), fix it:
```bash
# Edit .env file
nano .env

# Change line to:
VITE_API_URL=http://localhost:3001

# Save and exit (Ctrl+X, Y, Enter)
```

### Step 2: Verify Backend is Running
```bash
curl http://localhost:3001/api/health
```

**Expected output:**
```json
{
  "status": "ok",
  "services": {
    "livekit": true,
    "deepgram": true,
    "openai": true,
    "supabase": true
  }
}
```

**If you get "Connection refused":**
```bash
# Backend is not running, start it:
npm run server
```

### Step 3: Check Frontend Environment
Open browser console (F12) and run:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

**Expected output:**
```
http://localhost:3001
```

**If you see `http://20.82.140.166:3001`:**
- Frontend needs restart
- Run: `pkill -f "vite" && npm run dev`

### Step 4: Test Signup
1. Open http://localhost:5173
2. Click "Don't have an account? Sign Up"
3. Enter test email and password
4. Click "Create Account"
5. ✅ Should work now!

---

## 🛠️ Troubleshooting

### ❌ Still Getting Timeout Error

**Check 1: Is backend actually running?**
```bash
ps aux | grep "node.*server"
```

If nothing shows up:
```bash
cd /home/user/webapp
npm run server
```

**Check 2: Is frontend using correct URL?**
```bash
# In browser console (F12):
console.log(import.meta.env.VITE_API_URL)
```

If it shows wrong URL:
```bash
# Kill frontend
pkill -f "vite"

# Clear cache
rm -rf .vite node_modules/.vite

# Restart
npm run dev
```

**Check 3: Is .env file correct?**
```bash
cat .env | grep VITE_API_URL
```

Should be: `VITE_API_URL=http://localhost:3001`

**Check 4: Firewall blocking?**
```bash
# Test backend directly
curl -v http://localhost:3001/api/health
```

Should return JSON response, not connection refused.

---

## 🌐 Network Configuration Explained

### Local Development (Current)
```
Browser (localhost:5173)
    ↓
Frontend Dev Server (Vite)
    ↓ API calls to localhost:3001
Backend Server (Node.js)
    ↓
External APIs (Supabase, OpenAI, etc.)
```

**Configuration:**
```bash
VITE_API_URL=http://localhost:3001  # ✅ Correct
```

### Azure VM Deployment (Previous/Production)
```
Browser (anywhere)
    ↓ 
Azure VM IP (20.82.140.166:5173)
    ↓ API calls to 20.82.140.166:3001
Backend Server on Azure VM
    ↓
External APIs
```

**Configuration:**
```bash
VITE_API_URL=http://20.82.140.166:3001  # ❌ Wrong for local dev
```

---

## 📝 Environment Configuration Guide

### For Local Development
```bash
# .env file
VITE_API_URL=http://localhost:3001
PORT=3001
```

### For Production/Azure VM
```bash
# .env file
VITE_API_URL=http://YOUR_VM_IP:3001
# OR better, use a domain:
VITE_API_URL=https://api.yourdomain.com
PORT=3001
```

---

## 🔄 Complete Reset (If Nothing Works)

```bash
# 1. Go to project directory
cd /home/user/webapp

# 2. Stop everything
pkill -f "node"
pkill -f "vite"

# 3. Fix .env
cat > .env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys
OPENAI_API_KEY=your_openai_key
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
DEEPGRAM_API_KEY=your_deepgram_key

# Server Configuration
PORT=3001
VITE_API_URL=http://localhost:3001
EOF

# 4. Clear all caches
rm -rf .vite node_modules/.vite dist

# 5. Reinstall dependencies (if needed)
npm install

# 6. Use restart script
./restart-all.sh
```

---

## 🎯 Quick Commands Reference

| Task | Command |
|------|---------|
| Check .env | `cat .env \| grep VITE_API_URL` |
| Fix .env | `nano .env` (change VITE_API_URL) |
| Stop backend | `pkill -f "node.*server"` |
| Stop frontend | `pkill -f "vite"` |
| Clear cache | `rm -rf .vite node_modules/.vite` |
| Start backend | `npm run server` |
| Start frontend | `npm run dev` |
| **Restart all** | `./restart-all.sh` |
| Test backend | `curl http://localhost:3001/api/health` |
| Test API URL | Open console, run `console.log(import.meta.env.VITE_API_URL)` |

---

## ✅ Success Checklist

After following the fix:

- [ ] `.env` has `VITE_API_URL=http://localhost:3001`
- [ ] Backend running: `curl http://localhost:3001/api/health` works
- [ ] Frontend running: http://localhost:5173 opens
- [ ] Browser console shows correct API URL
- [ ] No timeout errors when creating user
- [ ] User creation succeeds

---

## 📞 Still Need Help?

If you're still getting the error:

1. **Show me your .env:**
   ```bash
   cat .env | grep -v "KEY\|SECRET" | grep -v "^#"
   ```

2. **Show me running processes:**
   ```bash
   ps aux | grep -E "(vite|node.*server)" | grep -v grep
   ```

3. **Show me the exact error:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try creating user
   - Screenshot the failed request

---

**TL;DR:**
1. ✅ Run `./restart-all.sh`
2. ✅ Make sure .env has `VITE_API_URL=http://localhost:3001`
3. ✅ Both services must be running on localhost
4. ✅ Clear browser cache if needed

**Now try again! 🚀**
