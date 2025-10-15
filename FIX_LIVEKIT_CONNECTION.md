# 🔧 Fix: "could not establish signal connection: Failed to fetch"

## Error You're Seeing

```
Connection Error
could not establish signal connection: Failed to fetch
```

**Root Cause:** The LiveKit WebSocket URL in `.env` had a trailing `=` character, corrupting the URL.

---

## ✅ Problem Fixed

### What Was Wrong

Your `.env` file had:
```env
VITE_LIVEKIT_URL=wss://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud=
                                                                         ↑
                                                                    Extra = here!
```

This made the LiveKit client try to connect to an invalid URL, causing the "could not establish signal connection" error.

### What I Fixed

**Corrected to:**
```env
VITE_LIVEKIT_URL=wss://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud
```

**Also added:**
```env
VITE_API_URL=http://20.82.140.166:3001
```

### Servers Restarted

Both servers have been restarted to pick up the corrected configuration:
- ✅ Backend: http://20.82.140.166:3001
- ✅ Frontend: http://20.82.140.166:5173
- ✅ LiveKit URL: Fixed and validated

---

## 🧪 Test the Fix

### 1. Clear Browser Cache (IMPORTANT!)

The old code with the broken URL might be cached in your browser.

**Chrome/Firefox:**
- Press `Ctrl+Shift+R` (Windows/Linux)
- Or `Cmd+Shift+R` (Mac)
- Or open Developer Tools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

**Or use Incognito/Private Mode:**
- Chrome: `Ctrl+Shift+N`
- Firefox: `Ctrl+Shift+P`

### 2. Access the Application

Open in your browser:
```
http://20.82.140.166:5173
```

### 3. Test the Interview Flow

1. **Login** to HR Portal
2. **Create a Job** (or use existing job)
3. **Add a Candidate**
4. **Copy Interview Link**
5. **Open Interview Link** (in incognito/private window)
6. **Click "Start Interview"**
7. **Allow Microphone Access** when prompted

**Expected Result:** ✅ Interview should start, AI should begin asking questions

---

## 🔍 Understanding the Error

### What is LiveKit?

LiveKit is the **WebRTC server** that handles real-time audio streaming between:
- Candidate's browser (microphone input)
- Backend server (AI processing)
- Candidate's browser (AI voice output)

### Connection Flow

```
Browser → Frontend → Backend API → LiveKit Token
                                      ↓
Browser → LiveKit WebSocket (wss://...) → Real-time Audio Room
```

### Why the Error Occurred

1. Frontend tried to get LiveKit token from backend ✅ (This worked)
2. Frontend received valid token ✅ (This worked)
3. Frontend tried to connect to LiveKit WebSocket ❌ (This failed)
4. LiveKit URL was malformed: `wss://...cloud=` (extra `=`)
5. WebSocket connection failed → "could not establish signal connection"

---

## 🎯 Current Configuration Status

### Environment Variables (All Fixed)

```env
# ✅ Supabase (Database + Auth)
VITE_SUPABASE_URL=https://auvjfgoqnumzhtgbknpp.supabase.co
VITE_SUPABASE_ANON_KEY=[configured]

# ✅ LiveKit (WebRTC Audio) - FIXED!
VITE_LIVEKIT_URL=wss://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud
LIVEKIT_API_KEY=APIRZrLCBjd73Jf
LIVEKIT_API_SECRET=[configured]

# ✅ Deepgram (Speech-to-Text)
DEEPGRAM_API_KEY=[configured]

# ✅ OpenAI (AI Responses)
OPENAI_API_KEY=[configured]

# ✅ Backend API URL - ADDED!
VITE_API_URL=http://20.82.140.166:3001

# ✅ Server Port
PORT=3001
```

### Backend Health Check

```bash
curl http://20.82.140.166:3001/api/health
```

**Response:**
```json
{
  "status": "ok",
  "services": {
    "livekit": true,    ← ✅ Fixed!
    "deepgram": true,
    "openai": true
  }
}
```

---

## 🚨 If You Still See the Error

### 1. Hard Refresh Browser

The most common issue is **cached JavaScript**. Your browser is using the old code with the broken LiveKit URL.

**Solution:**
- Close all tabs with the application open
- Clear browser cache
- Open in incognito/private mode
- Or press `Ctrl+Shift+R` for hard refresh

### 2. Check Browser Console

1. Open the application: http://20.82.140.166:5173
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for errors

**What to Look For:**

✅ **Good:** No errors, or only warnings  
❌ **Bad:** Red errors about "WebSocket", "LiveKit", "Failed to fetch"

**If you see errors:**
- Take a screenshot
- Check the exact error message
- It might reveal a different issue

### 3. Check Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Click "Start Interview"
4. Look for failed requests (red)

**What to Check:**

| Request | Expected Status | If Failed |
|---------|----------------|-----------|
| `/api/livekit-token` | 200 OK | Backend not responding |
| `wss://...livekit.cloud` | 101 Switching Protocols | LiveKit connection issue |

### 4. Verify LiveKit URL Format

The URL should be:
```
wss://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud
```

**Check for common issues:**
- ❌ Extra `=` at the end
- ❌ Missing `wss://` protocol
- ❌ Spaces in the URL
- ❌ Extra quote marks

### 5. Test LiveKit from Backend

```bash
cd /home/azureuser/webapp
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
node -e "
const { AccessToken } = require('livekit-server-sdk');
const token = new AccessToken(
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET,
  { identity: 'test-user' }
);
token.addGrant({ roomJoin: true, room: 'test-room' });
console.log('LiveKit token generated successfully!');
console.log('Token:', token.toJwt());
"
```

**Expected:** Should print "LiveKit token generated successfully!"  
**If error:** LiveKit API credentials are wrong

---

## 🔧 Additional Troubleshooting

### Issue: Microphone Permission Denied

**Error:** Browser blocks microphone access

**Solution:**
1. Check browser address bar for microphone icon
2. Click → Allow microphone access
3. Reload page and try again

### Issue: "Failed to get LiveKit token"

**Error:** Backend can't generate LiveKit token

**Check:**
```bash
cd /home/azureuser/webapp
grep LIVEKIT .env
```

**Should see:**
```
VITE_LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=...
```

**If missing:** Add credentials from your LiveKit dashboard

### Issue: "WebSocket connection failed"

**Possible causes:**
1. LiveKit URL is wrong
2. LiveKit project is suspended/expired
3. Network firewall blocking WebSocket connections

**Solution:**
1. Verify LiveKit URL in LiveKit Cloud dashboard
2. Check LiveKit project status
3. Try from a different network

### Issue: CORS Error

**Error:** "Access-Control-Allow-Origin" blocked

**Solution:** Already fixed in backend. If you see this:
```bash
cd /home/azureuser/webapp
grep "cors" server/index.js
```

Should see:
```javascript
app.use(cors({
  origin: '*',
  credentials: true
}))
```

---

## 📋 Complete Startup Checklist

After the fix, verify everything:

- [x] ✅ LiveKit URL fixed (removed trailing `=`)
- [x] ✅ VITE_API_URL added to `.env`
- [x] ✅ Backend restarted
- [x] ✅ Frontend restarted
- [x] ✅ Backend health check passes
- [ ] **Clear browser cache**
- [ ] **Hard refresh browser (Ctrl+Shift+R)**
- [ ] **Test interview connection**
- [ ] **Verify microphone permission granted**
- [ ] **Complete test interview**

---

## 🎯 Next Steps

### 1. Clear Browser Cache & Test (RIGHT NOW)

```
1. Close all application tabs
2. Clear browser cache (or use incognito)
3. Go to: http://20.82.140.166:5173
4. Login → Create job → Add candidate → Test interview
5. Allow microphone when prompted
6. Interview should start successfully! ✅
```

### 2. Setup Database Schema (If Not Done)

If you haven't run the database schema yet:
```
See: FIX_DATABASE_ERROR.md
Run: supabase-schema.sql in Supabase SQL Editor
```

### 3. Configure Supabase Site URL (For Emails)

```
See: SUPABASE_EMAIL_FIX.md
Set Site URL: http://20.82.140.166:5173
```

---

## 💡 Prevention: How to Avoid This

### When Adding Environment Variables

**Check for:**
- No trailing `=` after URLs
- No spaces in values
- No extra quotes
- Correct protocol (`wss://` for WebSocket, `https://` for API)

**Example:**
```env
# ❌ WRONG
VITE_LIVEKIT_URL=wss://example.com=
VITE_API_URL="http://example.com"  (extra quotes)
LIVEKIT_API_KEY=key with spaces

# ✅ CORRECT
VITE_LIVEKIT_URL=wss://example.com
VITE_API_URL=http://example.com
LIVEKIT_API_KEY=keywithnospaces
```

### After Changing .env

**Always restart servers:**
```bash
cd /home/azureuser/webapp
./cleanup-ports.sh
./start-all.sh
```

**And clear browser cache:**
- Hard refresh: `Ctrl+Shift+R`
- Or use incognito mode

---

## 🎉 Success Indicators

You'll know the fix worked when:

1. ✅ No "could not establish signal connection" error
2. ✅ Interview room loads successfully
3. ✅ Browser asks for microphone permission
4. ✅ Status shows "Listening" or "Speaking"
5. ✅ AI voice asks the first question
6. ✅ Transcript shows conversation in real-time
7. ✅ Progress bar shows current question number

---

## 📞 Quick Diagnostic

Run this from your VM to verify everything:

```bash
cd /home/azureuser/webapp

echo "=== Configuration Check ==="
echo "VITE_LIVEKIT_URL:" && grep VITE_LIVEKIT_URL .env
echo "VITE_API_URL:" && grep VITE_API_URL .env
echo ""

echo "=== Server Status ==="
sudo lsof -ti:3001 && echo "✅ Backend running" || echo "❌ Backend stopped"
sudo lsof -ti:5173 && echo "✅ Frontend running" || echo "❌ Frontend stopped"
echo ""

echo "=== Backend Health ==="
curl -s http://localhost:3001/api/health | jq .
echo ""

echo "=== LiveKit URL Check ==="
grep VITE_LIVEKIT_URL .env | grep -o "=" | wc -l | xargs -I {} echo "Number of '=' in LiveKit URL: {}"
echo "(Should be 1, not 2!)"
```

**Expected output:**
```
=== Configuration Check ===
VITE_LIVEKIT_URL:wss://ai-telephonic-ai-assistant-hdii7zf0.livekit.cloud
VITE_API_URL:http://20.82.140.166:3001

=== Server Status ===
✅ Backend running
✅ Frontend running

=== Backend Health ===
{
  "status": "ok",
  "services": {
    "livekit": true,
    "deepgram": true,
    "openai": true
  }
}

=== LiveKit URL Check ===
Number of '=' in LiveKit URL: 1
(Should be 1, not 2!)
```

---

## 📚 Related Documentation

- **`FIX_BACKEND_CONNECTION.md`** - Backend API connection issues
- **`FIX_DATABASE_ERROR.md`** - Database setup (do this next!)
- **`CURRENT_STATUS.md`** - Complete system status
- **`AZURE_NETWORKING.md`** - VM networking explained

---

**The Fix:** Removed trailing `=` from LiveKit URL ✅  
**Action Required:** Clear browser cache and test! 🚀
