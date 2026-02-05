# ⚠️ **YOU MUST UPDATE YOUR .ENV FILE WITH REAL LIVEKIT CREDENTIALS**

## 🚨 **The Core Problem**

Your `.env` file has **PLACEHOLDER** values:

```bash
# ❌ CURRENT (WRONG):
VITE_LIVEKIT_URL=wss://placeholder.livekit.cloud
LIVEKIT_API_KEY=placeholder-livekit-key
LIVEKIT_API_SECRET=placeholder-livekit-secret
```

**These are NOT real credentials!** They're just examples.

---

## ✅ **THE SOLUTION (Takes 5 Minutes)**

### **Step 1: Sign Up for LiveKit FREE Account**

Click here: **https://livekit.io**

1. Click "Get Started Free"
2. Sign up with your email
3. Verify email
4. **No credit card required!**

### **Step 2: Create Your Project**

1. After login, click **"New Project"**
2. Name it: "AI Interview Platform"
3. Click **"Create"**

### **Step 3: Get Your REAL Credentials**

1. You'll see your project dashboard
2. Click **"Settings"** (gear icon)
3. Click **"Keys"**
4. You'll see THREE values:

```
┌───────────────────────────────────────────────────────┐
│ WebSocket URL                                         │
│ wss://your-project-xxxxxx.livekit.cloud        [Copy] │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│ API Key                                               │
│ APIxxxxxxxxxxxxxxxx                            [Copy] │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│ API Secret                                            │
│ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx       [Copy] │
└───────────────────────────────────────────────────────┘
```

**COPY ALL THREE!**

### **Step 4: Update Your .env File**

```bash
cd /home/user/webapp
nano .env
```

**Find these lines and REPLACE with YOUR real values:**

```bash
# REPLACE THIS:
VITE_LIVEKIT_URL=wss://placeholder.livekit.cloud
LIVEKIT_API_KEY=placeholder-livekit-key
LIVEKIT_API_SECRET=placeholder-livekit-secret

# WITH YOUR REAL VALUES:
VITE_LIVEKIT_URL=wss://your-actual-project.livekit.cloud
LIVEKIT_API_KEY=APIyour-actual-key-here
LIVEKIT_API_SECRET=your-actual-secret-here
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### **Step 5: Restart Everything**

```bash
cd /home/user/webapp
./restart-all.sh
```

### **Step 6: Test**

```bash
# This should now pass all checks:
./test-livekit-token.sh
```

---

## 🎯 **IMPORTANT: Why This Matters**

### **What's Happening Now (With Placeholders):**

```
1. Frontend requests token
2. Backend generates token with FAKE credentials
3. Token looks valid but LiveKit rejects it
4. Error: "401 Unauthorized"
```

### **What Will Happen (With Real Credentials):**

```
1. Frontend requests token
2. Backend generates token with REAL credentials ✅
3. LiveKit accepts token ✅
4. Interview starts! 🎉
```

---

## 📊 **Visual Guide**

### **LiveKit Dashboard Screenshot Reference:**

When you're in Settings → Keys, you'll see:

```
Project Settings
================

Keys
----

WebSocket URL
The WebSocket URL for connecting to LiveKit
wss://your-project-abc123.livekit.cloud
[Copy to clipboard]

API Credentials
---------------

API Key
APIxxxxxxxxxxxx
[Copy to clipboard]

API Secret  
⚠️ Keep this secret!
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
[Copy to clipboard]
[Regenerate]
```

---

## 🧪 **How to Verify You Did It Right**

### **Test 1: Check .env File**

```bash
cd /home/user/webapp
cat .env | grep LIVEKIT
```

**Should show:**
- ✅ URL starts with `wss://` and ends with `.livekit.cloud`
- ✅ Key starts with `API`
- ✅ Secret is long (30+ characters)
- ❌ NO "placeholder" anywhere!

### **Test 2: Run Diagnostic**

```bash
./diagnose-livekit.sh
```

**Should show:**
```
✓ No placeholder values detected
✓ URL starts with wss://
✓ API Key starts with 'API'
✓ Backend can generate tokens
✓ Server is reachable
```

### **Test 3: Test Token**

```bash
./test-livekit-token.sh
```

**Should show:**
```
✓ Token received
✓ Token is valid for XXX seconds
✓ Server accepted the token!
✅ All checks passed!
```

### **Test 4: Try in App**

1. Open http://localhost:5173
2. Create job and candidate
3. Click interview link
4. Start interview
5. ✅ Should connect (no 401 error!)

---

## ❓ **Frequently Asked Questions**

### **Q: Is LiveKit really free?**
A: YES! 1,000 minutes/month FREE. No credit card needed.

### **Q: Do I need to create a new project every time?**
A: NO! Create once, use forever (or until you delete it).

### **Q: Can I use the same credentials on multiple computers?**
A: YES! Same credentials work everywhere.

### **Q: What if I lost my credentials?**
A: Log in to LiveKit Dashboard and go to Settings → Keys. You can regenerate them.

### **Q: Will changing credentials break existing interviews?**
A: New interviews will use new credentials. Old links with old tokens will expire naturally.

---

## 🆘 **Still Stuck? Here's Why:**

### **Problem 1: You didn't actually update .env**
```bash
# Check if you really saved the file:
cat .env | grep "placeholder"
# If you see "placeholder", you didn't save correctly!
```

### **Problem 2: You didn't restart backend**
```bash
# Backend MUST restart to read new .env:
pkill -f "node.*server"
npm run server
```

### **Problem 3: You copied the wrong values**
```bash
# Make sure you copied from the CORRECT project!
# WebSocket URL, API Key, AND Secret must be from SAME project!
```

### **Problem 4: Extra spaces or quotes**
```bash
# BAD:
LIVEKIT_API_KEY=" APIxxxxxxx "
LIVEKIT_API_KEY='APIxxxxxxx'

# GOOD:
LIVEKIT_API_KEY=APIxxxxxxx
```

---

## ⏱️ **Time Required**

| Step | Time |
|------|------|
| Sign up | 2 min |
| Create project | 1 min |
| Get credentials | 1 min |
| Update .env | 1 min |
| Restart & test | 1 min |
| **TOTAL** | **5-6 minutes** |

---

## 💰 **Cost**

**$0.00** (Completely FREE)

---

## 🎯 **Bottom Line**

**You CANNOT use placeholder values!**

They are just examples to show you what format the values should have.

**You MUST:**
1. Sign up at https://livekit.io
2. Create a project
3. Get YOUR real credentials
4. Put them in .env
5. Restart

**That's it!**

---

## 📞 **Need Help?**

### **LiveKit Dashboard:**
https://cloud.livekit.io

### **LiveKit Docs:**
https://docs.livekit.io

### **Sign Up Page:**
https://livekit.io

### **Community Support:**
https://discord.gg/livekit

---

## ✅ **Checklist**

- [ ] Signed up at https://livekit.io
- [ ] Created a project
- [ ] Copied WebSocket URL
- [ ] Copied API Key (starts with "API")
- [ ] Copied API Secret (long string)
- [ ] Pasted ALL THREE into .env
- [ ] Saved .env file
- [ ] Restarted backend
- [ ] Ran ./test-livekit-token.sh
- [ ] All checks passed
- [ ] Tested in app
- [ ] ✅ WORKS!

---

**🚀 START NOW: https://livekit.io**

**It takes less time to sign up than to read this document!**
