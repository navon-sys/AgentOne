# 🔧 Fix: Backend Connection Error

## Error You're Seeing

```
Note: This application requires a running backend server with:
- LiveKit server configuration
- Deepgram API for speech recognition
- OpenAI API for AI responses
- Piper TTS for voice synthesis
```

**Root Cause:** The frontend can't connect to the backend API server. This can happen for several reasons.

---

## ✅ Quick Fixes Applied

I've already fixed the following:

### 1. Added VITE_API_URL to .env ✅

**Problem:** The frontend didn't know where to find the backend.

**Solution:** Added to your `.env` file:
```env
VITE_API_URL=http://20.82.140.166:3001
```

### 2. Restarted Both Servers ✅

**Status:**
- ✅ **Backend:** Running on port 3001 (responds to localhost)
- ✅ **Frontend:** Running on port 5173
- ⚠️ **Issue:** Backend doesn't respond to public IP (20.82.140.166)

---

## 🚨 Main Issue: Azure Firewall Blocking Traffic

### Problem

The backend server is running and responds to `localhost:3001` but **NOT** to `20.82.140.166:3001`.

**Test Results:**
```bash
# ✅ Works (localhost)
curl http://localhost:3001/api/health
{"status":"ok","services":{"livekit":true,"deepgram":true,"openai":true}}

# ❌ Times out (public IP)
curl http://20.82.140.166:3001/api/health
# Hangs forever...
```

**Diagnosis:** Azure Network Security Group (NSG) is blocking incoming traffic on port 3001.

---

## 🔧 Solution: Configure Azure NSG Rules

You need to open ports **5173** and **3001** in the Azure Portal.

### Step-by-Step Instructions

#### 1. Open Azure Portal
- Go to **https://portal.azure.com**
- Sign in with your Azure account

#### 2. Find Your VM
- Search for **"Virtual machines"** in the top search bar
- Click on your VM (the one with IP `20.82.140.166`)

#### 3. Navigate to Network Security Group
- In the left sidebar, scroll down to **"Networking"**
- Click **"Network settings"** or **"Networking"**
- You'll see a section called **"Network security group"**
- Click on the NSG name (looks like `vm-name-nsg`)

#### 4. Add Inbound Security Rules

**For Frontend (Port 5173):**

1. Click **"Inbound security rules"** in the left sidebar
2. Click **"+ Add"** at the top
3. Fill in the details:
   - **Source:** `Any` or `IP Addresses` (your IP)
   - **Source port ranges:** `*`
   - **Destination:** `Any`
   - **Service:** `Custom`
   - **Destination port ranges:** `5173`
   - **Protocol:** `TCP`
   - **Action:** `Allow`
   - **Priority:** `300` (or any number between 100-4096)
   - **Name:** `Allow-Frontend-5173`
   - **Description:** `Allow Vite frontend access`
4. Click **"Add"**

**For Backend (Port 3001):**

1. Click **"+ Add"** again
2. Fill in the details:
   - **Source:** `Any` or `IP Addresses` (your IP)
   - **Source port ranges:** `*`
   - **Destination:** `Any`
   - **Service:** `Custom`
   - **Destination port ranges:** `3001`
   - **Protocol:** `TCP`
   - **Action:** `Allow`
   - **Priority:** `301`
   - **Name:** `Allow-Backend-3001`
   - **Description:** `Allow Express backend API access`
3. Click **"Add"**

#### 5. Wait & Test (1-2 minutes)

Wait 1-2 minutes for Azure to apply the rules, then test:

```bash
# Test backend from your local machine (not the VM)
curl http://20.82.140.166:3001/api/health

# Should return:
# {"status":"ok","services":{"livekit":true,"deepgram":true,"openai":true}}
```

---

## 🧪 Verify Everything Works

### 1. Test Backend API

From **your local machine** (not the VM):

```bash
# Health check
curl http://20.82.140.166:3001/api/health

# Should return JSON with status "ok"
```

### 2. Test Frontend

Open browser on **your local machine**:
- **URL:** http://20.82.140.166:5173
- **Expected:** Should load the login/HR portal page
- **No errors:** The "requires running backend" message should disappear

### 3. Check Browser Console

1. Open the HR Portal: http://20.82.140.166:5173
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for errors:
   - ✅ **No errors:** Everything is working!
   - ❌ **"Failed to fetch" or "Network error":** NSG rules not applied yet (wait 1-2 min)
   - ❌ **"CORS error":** Backend needs CORS configuration (see below)

---

## 🔄 Alternative: Use SSH Tunnel (Temporary Solution)

If you can't configure Azure NSG rules immediately, you can use SSH tunneling as a workaround:

### From Your Local Machine

```bash
# Forward backend port
ssh -L 3001:localhost:3001 azureuser@20.82.140.166

# In another terminal, forward frontend port
ssh -L 5173:localhost:5173 azureuser@20.82.140.166
```

Then access:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001/api/health

**Update your local `.env`:**
```env
VITE_API_URL=http://localhost:3001
```

---

## 🔧 Additional Troubleshooting

### Issue: CORS Errors in Browser Console

**Error:**
```
Access to fetch at 'http://20.82.140.166:3001/api/...' from origin 
'http://20.82.140.166:5173' has been blocked by CORS policy
```

**Solution:** The backend already has CORS enabled for all origins. If you still see this, check:

1. **Verify backend CORS config:**
   ```bash
   cd /home/azureuser/webapp
   grep -A5 "app.use(cors" server/index.js
   ```

2. **Should see:**
   ```javascript
   app.use(cors({
     origin: '*',  // Allow all origins
     credentials: true
   }))
   ```

### Issue: Frontend Shows Old Error Message

**Problem:** You still see "requires running backend" even after fixing everything.

**Solution:** Hard refresh the browser:
- **Chrome/Firefox:** `Ctrl+Shift+R` or `Cmd+Shift+R` (Mac)
- **Or:** Clear browser cache and reload

### Issue: Backend Not Starting

**Check backend logs:**
```bash
cd /home/azureuser/webapp
tail -50 backend.log
```

**Common issues:**
- **Port already in use:** Run `./cleanup-ports.sh`
- **Missing dependencies:** Run `npm install`
- **Environment variables:** Check `.env` file has all required keys

### Issue: "node: command not found"

**Problem:** NVM not loaded in your shell.

**Solution:** Add to `~/.bashrc`:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Then reload:
```bash
source ~/.bashrc
```

---

## 📊 Server Status Check

Run this to check if servers are running:

```bash
cd /home/azureuser/webapp

echo "🔍 Checking Backend (port 3001)..."
sudo lsof -ti:3001 && echo "✅ Backend is running" || echo "❌ Backend not running"

echo ""
echo "🔍 Checking Frontend (port 5173)..."
sudo lsof -ti:5173 && echo "✅ Frontend is running" || echo "❌ Frontend not running"

echo ""
echo "🔍 Testing Backend API (localhost)..."
curl -s http://localhost:3001/api/health && echo "" || echo "❌ Backend not responding"

echo ""
echo "🔍 Testing Backend API (public IP)..."
timeout 5 curl -s http://20.82.140.166:3001/api/health && echo "" || echo "❌ Public IP blocked (check NSG rules)"
```

---

## 🚀 Recommended Startup Process

Create a helper script to start both servers properly:

### Create start-all.sh

```bash
cat > /home/azureuser/webapp/start-all.sh << 'EOF'
#!/bin/bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /home/azureuser/webapp

echo "🧹 Cleaning up ports..."
./cleanup-ports.sh

echo ""
echo "🚀 Starting Backend..."
nohup node server/index.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

sleep 2

echo ""
echo "🚀 Starting Frontend..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Servers Started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Access Points:"
echo "   Frontend: http://20.82.140.166:5173"
echo "   Backend:  http://20.82.140.166:3001"
echo ""
echo "🔍 Check Status:"
echo "   Backend logs:  tail -f backend.log"
echo "   Frontend logs: tail -f frontend.log"
echo ""
echo "⚠️  If you get connection errors:"
echo "   1. Check Azure NSG rules (see FIX_BACKEND_CONNECTION.md)"
echo "   2. Ensure ports 5173 and 3001 are open"
echo ""
EOF

chmod +x /home/azureuser/webapp/start-all.sh
```

### Usage

```bash
cd /home/azureuser/webapp
./start-all.sh
```

---

## ✅ Success Checklist

You'll know everything is working when:

- [ ] Backend responds to `curl http://localhost:3001/api/health` ✅ (Already working)
- [ ] Backend responds to `curl http://20.82.140.166:3001/api/health` ⚠️ (Needs NSG rules)
- [ ] Frontend loads at http://20.82.140.166:5173 ⚠️ (Needs NSG rules)
- [ ] No "requires running backend" error message ⚠️ (Needs NSG rules)
- [ ] Can create jobs in HR Portal
- [ ] Can add candidates and generate interview links
- [ ] Browser console shows no errors

---

## 📋 Current Status Summary

### ✅ What's Fixed
1. Added `VITE_API_URL=http://20.82.140.166:3001` to `.env`
2. Backend server running on port 3001
3. Frontend server running on port 5173
4. Backend responds to localhost successfully
5. All API keys configured (LiveKit, Deepgram, OpenAI)

### ⚠️ What Needs Action
1. **Azure NSG Rules:** Open ports 5173 and 3001 in Azure Portal
   - This is the **critical** step to make everything work externally
2. **Supabase Database Schema:** Run `supabase-schema.sql` (see FIX_DATABASE_ERROR.md)
3. **Supabase Site URL:** Configure for email confirmations

### 🎯 Priority Actions

**HIGH PRIORITY:**
1. Configure Azure NSG rules (ports 5173, 3001) - **DO THIS FIRST**
2. Test public IP access after NSG rules applied

**MEDIUM PRIORITY:**
3. Run database schema in Supabase SQL Editor
4. Configure Supabase Site URL for emails

---

## 📞 Quick Test Command

After configuring NSG rules, run this from **your local machine**:

```bash
# Test backend
curl http://20.82.140.166:3001/api/health

# Test frontend (in browser)
open http://20.82.140.166:5173
```

Both should work! 🎉

---

## 📚 Related Documentation

- **`AZURE_NETWORKING.md`** - Understanding Azure VM networking
- **`FIX_DATABASE_ERROR.md`** - Setting up Supabase database
- **`ACCESS_GUIDE.md`** - Public IP access troubleshooting
- **`QUICKSTART.md`** - Complete setup guide

---

**Next Step:** Configure Azure NSG rules as described above, then test the application! 🚀
