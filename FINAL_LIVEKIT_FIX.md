# 🔴 URGENT: Your LiveKit Credentials Are Invalid

## 🎯 The Root Problem

**Your backend is generating EMPTY tokens:**

```json
{
  "token": {},           // ❌ EMPTY! Should be a long JWT string
  "wsUrl": "wss://placeholder.livekit.cloud"  // ❌ PLACEHOLDER!
}
```

**This is because `.env` has placeholder values.**

---

## 🔍 Why You See "ai-telephonic-ai-assistant" URL

The error showing `https://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud` is either:

1. **Browser cache** from a previous session
2. **Someone configured it before** and then reset to placeholders
3. **LocalStorage/SessionStorage** in browser

**This is NOT the current backend URL.** The backend is currently returning `wss://placeholder.livekit.cloud`.

---

## ✅ THE FIX (Step by Step)

### **Step 1: Clear Everything**

```bash
cd /home/user/webapp

# Stop backend
pkill -f "node.*server"

# Clear browser data (in browser):
# 1. Open DevTools (F12)
# 2. Application tab → Clear storage → Clear site data
# OR use Incognito/Private window
```

### **Step 2: Do You Have a LiveKit Account?**

**Choose A or B:**

#### **Option A: I Have LiveKit Account**

1. Go to https://cloud.livekit.io
2. Log in
3. Look for project: **ai-telephonic-ai-assistant-hdii7zf0**
   - If you find it: Go to Settings → Keys
   - If you don't find it: It was deleted, create new project (Option B)

#### **Option B: I DON'T Have LiveKit Account (Or Project Was Deleted)**

1. Go to https://livekit.io
2. Click "Get Started Free"
3. Sign up (2 minutes, no credit card)
4. Create new project
5. Name it anything (e.g., "Interview App")

### **Step 3: Get Your THREE Credentials**

From LiveKit Dashboard → Settings → Keys:

```
Copy these THREE values:

1. WebSocket URL
   wss://your-project-xxxxx.livekit.cloud

2. API Key
   APIxxxxxxxxxxxxxxxxx

3. API Secret
   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Step 4: Update .env File**

```bash
cd /home/user/webapp
nano .env
```

**Find and REPLACE these three lines:**

```bash
# BEFORE (placeholders):
VITE_LIVEKIT_URL=wss://placeholder.livekit.cloud
LIVEKIT_API_KEY=placeholder-livekit-key
LIVEKIT_API_SECRET=placeholder-livekit-secret

# AFTER (your real values):
VITE_LIVEKIT_URL=wss://your-actual-project.livekit.cloud
LIVEKIT_API_KEY=APIyour-actual-key
LIVEKIT_API_SECRET=your-actual-long-secret
```

**IMPORTANT:**
- ✅ Copy the FULL values
- ✅ No quotes around values
- ✅ No extra spaces
- ✅ API Key starts with "API"
- ✅ All three from SAME project

**Save:** `Ctrl+X` → `Y` → `Enter`

### **Step 5: Verify .env File**

```bash
cat .env | grep LIVEKIT
```

**Should see:**
```
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Should NOT see:**
- ❌ "placeholder" anywhere
- ❌ "your-project" (should be real project name)
- ❌ "xxxxxx" (should be real random characters)

### **Step 6: Restart Backend**

```bash
cd /home/user/webapp
npm run server
```

**Wait for:**
```
📋 Configuration Status:
  LiveKit: ✅ Configured  ← Must show ✅
```

### **Step 7: Test Token Generation**

```bash
curl -X POST http://localhost:3001/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test","participantName":"Test","interviewId":"123"}'
```

**Expected (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  ← Long JWT token
  "wsUrl": "wss://your-real-project.livekit.cloud"      ← Real URL
}
```

**If you see:**
```json
{
  "token": {},  ← Empty!
  "wsUrl": "wss://placeholder.livekit.cloud"  ← Placeholder!
}
```
Then .env is still wrong or backend didn't restart.

### **Step 8: Test Full Token Validation**

```bash
./test-livekit-token.sh
```

**Should show:**
```
✓ No placeholder values detected
✓ Token received
✓ Token is valid for XXX seconds
✓ Server accepted the token!
✅ All checks passed!
```

### **Step 9: Clear Browser Cache and Test**

1. **Open Incognito/Private window**
2. Go to http://localhost:5173
3. Sign in
4. Create job and candidate
5. Start interview
6. ✅ Should work without 401 error!

---

## 🔍 About "Regions"

You asked: "In livekit project there is nothing like region"

**Answer:** The `/settings/regions` endpoint DOES exist on LiveKit servers. It's used by the client SDK to determine the best region to connect to.

**The 401 error means:**
- ✅ Server exists
- ✅ Regions endpoint exists
- ❌ Your token is invalid (wrong credentials)

**It's NOT that regions don't exist. It's that your credentials are wrong.**

---

## 🧪 Debug Checklist

If still not working after following all steps:

```bash
# 1. Check .env has real values
cat .env | grep "placeholder"
# Should return NOTHING

# 2. Check backend is running with new config
ps aux | grep "node.*server"
# Should see process running

# 3. Check token endpoint returns real token
curl -s -X POST http://localhost:3001/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test","participantName":"Test","interviewId":"123"}' | grep "placeholder"
# Should return NOTHING

# 4. Restart frontend
pkill -f vite
npm run dev

# 5. Try from clean browser
# Use Incognito/Private window
```

---

## ⚠️ Common Mistakes

### **Mistake #1: Didn't actually save .env**
```bash
# Verify file was modified:
ls -la .env
# Check timestamp - should be recent
```

### **Mistake #2: Didn't restart backend**
```bash
# Backend MUST restart to read new .env
# Kill old process:
pkill -f "node.*server"
# Start new one:
npm run server
```

### **Mistake #3: Copied from wrong project**
```bash
# All three values MUST be from SAME project!
# Check in LiveKit Dashboard that you're in correct project
```

### **Mistake #4: Added quotes or spaces**
```bash
# WRONG:
LIVEKIT_API_KEY="APIxxxxxx"
LIVEKIT_API_KEY= APIxxxxxx

# CORRECT:
LIVEKIT_API_KEY=APIxxxxxx
```

---

## 📊 Quick Test Matrix

| Test | Expected Result | What It Means |
|------|----------------|---------------|
| `cat .env \| grep placeholder` | No output | .env is correct |
| `curl ...livekit-token` | Long JWT string | Backend configured |
| `./test-livekit-token.sh` | All ✓ passed | Token is valid |
| Open interview in app | Connects | Everything works! |

---

## 🆘 Still Failing?

**Show me these outputs:**

```bash
# 1. .env file (hide secrets)
cat .env | grep LIVEKIT | sed 's/=.*/=***HIDDEN***/'

# 2. Token test
curl -s -X POST http://localhost:3001/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test","participantName":"Test","interviewId":"123"}'

# 3. Backend logs
# (copy from terminal where npm run server is running)
```

---

## 🎯 Bottom Line

**The issue is NOT:**
- ❌ Time sync
- ❌ TTL expiration
- ❌ Missing regions
- ❌ Code bugs

**The issue IS:**
- ✅ **You're using placeholder credentials**
- ✅ **Backend generates empty/invalid tokens**
- ✅ **You need REAL LiveKit credentials**

**Solution:**
1. Get real credentials from https://livekit.io
2. Put them in .env
3. Restart backend
4. Test
5. Done!

---

**Time required: 5 minutes**  
**Cost: $0 (FREE)**  
**Difficulty: Easy**

**DO IT NOW! 🚀**
