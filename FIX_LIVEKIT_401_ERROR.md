# 🔧 Fix: LiveKit 401 Authentication Error

## Problem Identified

You're getting a **401 Unauthorized** error from LiveKit because your API credentials appear to be incomplete or incorrect.

### Current Credentials Status

```
VITE_LIVEKIT_URL: ✅ Correct format
  wss://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud

LIVEKIT_API_KEY: ⚠️ TOO SHORT
  Current length: 15 characters
  Expected: ~40-50 characters
  
LIVEKIT_API_SECRET: ✅ Correct length  
  Current length: 43 characters
```

**The issue:** Your `LIVEKIT_API_KEY` is only 15 characters, but LiveKit API keys are typically 40-50 characters long. This suggests the key was truncated or copied incorrectly.

---

## 🚀 Quick Fix: Get New LiveKit Credentials

### Step 1: Go to LiveKit Cloud Dashboard

1. Visit: **https://cloud.livekit.io/**
2. Sign in to your account
3. Select your project: **"ai-telephonic-ai-assistant"** (based on your URL)

### Step 2: Generate New API Key

1. In the left sidebar, click **"Settings"**
2. Click **"Keys"** or **"API Keys"**
3. Click **"Create API Key"** or **"+ Add Key"**
4. Give it a name (e.g., "AI Interview Platform - Production")
5. Click **"Create"**

### Step 3: Copy Credentials CAREFULLY

You'll see two values:

**API Key:**
```
API************************************** (very long string)
```

**API Secret:**
```
************************************************ (even longer string)
```

⚠️ **IMPORTANT:** Copy these immediately! The secret is only shown once.

### Step 4: Update Your .env File

Open `/home/azureuser/webapp/.env` and update:

```bash
# Replace these with your NEW credentials:
LIVEKIT_API_KEY=API*********************************** (paste full key here)
LIVEKIT_API_SECRET=******************************************** (paste full secret here)
```

**Critical points:**
- ✅ Copy the ENTIRE key (should be 40-50+ characters)
- ✅ No spaces before or after the `=`
- ✅ No extra spaces at the end
- ✅ No quotes around the values

### Step 5: Restart Backend Server

```bash
cd /home/azureuser/webapp
./cleanup-ports.sh
./start-all.sh
```

### Step 6: Test the Fix

```bash
cd /home/azureuser/webapp
node test-livekit-credentials.js
```

You should see:
```
✅ Token Generated Successfully!
✨ LiveKit Credentials Test: PASSED
```

---

## 🔍 Verify Credentials Format

### Correct Format Example

```env
# ✅ CORRECT - Full credentials
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Common Mistakes

```env
# ❌ WRONG - API Key too short (truncated)
LIVEKIT_API_KEY=APIRZrLCBjd73Jf

# ❌ WRONG - Extra quotes
LIVEKIT_API_KEY="APIxxxxxxxx"

# ❌ WRONG - Space after =
LIVEKIT_API_KEY= APIxxxxxxxx

# ❌ WRONG - Missing protocol
VITE_LIVEKIT_URL=your-project.livekit.cloud
```

---

## 📋 Full Troubleshooting Checklist

### 1. Check API Key Length

```bash
cd /home/azureuser/webapp
grep LIVEKIT_API_KEY .env | cut -d'=' -f2 | wc -c
```

**Expected output:** 40-50 (or more)  
**Your output:** 16 ❌ TOO SHORT

**Fix:** Get new credentials from LiveKit dashboard

### 2. Check for Hidden Characters

```bash
grep LIVEKIT_API_KEY .env | cat -A
```

Look for:
- `$` at the end of line (normal)
- `^I` (tabs - should not be present)
- Extra spaces

### 3. Validate URL Format

```bash
grep VITE_LIVEKIT_URL .env
```

Should be:
- ✅ Starts with `wss://`
- ✅ Ends with `.livekit.cloud`
- ✅ No trailing `=` or spaces

### 4. Test Token Generation

```bash
cd /home/azureuser/webapp
node test-livekit-credentials.js
```

### 5. Check Project Status

1. Go to https://cloud.livekit.io/
2. Check if project is **Active** (not suspended/paused)
3. Verify you're in the correct project

---

## 🎯 Step-by-Step: Getting Fresh Credentials

### Visual Guide

```
LiveKit Cloud Dashboard
├── 1. Login to https://cloud.livekit.io/
├── 2. Select Project
│   └── "ai-telephonic-ai-assistant"
├── 3. Settings → API Keys
├── 4. Click "+ Create API Key"
├── 5. Name: "AI Interview Platform"
├── 6. Click "Create"
└── 7. Copy BOTH values:
    ├── API Key (starts with "API...")
    └── API Secret (long random string)
```

### After Getting Credentials

1. **Open `.env` file:**
   ```bash
   cd /home/azureuser/webapp
   nano .env
   ```

2. **Find these lines:**
   ```env
   LIVEKIT_API_KEY=APIRZrLCBjd73Jf
   LIVEKIT_API_SECRET=BRxJAUoexzPjS1VErvf8ySUmrsGbpqlQzQCFszbK702
   ```

3. **Replace with NEW values:**
   ```env
   LIVEKIT_API_KEY=API[paste your full key here]
   LIVEKIT_API_SECRET=[paste your full secret here]
   ```

4. **Save and exit:**
   - Press `Ctrl+O` to save
   - Press `Enter` to confirm
   - Press `Ctrl+X` to exit

5. **Restart backend:**
   ```bash
   ./cleanup-ports.sh
   ./start-all.sh
   ```

---

## 🧪 Test After Fix

### 1. Test Credentials

```bash
cd /home/azureuser/webapp
node test-livekit-credentials.js
```

**Expected output:**
```
╔════════════════════════════════════════════════════════════════╗
║              🔍 LiveKit Credentials Test                       ║
╚════════════════════════════════════════════════════════════════╝

📋 Checking Environment Variables...

VITE_LIVEKIT_URL: ✅ Set
LIVEKIT_API_KEY: ✅ Set
  Length: 47 characters  ← Should be 40-50+
  Format: ✅ Correct prefix

LIVEKIT_API_SECRET: ✅ Set
  Length: 57 characters  ← Should be 50-60+

🔐 Testing Token Generation...
✅ Token Generated Successfully!

✨ LiveKit Credentials Test: PASSED
```

### 2. Test Backend API

```bash
curl -X POST http://localhost:3001/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "test-room",
    "participantName": "test-user",
    "interviewId": "test-123"
  }'
```

**Expected response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "wsUrl": "wss://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud"
}
```

**Error response (if still broken):**
```json
{
  "error": "LiveKit credentials not configured"
}
```

### 3. Test in Browser

1. Open frontend: `http://20.82.140.166:5173`
2. Login to HR Portal
3. Create a job and candidate
4. Click interview link
5. Click "Start Interview"
6. **Should NOT see:** "could not establish signal connection"
7. **Should see:** Interview starting, microphone permission request

---

## 💡 Understanding the Error

### What is a 401 Error?

**401 Unauthorized** means:
- ✅ You reached LiveKit's server
- ❌ Your credentials were rejected

### Common Causes

1. **Truncated API Key** ← Your current issue
   - Key was copied incompletely
   - Only 15 characters instead of 40-50+

2. **Wrong Project**
   - API key from different project
   - URL and key don't match

3. **Expired/Revoked Key**
   - Key was deleted in dashboard
   - Key expired (if you set expiration)

4. **Typo in Credentials**
   - Extra space, missing character
   - Wrong case (keys are case-sensitive)

### How LiveKit Authentication Works

```
1. Your backend creates JWT token
   ↓ (uses API_KEY and API_SECRET)
   
2. Browser connects to LiveKit WebSocket
   ↓ (sends JWT token)
   
3. LiveKit validates token
   ↓ (checks signature with API_KEY)
   
4. If valid: Connection established ✅
   If invalid: 401 error ❌
```

---

## 🔒 Security Best Practices

### Do:
- ✅ Keep API secret in `.env` file (never commit to git)
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys periodically
- ✅ Delete unused keys from LiveKit dashboard

### Don't:
- ❌ Share API secret publicly
- ❌ Commit `.env` to git
- ❌ Use same key across projects
- ❌ Store keys in frontend code

---

## 🆘 Still Not Working?

### If you still get 401 after updating credentials:

1. **Double-check you copied the FULL key**
   ```bash
   grep LIVEKIT_API_KEY .env | cut -d'=' -f2 | wc -c
   # Should be 40-50+, not 16
   ```

2. **Verify project name matches URL**
   - URL: `ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud`
   - Dashboard: Should see "ai-telephonic-ai-assistant" project

3. **Check project is active**
   - Not suspended for billing
   - Not paused or archived

4. **Try creating a NEW project**
   - Create fresh project in LiveKit
   - Get new credentials
   - Update URL and keys in `.env`

5. **Check LiveKit service status**
   - Visit: https://status.livekit.io/
   - Check for ongoing outages

---

## 📞 Need Help?

### LiveKit Support

- **Docs:** https://docs.livekit.io/
- **Discord:** https://discord.gg/livekit
- **GitHub:** https://github.com/livekit/livekit

### Check Your Setup

Run diagnostic:
```bash
cd /home/azureuser/webapp
node test-livekit-credentials.js
```

Share the output (mask your actual credentials):
```
LIVEKIT_API_KEY: ✅ Set
  Length: XX characters
  Format: ✅/❌ Correct prefix
```

---

## ✅ Success Checklist

After fixing credentials, verify:

- [ ] API key is 40-50+ characters (not 15)
- [ ] API secret is 50-60+ characters
- [ ] No extra spaces in `.env`
- [ ] No quotes around values
- [ ] Backend restarted after changes
- [ ] Test script shows "PASSED"
- [ ] Backend API returns token (not error)
- [ ] Browser can start interview (no 401)
- [ ] Microphone permission requested
- [ ] Interview voice works

---

## 🎉 Quick Summary

**Problem:** API key is truncated (only 15 chars instead of 40-50+)

**Solution:**
1. Go to https://cloud.livekit.io/
2. Settings → API Keys → Create New
3. Copy FULL credentials (very carefully!)
4. Update `.env` file
5. Restart backend
6. Test with `node test-livekit-credentials.js`

**Expected result:** ✅ Token generation succeeds, interview works!
