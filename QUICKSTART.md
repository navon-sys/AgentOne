# 🚀 Quick Start Guide

Get your AI Interview Platform running in 10 minutes!

## ⚡ Fast Setup

### Step 1: Environment Setup (2 minutes)

Create `.env` file:
```bash
cp .env.example .env
```

### Step 2: Get Free API Keys (5 minutes)

#### 1. Supabase (Required - Free Forever)
```
1. Go to https://supabase.com
2. Sign up → Create New Project
3. Wait 2 minutes for project to initialize
4. Go to Settings → API
5. Copy:
   - Project URL → VITE_SUPABASE_URL
   - anon public key → VITE_SUPABASE_ANON_KEY
6. Go to SQL Editor
7. Copy SQL from src/supabaseClient.js (the big comment at bottom)
8. Run SQL to create database tables
```

#### 2. LiveKit (Required - Free Tier)
```
1. Go to https://livekit.io
2. Sign up → Create Project
3. Copy:
   - WebSocket URL → VITE_LIVEKIT_URL
   - API Key → LIVEKIT_API_KEY
   - API Secret → LIVEKIT_API_SECRET
```

#### 3. Deepgram (Optional - $200 Free Credit)
```
1. Go to https://deepgram.com
2. Sign up → Go to API Keys
3. Create API Key → DEEPGRAM_API_KEY
```

#### 4. OpenAI (Optional - Paid)
```
1. Go to https://platform.openai.com
2. Sign up → Go to API Keys
3. Create API Key → OPENAI_API_KEY
```

### Step 3: Install & Run (3 minutes)

```bash
# Install dependencies
npm install

# Terminal 1 - Start backend
npm run server

# Terminal 2 - Start frontend
npm run dev
```

Visit: **http://localhost:5173**

## 🎯 First Use

### HR Portal Setup

1. **Sign Up**
   - Open http://localhost:5173
   - Click "Don't have an account? Sign Up"
   - Enter email and password (min 6 characters)
   - Check email for confirmation (Supabase sends it)

2. **Create First Job**
   - Navigate to "Jobs & Candidates"
   - Click "Create New Job"
   - Fill in:
     - Job Title: "Software Developer"
     - Description: "Full-stack developer position"
     - Add 3-5 questions (e.g., "Tell me about yourself")
   - Click "Create Job"

3. **Add First Candidate**
   - Click on your job
   - Click "Add Candidate"
   - Fill in:
     - Name: "John Doe"
     - Email: "john@example.com"
   - System generates interview link
   - Copy the link

4. **Send to Candidate**
   - Send the interview link via email
   - Or open in a new incognito window to test

### Candidate Interview

1. **Open Link**
   - Paste the interview link in browser
   - Review instructions

2. **Start Interview**
   - Click "Start Interview"
   - Allow microphone access
   - AI asks questions

3. **Answer Questions**
   - For demo mode: Type answers when prompted
   - In production: Speak your answers
   - Click "Submit Answer" to continue

4. **Complete**
   - Answer all questions
   - Interview auto-completes

### Review Interview

1. **Back to HR Portal**
   - Go to Dashboard
   - Navigate to Jobs → Candidates
   - Click "View Interview Results"

2. **Generate AI Analysis**
   - Click "Generate AI Summary"
   - View candidate score (1-10)
   - Read AI summary

3. **Add HR Notes**
   - Write private notes
   - Click "Save Notes"

## 🔧 Minimal Setup (Test Without API Keys)

If you just want to see the UI:

```env
# .env file
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder
VITE_LIVEKIT_URL=ws://localhost:7880
```

You can explore the HR Portal interface, but interviews won't work without real credentials.

## 📊 What Works Without Full Setup

| Feature | Supabase Only | + LiveKit | + All APIs |
|---------|---------------|-----------|------------|
| HR Login | ✅ | ✅ | ✅ |
| Job Management | ✅ | ✅ | ✅ |
| Candidate Management | ✅ | ✅ | ✅ |
| Interview Link Generation | ✅ | ✅ | ✅ |
| Live Audio Interview | ❌ | ✅ | ✅ |
| Voice Transcription | ❌ | ❌ | ✅ |
| AI Responses | ❌ | ❌ | ✅ |
| AI Summary | ❌ | ❌ | ✅ |
| Text-to-Speech | ❌ | ❌ | ✅ |

## 🐛 Common Issues

### "npm: command not found"
```bash
# Install Node.js first
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
```

### "Cannot connect to Supabase"
- Double-check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Make sure you ran the SQL schema
- Verify project is active in Supabase dashboard

### "LiveKit connection failed"
- Verify LIVEKIT_API_KEY and LIVEKIT_API_SECRET
- Make sure backend server is running (npm run server)
- Check VITE_LIVEKIT_URL is correct

### "Microphone not working"
- Allow microphone permission in browser
- Use HTTPS in production (required for mic access)
- Check if mic works in other apps

### Backend server won't start"
- Make sure port 3001 is free
- Check all environment variables are set
- Run `npm install` again

## 📱 Demo Mode

The app includes a demo mode:
- Type answers instead of speaking
- Works without Deepgram/OpenAI
- Perfect for testing UI flow

## 🎓 Next Steps

1. ✅ Complete this quick start
2. 📖 Read full [README.md](./README.md)
3. 🎨 Customize questions and branding
4. 🚀 Deploy to production
5. 📧 Set up email notifications

## 💡 Pro Tips

- **Test First**: Use your own email as a candidate to test
- **Chrome Works Best**: For microphone and audio features
- **Incognito Mode**: Test candidate view without logging out
- **Console Logs**: Check browser console for detailed errors
- **Network Tab**: Monitor API calls during interview

## 🆘 Still Stuck?

1. Check browser console (F12) for errors
2. Verify all .env variables are set correctly
3. Make sure both servers are running
4. Try in a different browser
5. Check Supabase project is active

## ✨ You're Ready!

Your AI Interview Platform is now running. Start creating jobs and interviewing candidates!

---

**Quick Links:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/api/health
- Full Docs: [README.md](./README.md)
