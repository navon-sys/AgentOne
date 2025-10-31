# Backend Restart Guide - Fix TTS Audio

## 🎯 Problem
Getting error: "No audio URL received from backend"

## ✅ Solution
Backend needs to be restarted with the updated TTS code.

---

## 🚀 Quick Restart (Choose One Method)

### Method 1: Using PM2 (Recommended if installed)
```bash
cd /home/azureuser/webapp

# Stop backend
pm2 stop backend

# Start with new code
pm2 start server/index.js --name backend

# Check status
pm2 status

# View logs
pm2 logs backend --lines 50
```

### Method 2: Using Node Directly
```bash
cd /home/azureuser/webapp

# Kill existing backend
pkill -f "server/index.js"

# Start new backend
nohup node server/index.js > backend.log 2>&1 &

# Check it's running
ps aux | grep "server/index.js" | grep -v grep

# View logs
tail -f backend.log
```

### Method 3: Using Start Script (If available)
```bash
cd /home/azureuser/webapp

# Stop
./stop-backend.sh  # or pkill -f "server/index.js"

# Start
./start-backend.sh  # or npm run server
```

---

## 🧪 Test TTS After Restart

### 1. Check Health Endpoint
```bash
curl http://localhost:3001/api/health
```

**Expected Output**:
```json
{
  "status": "ok",
  "services": {
    "livekit": true,
    "deepgram": true,
    "openai": true
  },
  "openaiConfigured": true
}
```

**Important**: `openaiConfigured` should be `true`!

### 2. Test TTS Endpoint
```bash
curl http://localhost:3001/api/test-tts
```

**Expected Output**:
```json
{
  "success": true,
  "message": "TTS working!",
  "audioUrl": "data:audio/mpeg;base64,//uQx...",
  "audioSize": 12345
}
```

If you see `audioUrl` with base64 data, TTS is working! ✅

### 3. Test Full TTS Flow
```bash
curl -X POST http://localhost:3001/api/speak-question \
  -H "Content-Type: application/json" \
  -d '{"question":"Hello, can you hear me?","interviewId":"test","roomName":"test"}'
```

**Expected Output**:
```json
{
  "success": true,
  "audioUrl": "data:audio/mpeg;base64,//uQx...",
  "message": "Question spoken (using OpenAI TTS)",
  "audioSize": 15678
}
```

---

## 📊 Backend Console Logs

When backend starts successfully, you should see:

```
🚀 Backend server running on http://20.82.140.166:3001
🌐 Also accessible at http://localhost:3001

📋 Configuration Status:
  LiveKit: ✅ Configured
  Deepgram: ✅ Configured
  OpenAI: ✅ Configured

💡 To configure missing services, update your .env file
```

When TTS request is made:

```
🔊 TTS Request for: What is your name?
📊 OpenAI configured: true
🎵 Generating speech with OpenAI TTS...
📥 Converting audio to buffer...
✅ Audio buffer created, size: 18432 bytes
✅ Audio data URL created, length: 24576
📤 Sending response with audioUrl...
✅ Response sent successfully
```

---

## ⚠️ Troubleshooting

### Issue: Backend won't start

**Check 1**: Is port 3001 already in use?
```bash
lsof -i :3001
# or
netstat -tulpn | grep 3001
```

**Solution**: Kill the process using port 3001
```bash
# Find PID
lsof -i :3001 | grep LISTEN | awk '{print $2}'

# Kill it
kill -9 <PID>
```

---

### Issue: OpenAI not configured

**Check**: Is the API key in .env?
```bash
grep OPENAI_API_KEY /home/azureuser/webapp/.env
```

**Should show**:
```
OPENAI_API_KEY=sk-proj-...
```

**If missing or invalid**:
1. Get key from https://platform.openai.com/api-keys
2. Add to `.env` file:
   ```bash
   echo "OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE" >> .env
   ```
3. Restart backend

---

### Issue: "audioUrl": null in response

**Possible Causes**:
1. OpenAI API key is invalid/expired
2. OpenAI API quota exceeded
3. Network issues connecting to OpenAI

**Debug Steps**:
```bash
# Check backend logs
tail -50 backend.log | grep -E "(TTS|OpenAI|Error)"

# Test OpenAI directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_KEY"
```

---

### Issue: Backend logs say "node: command not found"

**Solution**: Use full path to node
```bash
# Find node
which node

# Start with full path
nohup /full/path/to/node server/index.js > backend.log 2>&1 &
```

---

## 🎵 Frontend Testing

After backend is restarted:

1. Open browser to interview URL
2. Click "Start Interview"
3. Open browser console (F12)
4. Watch for logs:

```
🔊 Requesting AI voice for question: What is your name?
📡 Response status: 200 OK
📊 Full response data: {success: true, audioUrl: "data:audio...", ...}
🎵 Playing AI voice...
📥 Audio loading started...
✅ Audio data loaded!
   Duration: 3.5 seconds
▶️ Audio playback STARTED - You should hear it now!
🔊 Audio is PLAYING through speakers
⏱️ Playing: 1s / 3s
⏱️ Playing: 2s / 3s
⏱️ Playing: 3s / 3s
✅ Audio playback FINISHED
```

**If you see this, audio is working!** 🎉

---

## 📝 Quick Checklist

Before testing:
- [ ] Backend is running (check with `ps aux | grep server`)
- [ ] Port 3001 is accessible
- [ ] OpenAI API key is in `.env`
- [ ] `/api/health` returns `openaiConfigured: true`
- [ ] `/api/test-tts` returns audio URL
- [ ] Browser console shows detailed TTS logs

---

## 🚀 Summary

1. **Restart backend** (Method 1, 2, or 3)
2. **Test health** endpoint
3. **Test TTS** endpoint
4. **Try interview** in browser
5. **Check console** for audio playback logs

**The updated code now has extensive logging to help debug TTS issues!**

---

## 📞 Still Having Issues?

Check these logs for errors:
1. Backend logs: `tail -100 backend.log`
2. Browser console: F12 → Console tab
3. Network tab: F12 → Network → look for `/api/speak-question`

Look for these specific messages:
- ✅ "Audio buffer created" = TTS generation working
- ✅ "audioUrl" in response = Backend sending audio
- ✅ "Audio playback STARTED" = Frontend playing audio
- ✅ "Audio is PLAYING" = Sound should be audible

If ANY of these are missing, that's where the issue is!
