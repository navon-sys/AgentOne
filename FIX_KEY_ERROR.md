# ⚠️ CRITICAL: Fix "Forbidden use of secret API key" Error

## 🚨 The Problem

You're getting this error because you're using the **WRONG Supabase key** in your frontend.

**Error Message:**
```json
{
  "message": "Forbidden use of secret API key in browser",
  "hint": "Secret API keys can only be used in a protected environment"
}
```

## 🔍 Root Cause

You likely put the **`service_role`** key (secret key) where the **`anon`** key (public key) should go.

---

## ✅ SOLUTION: Use the Correct Keys

Supabase provides **TWO different keys**:

### 1️⃣ **ANON KEY** (Public Key) ✅ Safe for Browser
```
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTY1NzEyMDB9...
```
**Contains:** `"role":"anon"`
**Use for:** `VITE_SUPABASE_ANON_KEY` (Frontend)
**Safe:** ✅ Yes - designed for browser use

### 2️⃣ **SERVICE_ROLE KEY** (Secret Key) ❌ NEVER in Browser
```
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjU3MTIwMH0...
```
**Contains:** `"role":"service_role"`
**Use for:** `SUPABASE_SERVICE_ROLE_KEY` (Backend only)
**Safe:** ❌ NO - must stay on server

---

## 🔧 Step-by-Step Fix

### Step 1: Go to Supabase Dashboard

1. Visit: https://supabase.com/dashboard
2. Select your project
3. Go to: **Settings** → **API**

### Step 2: Identify Your Keys

You'll see a page with these keys:

```
┌─────────────────────────────────────────────────┐
│ Project API keys                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Project URL                                     │
│ https://xxxxx.supabase.co                       │
│                                                 │
│ anon public                                     │
│ eyJhbG...anon...xyz  [Copy]                     │
│ ↑ This key is safe to use in a browser         │
│                                                 │
│ service_role secret                             │
│ eyJhbG...service_role...xyz  [Copy]             │
│ ↑ This key should NEVER be used in a browser!  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Step 3: Create .env File

Create a `.env` file in your project root:

```bash
cd /home/user/webapp
./setup-env.sh
```

OR manually:

```bash
cp .env.example .env
nano .env
```

### Step 4: Configure .env CORRECTLY

```bash
# ✅ CORRECT Configuration:

# Frontend - Use ANON key (public, safe for browser)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...anon...xyz

# Backend - Use SERVICE_ROLE key (secret, server only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...service_role...xyz

# Other keys...
OPENAI_API_KEY=sk-...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
DEEPGRAM_API_KEY=...

PORT=3001
VITE_API_URL=http://localhost:3001
```

---

## 🔍 How to Tell Which Key is Which

### Method 1: Look at the Label in Supabase Dashboard
- **"anon public"** → Use for `VITE_SUPABASE_ANON_KEY`
- **"service_role secret"** → Use for `SUPABASE_SERVICE_ROLE_KEY`

### Method 2: Decode the JWT Token
```bash
# The key is a JWT token. You can decode it at: https://jwt.io

# ANON key contains:
{
  "role": "anon"
}

# SERVICE_ROLE key contains:
{
  "role": "service_role"
}
```

### Method 3: Check the Length
- Both keys are similar length (~200-300 characters)
- Both start with `eyJhbG...`
- Look at the label in Supabase, not the key itself

---

## ⚠️ What You Did Wrong

You probably did this:

```bash
# ❌ WRONG - Using service_role key in frontend
VITE_SUPABASE_ANON_KEY=eyJhbG...service_role...xyz
```

This causes the error because the browser tries to use a secret key.

---

## ✅ Correct Configuration

```bash
# ✅ CORRECT - Using anon key in frontend
VITE_SUPABASE_ANON_KEY=eyJhbG...anon...xyz

# ✅ CORRECT - Using service_role key in backend
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...service_role...xyz
```

---

## 🧪 Test Your Configuration

### Step 1: Check .env file
```bash
cd /home/user/webapp
cat .env | grep SUPABASE
```

You should see:
```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...anon...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...service_role...
```

### Step 2: Restart Backend
```bash
# Kill existing server
pkill -f "node.*server"

# Start fresh
npm run server
```

### Step 3: Restart Frontend
```bash
# Kill existing dev server
pkill -f "vite"

# Start fresh
npm run dev
```

### Step 4: Test Signup
1. Open http://localhost:5173
2. Click "Sign Up"
3. Enter email and password
4. You should NOT see the error anymore

---

## 🔒 Security Checklist

- [ ] `.env` file exists in project root
- [ ] `VITE_SUPABASE_ANON_KEY` uses the **anon** key (not service_role)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` uses the **service_role** key
- [ ] `.env` is in `.gitignore` (never commit it!)
- [ ] Backend is using service_role key for admin operations
- [ ] Frontend is using anon key for client operations

---

## 🆘 Still Getting Error?

### Check 1: Is .env file loaded?
```bash
# In backend server logs, you should see:
# Supabase Admin: ✅ Configured

# If you see:
# Supabase Admin: ❌ Not configured
# Then .env is not being read properly
```

### Check 2: Did you restart the servers?
- Frontend (Vite) needs restart to pick up new .env
- Backend (Node) needs restart to pick up new .env
- Use `pkill` commands above to fully restart

### Check 3: Are you using the right environment?
```bash
# Check which URL your frontend is using:
# Open browser console and run:
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20))

# Should show:
# https://your-project.supabase.co
# eyJhbGciOiJIUzI1NiI... (first 20 chars)
```

---

## 📞 Need More Help?

1. **Show me your .env** (hide the actual keys):
   ```bash
   cat .env | sed 's/=.*/=***HIDDEN***/g'
   ```

2. **Show me the error in browser console**:
   - Open DevTools (F12)
   - Go to Console tab
   - Copy the full error message

3. **Check backend logs**:
   ```bash
   # Run backend and show startup logs
   npm run server
   ```

---

## 📝 Quick Reference

| Variable | Where | Which Key | Safe for Browser? |
|----------|-------|-----------|-------------------|
| `VITE_SUPABASE_URL` | Frontend | Project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Frontend | **anon public** key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | **service_role secret** key | ❌ NO! |

---

**Remember:** 
- ✅ **anon** key = Frontend (browser-safe)
- ❌ **service_role** key = Backend only (secret)

Now go fix your `.env` file! 🚀
