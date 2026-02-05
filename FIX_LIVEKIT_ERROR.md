# 🎤 Fix: LiveKit Connection Error

## 🚨 The Error

```javascript
Error initializing interview: ConnectionError: 
could not establish signal connection: invalid authorization token
```

**Root Cause:** LiveKit credentials are not configured or using placeholder values.

---

## 🎯 Understanding the Issue

Your app uses **LiveKit** for real-time audio/video interviews. The error occurs because:

1. ✅ Frontend tries to connect to LiveKit
2. ❌ Backend generates token with placeholder credentials
3. ❌ LiveKit rejects the invalid token

**Current .env values:**
```bash
VITE_LIVEKIT_URL=wss://placeholder.livekit.cloud  # ❌ Not real
LIVEKIT_API_KEY=placeholder-livekit-key            # ❌ Not real
LIVEKIT_API_SECRET=placeholder-livekit-secret      # ❌ Not real
```

---

## ✅ SOLUTION: Two Options

### **Option 1: Get Real LiveKit Credentials (Recommended)**

LiveKit provides a **FREE tier** perfect for testing and small-scale use.

#### **Step 1: Sign Up for LiveKit**

1. Go to: https://livekit.io
2. Click **"Get Started Free"**
3. Sign up with your email
4. Verify your email

#### **Step 2: Create a Project**

1. After login, you'll be in the dashboard
2. Click **"New Project"** or use the default project
3. Give it a name: "AI Interview Platform"

#### **Step 3: Get Your Credentials**

1. In your project dashboard, go to **"Settings"** → **"Keys"**
2. You'll see:
   - **WebSocket URL**: `wss://your-project-xxxxxx.livekit.cloud`
   - **API Key**: `APIxxxxxxxxxxxxxxxx`
   - **API Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### **Step 4: Update .env File**

```bash
cd /home/user/webapp
nano .env
```

Update these lines:
```bash
# LiveKit Configuration (from LiveKit Dashboard)
VITE_LIVEKIT_URL=wss://your-project-xxxxxx.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **Step 5: Restart Services**

```bash
cd /home/user/webapp
./restart-all.sh

# OR manually:
pkill -f "node.*server" && npm run server
pkill -f "vite" && npm run dev
```

#### **Step 6: Test**

1. Open http://localhost:5173
2. Create a job and candidate
3. Access interview link
4. Click "Start Interview"
5. ✅ Should connect to LiveKit now!

---

### **Option 2: Disable LiveKit Temporarily**

If you want to test without LiveKit (text-only mode):

This requires code changes to skip LiveKit initialization. Better to get real credentials.

---

## 🎧 BONUS: AudioContext Warning Fix

You're also seeing this warning:
```
The AudioContext was not allowed to start. 
It must be resumed after a user gesture on the page.
```

**This is normal!** Modern browsers require user interaction before playing audio.

**The fix is already in your code** - audio will work after user clicks "Start Interview" button.

If you want to suppress the warning, I can add a user gesture handler.

---

## 🆓 LiveKit Free Tier

**What you get:**
- ✅ Up to 50 participants
- ✅ Unlimited rooms
- ✅ 1,000 minutes/month free
- ✅ Perfect for testing and demos
- ✅ No credit card required

**Limitations:**
- ⏱️ 1,000 minutes/month (about 16 hours)
- 👥 50 concurrent participants max

**Perfect for:**
- Development and testing
- Small-scale interviews
- Proof of concept
- Learning

---

## 🔍 Verification Steps

### **Step 1: Check Backend Logs**

When backend starts, you should see:
```
📋 Configuration Status:
  LiveKit: ✅ Configured
  Deepgram: ✅ Configured
  OpenAI: ✅ Configured
  Supabase Admin: ✅ Configured
```

If LiveKit shows ❌:
```bash
# Check your .env
cat .env | grep LIVEKIT

# Make sure values are NOT "placeholder-xxx"
```

### **Step 2: Test Token Generation**

```bash
curl -X POST http://localhost:3001/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "test-room",
    "participantName": "Test User",
    "interviewId": "test-123"
  }'
```

**Expected (Success):**
```json
{
  "token": "eyJhbG...very-long-jwt-token...",
  "wsUrl": "wss://your-project.livekit.cloud"
}
```

**Expected (Failure):**
```json
{
  "error": "LiveKit credentials not configured"
}
```

If you get the error, your .env doesn't have real credentials.

---

## 🛠️ Troubleshooting

### ❌ Error: "LiveKit credentials not configured"

**Problem:** Backend can't find credentials

**Solution:**
```bash
# 1. Check .env file exists
ls -la .env

# 2. Check it has LiveKit values
cat .env | grep LIVEKIT

# 3. Make sure NOT using placeholders
# BAD:  LIVEKIT_API_KEY=placeholder-livekit-key
# GOOD: LIVEKIT_API_KEY=APIxxxxxxxx

# 4. Restart backend
pkill -f "node.*server" && npm run server
```

### ❌ Error: "invalid authorization token"

**Problem:** Token format is correct but credentials are wrong

**Solution:**
1. Double-check you copied correct values from LiveKit Dashboard
2. Make sure you copied:
   - Full WebSocket URL (starts with `wss://`)
   - Full API Key (starts with `API`)
   - Full API Secret (long alphanumeric string)
3. No extra spaces or quotes
4. Restart backend after fixing

### ⚠️ Warning: "AudioContext was not allowed to start"

**Problem:** Browser autoplay policy

**Solution:** This is normal and expected! Audio will work after user clicks "Start Interview".

**Why?** Browsers require user interaction before playing audio (security/UX feature).

**No action needed** - your app handles this correctly.

---

## 🔐 Security Notes

**Important:**
- ✅ `LIVEKIT_API_SECRET` must stay on backend (never expose to frontend)
- ✅ `VITE_LIVEKIT_URL` is public (safe in frontend)
- ✅ Token generation happens on backend (secure)
- ❌ Never put API secret in frontend code

**Current implementation is secure:**
```
Frontend → Backend (/api/livekit-token) → LiveKit Server
                 ↓
            Uses API Secret (secure)
```

---

## 📋 Complete LiveKit Setup Checklist

- [ ] Sign up at https://livekit.io
- [ ] Create new project
- [ ] Get WebSocket URL from dashboard
- [ ] Get API Key from dashboard
- [ ] Get API Secret from dashboard
- [ ] Update VITE_LIVEKIT_URL in .env
- [ ] Update LIVEKIT_API_KEY in .env
- [ ] Update LIVEKIT_API_SECRET in .env
- [ ] Restart backend server
- [ ] Test token generation endpoint
- [ ] Try interview in app
- [ ] ✅ Should work!

---

## 🎯 Quick Fix Command

```bash
# 1. Edit .env file
cd /home/user/webapp
nano .env

# 2. Update these lines with YOUR LiveKit credentials:
# VITE_LIVEKIT_URL=wss://your-actual-project.livekit.cloud
# LIVEKIT_API_KEY=APIyour-actual-key
# LIVEKIT_API_SECRET=your-actual-secret

# 3. Save (Ctrl+X, Y, Enter)

# 4. Restart everything
./restart-all.sh
```

---

## 💡 What LiveKit Does in This App

**Purpose:** Real-time audio/video for AI interviews

**Features used:**
- 🎤 **Audio capture** from candidate
- 🔊 **Audio playback** from AI interviewer
- 📝 **Live transcription** integration
- 🎯 **Room management** for isolated interviews

**Workflow:**
```
1. Candidate clicks "Start Interview"
2. Frontend requests token from backend
3. Backend generates token with LiveKit credentials
4. Frontend connects to LiveKit room
5. Audio streams between candidate and AI
6. Interview proceeds with real-time audio
```

---

## 📚 Alternative: Skip LiveKit (Text Mode)

If you don't want to set up LiveKit right now, I can help you create a **text-only interview mode** where:
- 👤 Candidate types answers
- 🤖 AI responds with text
- 📝 Everything is saved to transcript

This skips the audio/video completely.

**Would you like me to implement this?**

---

## ✅ Summary

**To fix the error:**

1. **Sign up** at https://livekit.io (FREE)
2. **Create** a project
3. **Copy** credentials to .env:
   - WebSocket URL
   - API Key
   - API Secret
4. **Restart** backend
5. **Test** interview

**Time needed:** 5-10 minutes

**Cost:** FREE (1,000 minutes/month)

---

**LiveKit Free Tier Details:**
- 🆓 No credit card required
- ✅ 1,000 minutes free per month
- ✅ Perfect for development
- ✅ Easy to upgrade later

---

## 📞 Need Help?

**LiveKit Documentation:**
- Quick Start: https://docs.livekit.io/realtime/quickstarts/
- Authentication: https://docs.livekit.io/realtime/concepts/authentication/

**Support:**
- LiveKit Community: https://livekit.io/community
- Discord: https://discord.gg/livekit

---

## 🎊 Your Choice

**Option A:** Get LiveKit credentials (5 mins, enables voice interviews)  
**Option B:** Let me create text-only mode (no LiveKit needed)

**Which would you prefer?** 🤔

---

**TL;DR:**
1. Go to https://livekit.io
2. Sign up (FREE)
3. Get credentials
4. Update .env file
5. Restart backend
6. ✅ Works!

**OR tell me if you want text-only mode instead!**
