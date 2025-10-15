# 🔧 Fix: "Could not find the table 'public.jobs'" Error

## What Happened?

You tried to create a job in the HR Portal and got this error:
```
Error saving job: Could not find the table 'public.jobs' in the schema cache
```

**Root Cause:** Your Supabase database doesn't have the required tables yet. The application code expects 4 tables (`jobs`, `candidates`, `interviews`, `interview_transcripts`) but they don't exist in your Supabase project.

---

## ✅ The Fix (5-Minute Setup)

### Step 1: Open Supabase SQL Editor

1. Go to **https://app.supabase.com**
2. Sign in to your account
3. Select your project for this AI Interview Platform
4. Click **SQL Editor** in the left sidebar (looks like `</>`)
5. Click **+ New Query** button

### Step 2: Run the Database Schema

1. **On your VM**, view the SQL file:
   ```bash
   cd /home/azureuser/webapp
   cat supabase-schema.sql
   ```

2. **Copy ALL the content** from `supabase-schema.sql`

3. **Paste into Supabase SQL Editor** (the text area in the browser)

4. **Click RUN** (bottom right corner, or press `Ctrl+Enter`)

### Step 3: Verify Success

After running the SQL, you should see output like:
```
NOTICE: Tables created successfully:
NOTICE:   - jobs
NOTICE:   - candidates
NOTICE:   - interviews
NOTICE:   - interview_transcripts
NOTICE: 
NOTICE: Row Level Security enabled on all tables
NOTICE: Policies created for HR staff and candidate access
NOTICE: Indexes created for optimal performance
NOTICE: 
NOTICE: ✅ Database schema initialization complete!
```

### Step 4: Confirm in Table Editor

1. Click **Table Editor** in Supabase left sidebar (looks like a table grid)
2. You should now see 4 tables:
   ```
   📄 jobs                      (0 rows)
   📄 candidates                (0 rows)
   📄 interviews                (0 rows)
   📄 interview_transcripts     (0 rows)
   ```

---

## 🧪 Test It Works

### 1. Restart Your Application

```bash
cd /home/azureuser/webapp

# Clean up any running processes
./cleanup-ports.sh

# Start backend
./start-backend.sh &

# Start frontend (in another terminal or background)
./start-frontend.sh &
```

### 2. Try Creating a Job Again

1. Open browser: **http://20.82.140.166:5173**
2. Login or sign up (if first time)
3. Click **Jobs** tab
4. Fill out job creation form:
   - **Job Title:** "Senior Software Engineer"
   - **Description:** "We are looking for..."
   - **Questions:** Add 5-10 interview questions
5. Click **Create Job**
6. **Should work now!** ✅

### 3. Verify in Supabase

1. Go back to Supabase Table Editor
2. Click on the **jobs** table
3. You should see your newly created job:
   ```
   📄 jobs                      (1 row)  ← ✅ Your job is here!
   ```

---

## 📊 What the Schema Creates

### Tables Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  jobs                          candidates                   │
│  ├── id (UUID)                 ├── id (UUID)                │
│  ├── title                     ├── name                     │
│  ├── description               ├── email                    │
│  ├── default_questions         ├── job_id (FK → jobs)      │
│  ├── created_by (FK → users)   ├── access_token (unique)   │
│  └── status                    ├── custom_questions        │
│                                ├── status                   │
│                                └── hr_notes                 │
│                                                             │
│  interviews                    interview_transcripts        │
│  ├── id (UUID)                 ├── id (UUID)                │
│  ├── candidate_id (FK)         ├── interview_id (FK)       │
│  ├── started_at                ├── speaker (ai/candidate)  │
│  ├── completed_at              ├── message                 │
│  ├── status                    ├── timestamp               │
│  ├── ai_summary                └── question_index          │
│  ├── ai_score (1-10)                                       │
│  └── livekit_room_name                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Security (Row Level Security)

**HR Staff Access:**
- ✅ Read/write their own jobs (based on `created_by`)
- ✅ Manage candidates for their jobs only
- ✅ View interviews and transcripts for their candidates
- ❌ Cannot see other HR staff's data

**Candidate Access:**
- ✅ Access interview via unique token (no login)
- ✅ Insert interview data and transcripts
- ❌ Cannot read other candidates' data

### Performance Features
- **Indexes** on frequently queried columns (job_id, access_token, etc.)
- **Auto-updated timestamps** (`updated_at` on jobs, candidates, interviews)
- **Cascading deletes** (delete job → deletes related candidates → deletes interviews)

---

## 🔧 Troubleshooting

### Still Getting "Could not find table" Error?

**Check environment variables:**
```bash
cd /home/azureuser/webapp
cat .env | grep SUPABASE
```

Should output:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If missing or wrong:
1. Go to Supabase Dashboard → Settings → API
2. Copy **Project URL** and **anon public** key
3. Update `.env` file
4. Restart frontend: `./cleanup-ports.sh && ./start-frontend.sh`

---

### Error: "permission denied for table jobs"

**Cause:** Row Level Security blocking access

**Check:**
1. Are you logged in to the app?
2. In Supabase Table Editor, click **jobs** table
3. Check the `created_by` column - it should match your user ID

**Fix:**
```sql
-- Run in Supabase SQL Editor to check your user ID
SELECT id, email FROM auth.users;

-- Your jobs should have created_by = your user ID
SELECT * FROM jobs WHERE created_by = 'your-user-id-here';
```

---

### Error: "JWT expired" or "Invalid API key"

**Cause:** Wrong Supabase credentials

**Fix:**
1. Supabase Dashboard → Settings → API
2. Verify **Project URL** and **anon public** key
3. Update `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```
4. Restart:
   ```bash
   ./cleanup-ports.sh
   ./start-frontend.sh &
   ```

---

### Tables Don't Appear in Table Editor

**Possible causes:**
1. SQL didn't run successfully
2. SQL had errors (check SQL Editor output)
3. Connected to wrong Supabase project

**Fix:**
1. Run this test query in SQL Editor:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
2. If you don't see `jobs`, `candidates`, `interviews`, `interview_transcripts`:
   - Re-run the full `supabase-schema.sql`
   - Look for error messages in red
   - Check you're in the correct project

---

## 📋 Complete Startup Checklist

After running the database schema, follow this checklist:

- [ ] **Database schema created** (you just did this!)
- [ ] **Tables visible in Supabase Table Editor**
- [ ] **Environment variables correct in `.env`**
- [ ] **Site URL configured for emails** (see SUPABASE_EMAIL_FIX.md)
- [ ] **Azure NSG rules allow ports 5173 and 3001**
- [ ] **Backend server running** (`./start-backend.sh`)
- [ ] **Frontend server running** (`./start-frontend.sh`)
- [ ] **Can access HR Portal** at http://20.82.140.166:5173
- [ ] **Can create jobs successfully** ✅

---

## 🎯 Next Steps After Database Setup

### 1. Configure Email Links (Important!)

Supabase sends email confirmations with localhost links by default. Fix this:

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL:** `http://20.82.140.166:5173`
3. Add **Redirect URLs:**
   - `http://20.82.140.166:5173/**`
   - `http://localhost:5173/**` (for local dev)

See `SUPABASE_EMAIL_FIX.md` for detailed instructions.

### 2. Test End-to-End Flow

```
1. HR Login → Create Job → Add Candidate → Generate Link
2. Copy candidate link: http://20.82.140.166:5173/interview?token=xxx
3. Open in incognito/different browser
4. Candidate starts interview
5. AI conducts interview via voice
6. HR reviews completed interview with AI analysis
```

### 3. Configure API Keys (If Not Done)

Check if all API keys are configured:
```bash
cd /home/azureuser/webapp
npm run verify
```

Required for full functionality:
- ✅ Supabase (database + auth)
- ✅ LiveKit (WebRTC audio)
- ✅ Deepgram (speech-to-text)
- ✅ OpenAI (AI responses + analysis)

---

## 📚 Related Documentation

- **`SUPABASE_SETUP.md`** - Detailed database setup guide
- **`SUPABASE_EMAIL_FIX.md`** - Fix email confirmation links
- **`QUICKSTART.md`** - Complete project setup (10 minutes)
- **`README.md`** - Full project documentation
- **`AZURE_NETWORKING.md`** - Understanding public vs private IP

---

## ✅ Success Indicators

You'll know everything is working when:

1. **No database errors** when creating jobs
2. **Jobs appear in Supabase Table Editor** immediately
3. **Can add candidates** and generate interview links
4. **Candidate links work** (token validation succeeds)
5. **Live interviews function** with real-time audio
6. **Transcripts save to database** in real-time
7. **HR can review completed interviews** with AI summary

---

## 🆘 Still Need Help?

If you're still experiencing issues:

1. **Check backend logs:**
   ```bash
   cd /home/azureuser/webapp
   # If running in background, check logs
   tail -f nohup.out
   ```

2. **Check frontend console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for red error messages

3. **Verify network connectivity:**
   ```bash
   # Test Supabase connection
   curl https://your-project.supabase.co
   
   # Test backend API
   curl http://20.82.140.166:3001/api/health
   ```

4. **Review Supabase logs:**
   - Supabase Dashboard → Logs → Postgres Logs
   - Look for query errors or permission issues

---

## 🎉 You're All Set!

Once you see jobs appearing in the Supabase Table Editor, your database is properly configured and the application should work smoothly.

**Quick test:** Create a job → Add candidate → Copy interview link → Open in new browser → Start interview ✅

**Repository:** https://github.com/navon-sys/AgentOne

**Latest commits pushed:**
- ✅ Supabase database schema setup files
- ✅ Port cleanup utility script
- ✅ This troubleshooting guide
