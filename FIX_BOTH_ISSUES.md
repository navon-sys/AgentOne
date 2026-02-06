# 🚨 URGENT: Two Critical Issues to Fix

## Error You're Seeing

```
Invalid Interview Link
Cannot coerce the result to a single JSON object
```

## Root Causes (You Have BOTH Issues)

### ❌ **Issue #1: Supabase Credentials Are Placeholders**

```bash
VITE_SUPABASE_URL=https://placeholder.supabase.co      # ❌ FAKE
VITE_SUPABASE_ANON_KEY=placeholder-anon-key           # ❌ FAKE
```

### ❌ **Issue #2: LiveKit Credentials Are Placeholders**

```bash
VITE_LIVEKIT_URL=wss://placeholder.livekit.cloud      # ❌ FAKE
LIVEKIT_API_KEY=placeholder-livekit-key               # ❌ FAKE
LIVEKIT_API_SECRET=placeholder-livekit-secret         # ❌ FAKE
```

---

## ✅ COMPLETE FIX (Do ALL Steps)

### **PART A: Fix Supabase (Database)**

#### **Step A1: Get Supabase Credentials**

1. Go to: https://supabase.com/dashboard
2. Click on your project (or create one if you don't have)
3. Go to **Settings** → **API**
4. Copy these TWO values:

   - **Project URL**
     ```
     Example: https://abcdefgh.supabase.co
     ```

   - **anon public** key (NOT service_role!)
     ```
     Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     (long string, contains "role":"anon")
     ```

   - **service_role** secret key
     ```
     Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     (long string, contains "role":"service_role")
     ```

#### **Step A2: Update .env with Supabase Credentials**

```bash
nano /home/user/webapp/.env
```

Find and replace:
```bash
# BEFORE:
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key

# AFTER (your real values):
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key...
```

Save: `Ctrl+X` → `Y` → `Enter`

#### **Step A3: Set Up Database Tables**

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Copy the ENTIRE content from:
   ```bash
   cat /home/user/webapp/supabase-schema.sql
   ```
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for success message

#### **Step A4: Verify Tables Created**

In Supabase Dashboard:
- Go to **Table Editor**
- You should see these tables:
  - ✅ jobs
  - ✅ candidates
  - ✅ interviews
  - ✅ interview_transcripts

---

### **PART B: Fix LiveKit (Audio/Video)**

#### **Step B1: Get LiveKit Credentials**

You said you already created a new LiveKit project. Good!

1. Go to: https://cloud.livekit.io
2. Click on your project
3. Go to **Settings** → **Keys**
4. Copy these THREE values:

   - **WebSocket URL**
     ```
     Example: wss://myproject-abc123.livekit.cloud
     ```

   - **API Key**
     ```
     Example: APIxxxxxxxxxxxxxxxxx
     ```

   - **API Secret**
     ```
     Example: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

#### **Step B2: Update .env with LiveKit Credentials**

```bash
nano /home/user/webapp/.env
```

Find and replace:
```bash
# BEFORE:
VITE_LIVEKIT_URL=wss://placeholder.livekit.cloud
LIVEKIT_API_KEY=placeholder-livekit-key
LIVEKIT_API_SECRET=placeholder-livekit-secret

# AFTER (your real values):
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIyour-key
LIVEKIT_API_SECRET=your-secret
```

Save: `Ctrl+X` → `Y` → `Enter`

---

### **PART C: Restart Everything**

#### **Step C1: Verify .env File**

```bash
cat /home/user/webapp/.env | grep -E "SUPABASE|LIVEKIT"
```

**Should show:**
- ✅ Real Supabase URL (ends with `.supabase.co`)
- ✅ Real anon key (long JWT starting with `eyJ`)
- ✅ Real LiveKit URL (ends with `.livekit.cloud`)
- ✅ Real API key (starts with `API`)
- ❌ NO "placeholder" anywhere!

#### **Step C2: Restart Backend**

```bash
cd /home/user/webapp
pkill -f "node.*server"
npm run server
```

Wait for:
```
📋 Configuration Status:
  LiveKit: ✅ Configured
  Deepgram: ✅ Configured  
  OpenAI: ✅ Configured
  Supabase Admin: ✅ Configured
```

#### **Step C3: Restart Frontend**

```bash
pkill -f vite
npm run dev
```

#### **Step C4: Clear Browser Cache**

- **Option 1:** Use Incognito/Private window
- **Option 2:** Clear cache (F12 → Application → Clear storage)

---

## 🧪 Testing After Fix

### **Test 1: Create User Account**

1. Go to http://localhost:5173
2. Click "Sign Up"
3. Create account
4. ✅ Should work (no Supabase errors)

### **Test 2: Create Job**

1. Sign in
2. Go to "Jobs & Candidates"
3. Click "Create New Job"
4. Fill in details
5. ✅ Should save (no "column not found" errors)

### **Test 3: Create Candidate**

1. Select a job
2. Click "Add Candidate"
3. Enter name and email
4. ✅ Should create interview link

### **Test 4: Access Interview Link**

1. Copy the interview link
2. Open in new window/tab
3. ✅ Should show interview screen (no "Invalid Interview Link")

### **Test 5: Start Interview**

1. Click "Start Interview"
2. Allow microphone
3. ✅ Should connect (no LiveKit 401 error)

---

## 📋 Quick Checklist

- [ ] Got Supabase URL from dashboard
- [ ] Got Supabase anon key from dashboard
- [ ] Got Supabase service_role key from dashboard
- [ ] Got LiveKit WebSocket URL
- [ ] Got LiveKit API Key
- [ ] Got LiveKit API Secret
- [ ] Updated ALL SIX values in .env
- [ ] Saved .env file
- [ ] Ran Supabase SQL schema
- [ ] Verified tables created in Supabase
- [ ] Restarted backend
- [ ] Restarted frontend
- [ ] Cleared browser cache
- [ ] Tested all functionality
- [ ] ✅ Everything works!

---

## 🆘 Quick Commands Reference

```bash
# Edit .env
nano /home/user/webapp/.env

# View Supabase schema
cat /home/user/webapp/supabase-schema.sql

# Check .env values (hide secrets)
cat /home/user/webapp/.env | grep -E "SUPABASE|LIVEKIT" | sed 's/=.*/=***HIDDEN***/'

# Restart backend
cd /home/user/webapp
pkill -f "node.*server" && npm run server

# Restart frontend
pkill -f vite && npm run dev

# Test Supabase connection
curl http://localhost:3001/api/health

# Test LiveKit token
./test-livekit-token.sh
```

---

## 💡 Why Both Need To Be Fixed

**Your app needs BOTH services:**

1. **Supabase** (Database)
   - Stores jobs, candidates, interviews
   - Manages user authentication
   - Tracks interview progress

2. **LiveKit** (Real-time Audio/Video)
   - Handles voice interview
   - Real-time audio streaming
   - Room management

**If either is not configured, the app won't work!**

---

## ⏱️ Time Required

- Get Supabase credentials: 2 min
- Get LiveKit credentials: 2 min  
- Update .env: 2 min
- Set up database: 2 min
- Restart and test: 2 min
- **Total: 10 minutes**

---

## 🎯 Priority Order

**Do these in order:**

1. **First:** Fix Supabase + Set up database schema
2. **Then:** Fix LiveKit credentials
3. **Finally:** Restart everything and test

---

**START WITH SUPABASE FIRST!** 

The "Invalid Interview Link" error is because Supabase isn't working.

Good luck! 🚀
