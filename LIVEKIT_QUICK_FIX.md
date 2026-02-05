# ✅ SOLUTION: Fix Your LiveKit Credentials

## 🎯 The Problem

**Current situation:**
```bash
VITE_LIVEKIT_URL=wss://placeholder.livekit.cloud          # ❌ Placeholder
LIVEKIT_API_KEY=placeholder-livekit-key                    # ❌ Placeholder  
LIVEKIT_API_SECRET=placeholder-livekit-secret              # ❌ Placeholder
```

**Error you're seeing:**
```
GET https://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud/settings/regions 
401 (Unauthorized)
```

This error shows you had a real project (`ai-telephonic-ai-assistant-hdii7zf0`) but the credentials are now placeholders.

---

## ✅ SOLUTION: Get Your Real LiveKit Credentials

### **Option 1: If You Already Have a LiveKit Account**

#### **Step 1: Log in to LiveKit**
1. Go to: https://cloud.livekit.io
2. Log in with your account
3. You should see your projects

#### **Step 2: Find Your Project**
Look for project: **ai-telephonic-ai-assistant-hdii7zf0**

OR create a new one if this project was deleted.

#### **Step 3: Get Credentials**
1. Click on your project
2. Go to **Settings** → **Keys**
3. You'll see:

```
┌──────────────────────────────────────────────────┐
│ WebSocket URL                                    │
│ wss://ai-telephonic-ai-assistant-hdii7zf0...     │
│                                            [Copy] │
├──────────────────────────────────────────────────┤
│ API Key                                          │
│ APIxxxxxxxxxxxxxxxx                        [Copy] │
├──────────────────────────────────────────────────┤
│ API Secret                                       │
│ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   [Copy] │
└──────────────────────────────────────────────────┘
```

#### **Step 4: Update .env**
```bash
cd /home/user/webapp
nano .env
```

Replace these lines:
```bash
# OLD (placeholders)
VITE_LIVEKIT_URL=wss://placeholder.livekit.cloud
LIVEKIT_API_KEY=placeholder-livekit-key
LIVEKIT_API_SECRET=placeholder-livekit-secret

# NEW (your real credentials)
VITE_LIVEKIT_URL=wss://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud
LIVEKIT_API_KEY=APIyour-actual-key-here
LIVEKIT_API_SECRET=your-actual-secret-here
```

Save: `Ctrl+X`, then `Y`, then `Enter`

#### **Step 5: Restart Services**
```bash
cd /home/user/webapp
./restart-all.sh
```

---

### **Option 2: If You Don't Have LiveKit Account**

#### **Step 1: Sign Up (FREE)**
1. Go to: https://livekit.io
2. Click **"Get Started Free"**
3. Sign up with email
4. Verify email

#### **Step 2: Create Project**
1. After login, click **"New Project"**
2. Name: "AI Interview Platform"
3. Click **"Create"**

#### **Step 3: Get Credentials**
1. You'll be redirected to project dashboard
2. Go to **Settings** → **Keys**
3. Copy:
   - WebSocket URL
   - API Key  
   - API Secret

#### **Step 4: Update .env**
Same as Option 1, Step 4 above.

#### **Step 5: Restart**
Same as Option 1, Step 5 above.

---

## 🧪 Verify the Fix

### **Step 1: Run Diagnostic**
```bash
cd /home/user/webapp
./diagnose-livekit.sh
```

**Expected output:**
```
✓ No placeholder values detected
✓ URL starts with wss://
✓ URL ends with .livekit.cloud
✓ API Key starts with 'API'
✓ Backend can generate tokens
✓ Server is reachable
✓ Configuration looks correct!
```

### **Step 2: Test in App**
1. Open http://localhost:5173
2. Create job and candidate
3. Access interview link
4. Click "Start Interview"
5. Allow microphone access
6. ✅ Should connect without 401 error!

---

## 🔍 Understanding the Error

**What happened:**

```
Your Browser → Frontend
    ↓
Frontend calls /api/livekit-token
    ↓
Backend generates token with PLACEHOLDER credentials
    ↓
Frontend tries to connect to LiveKit with invalid token
    ↓
LiveKit server: 401 Unauthorized ❌
```

**What should happen:**

```
Your Browser → Frontend
    ↓
Frontend calls /api/livekit-token
    ↓
Backend generates token with REAL credentials ✅
    ↓
Frontend connects to LiveKit successfully
    ↓
Interview starts! 🎤
```

---

## 📋 Quick Commands

```bash
# Edit .env
nano .env

# Run diagnostic
./diagnose-livekit.sh

# Restart services
./restart-all.sh

# Test token generation
curl -X POST http://localhost:3001/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test","participantName":"Test","interviewId":"1"}'
```

---

## ⚠️ Important Notes

### **About the Project Name**

The URL `ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud` suggests:
- You (or someone) created a LiveKit project before
- Project name: "ai-telephonic-ai-assistant"
- Project ID: hdii7zf0

**Options:**
1. **Find this project** in your LiveKit dashboard
2. **OR create a new project** (will have different URL)

### **If Project Was Deleted**

If the old project was deleted:
1. Create new project in LiveKit
2. You'll get a different URL (that's OK!)
3. Update .env with new credentials
4. Everything will work the same

---

## 🆓 LiveKit Free Tier

**Perfect for development:**
- ✅ No credit card required
- ✅ 1,000 minutes/month FREE
- ✅ Up to 50 participants
- ✅ Unlimited rooms
- ✅ All features included

**Enough for:**
- Development and testing
- ~16 hours of interviews/month
- Demos and proof of concept

---

## 🔐 Security Reminder

**Never expose API Secret:**
- ✅ `VITE_LIVEKIT_URL` - Safe for frontend (public)
- ✅ `LIVEKIT_API_KEY` - Used in backend only
- ❌ `LIVEKIT_API_SECRET` - MUST stay in backend

**Current implementation is secure** ✅

---

## 🛠️ Still Not Working?

### **Check 1: Credentials Match**
Make sure URL, Key, and Secret are from the **same project**!

```bash
# In LiveKit Dashboard, verify:
# 1. You're in the correct project
# 2. All three values are from Settings → Keys
# 3. Copy button copies the FULL value
```

### **Check 2: Key Format**
```bash
# API Key should look like:
APIxxxxxxxxxxxxxxxx
# (starts with "API", followed by alphanumeric)

# API Secret should be:
# Long random string (30-50+ characters)
```

### **Check 3: No Extra Spaces**
```bash
# BAD (spaces):
LIVEKIT_API_KEY= APIxxxxxxx
LIVEKIT_API_KEY=APIxxxxxxx 

# GOOD:
LIVEKIT_API_KEY=APIxxxxxxx
```

### **Check 4: Restart Backend**
```bash
# Backend MUST restart to pick up new .env
pkill -f "node.*server"
npm run server
```

---

## ✅ Complete Checklist

- [ ] Have LiveKit account (sign up if needed)
- [ ] Have project in LiveKit dashboard
- [ ] Copied WebSocket URL to VITE_LIVEKIT_URL
- [ ] Copied API Key to LIVEKIT_API_KEY
- [ ] Copied API Secret to LIVEKIT_API_SECRET
- [ ] Saved .env file
- [ ] Restarted backend server
- [ ] Ran ./diagnose-livekit.sh (should pass)
- [ ] Tested interview in app
- [ ] ✅ Works!

---

## 🎯 Bottom Line

**You need 3 things from LiveKit Dashboard:**

1. **WebSocket URL** → `VITE_LIVEKIT_URL`
   - Example: `wss://your-project.livekit.cloud`

2. **API Key** → `LIVEKIT_API_KEY`
   - Starts with `API`
   - Example: `APIxxxxxxxxxxxxxxxx`

3. **API Secret** → `LIVEKIT_API_SECRET`
   - Long random string
   - Example: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Get them here:**
https://cloud.livekit.io → Your Project → Settings → Keys

---

## 📞 Help Resources

**LiveKit Dashboard:**
https://cloud.livekit.io

**LiveKit Documentation:**
https://docs.livekit.io

**Sign Up (FREE):**
https://livekit.io

**Support:**
- Discord: https://discord.gg/livekit
- Email: support@livekit.io

---

**Now go get your real LiveKit credentials! 🚀**

**Time needed: 5 minutes**  
**Cost: FREE**  
**Difficulty: Easy**
