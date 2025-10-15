# Supabase Database Setup Guide

## Error You're Seeing
```
Error saving job: Could not find the table 'public.jobs' in the schema cache
```

**Cause:** The database tables haven't been created yet in your Supabase project.

---

## Quick Fix (5 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to **https://app.supabase.com**
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy & Run Schema SQL
1. Open the file: **`supabase-schema.sql`** (in this project folder)
2. Copy **ALL** the SQL content
3. Paste into Supabase SQL Editor
4. Click **RUN** button (bottom right)

### Step 3: Verify Success
You should see output like:
```
NOTICE: Tables created successfully:
NOTICE:   - jobs
NOTICE:   - candidates
NOTICE:   - interviews
NOTICE:   - interview_transcripts
NOTICE: 
NOTICE: Row Level Security enabled on all tables
NOTICE: ✅ Database schema initialization complete!
```

### Step 4: Verify Tables Exist
1. In Supabase, click **Table Editor** (left sidebar)
2. You should now see 4 tables:
   - ✅ `jobs`
   - ✅ `candidates`
   - ✅ `interviews`
   - ✅ `interview_transcripts`

---

## Alternative: Use Supabase CLI (Optional)

If you have Supabase CLI installed:

```bash
cd /home/azureuser/webapp
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

---

## What This Schema Creates

### Tables

#### 1. **jobs**
- Stores job postings with default interview questions
- Fields: id, title, description, default_questions (JSON), created_by, status

#### 2. **candidates**
- Stores candidate information with unique access tokens
- Fields: id, name, email, job_id, access_token, custom_questions, status, hr_notes
- Status flow: `created` → `link_sent` → `in_progress` → `completed` → `reviewed`

#### 3. **interviews**
- Tracks interview sessions
- Fields: id, candidate_id, started_at, completed_at, status, ai_summary, ai_score, livekit_room_name

#### 4. **interview_transcripts**
- Stores conversation logs in real-time
- Fields: id, interview_id, speaker (ai/candidate), message, timestamp, question_index

### Security (Row Level Security)

**HR Staff (Authenticated Users):**
- ✅ Can read/write their own jobs
- ✅ Can manage candidates for their jobs
- ✅ Can view interviews and transcripts for their candidates

**Candidates (No Authentication):**
- ✅ Access via unique token (validated in app logic)
- ✅ Can insert interview data and transcripts
- ❌ Cannot read other candidates' data

### Performance Optimizations
- Indexed columns: `job_id`, `access_token`, `candidate_id`, `interview_id`
- Auto-updated `updated_at` timestamps on jobs, candidates, interviews

---

## After Running SQL

### Test the Connection

1. **Try creating a job** in the HR Portal again
2. **Check Supabase Table Editor** → you should see the new job row
3. **If still seeing errors**, check:

   ```bash
   # Verify environment variables are set
   cd /home/azureuser/webapp
   cat .env | grep SUPABASE
   ```

   Should output:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

---

## Troubleshooting

### Error: "permission denied for table jobs"
**Cause:** RLS policies blocking access

**Fix:** Ensure you're logged in to the app with the same user that created the job
- RLS policy: `auth.uid() = created_by`
- Each HR user can only see/edit their own jobs

### Error: "relation public.jobs does not exist"
**Cause:** SQL didn't run successfully

**Fix:** 
1. Go to Supabase SQL Editor
2. Run this simple test:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. If you don't see `jobs`, `candidates`, `interviews`, `interview_transcripts`:
   - Re-run the full `supabase-schema.sql` file
   - Check for error messages in SQL Editor output

### Error: "JWT expired" or "Invalid API key"
**Cause:** Wrong Supabase credentials in `.env`

**Fix:**
1. Go to Supabase Dashboard → Settings → API
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Update `.env` file
4. Restart frontend: `npm run dev`

---

## Visual Confirmation

After successful setup, your Supabase **Table Editor** should look like:

```
📁 public schema
  📄 jobs                      (0 rows)
  📄 candidates                (0 rows)
  📄 interviews                (0 rows)
  📄 interview_transcripts     (0 rows)
```

When you create a job in the HR Portal:
```
📁 public schema
  📄 jobs                      (1 row)  ← ✅ Success!
  📄 candidates                (0 rows)
  📄 interviews                (0 rows)
  📄 interview_transcripts     (0 rows)
```

---

## Next Steps After Setup

1. ✅ **Database schema created** (you're here!)
2. 🔧 **Configure Site URL** for email confirmations
   - Supabase Dashboard → Authentication → URL Configuration
   - Set Site URL: `http://20.82.140.166:5173`
3. 🚀 **Start servers**
   ```bash
   ./start-backend.sh
   ./start-frontend.sh
   ```
4. 🧪 **Test end-to-end**
   - Create job → Add candidate → Generate link → Conduct interview

---

## Need Help?

If you're still seeing errors after running the SQL:

1. **Check Supabase Logs:**
   - Supabase Dashboard → Logs → Postgres Logs

2. **Test database connection:**
   ```bash
   cd /home/azureuser/webapp
   npm run verify
   ```

3. **Restart frontend/backend:**
   ```bash
   ./cleanup-ports.sh
   ./start-backend.sh
   ./start-frontend.sh
   ```

---

## Summary

**The Fix:**
1. Open Supabase SQL Editor
2. Copy all content from `supabase-schema.sql`
3. Paste and RUN in SQL Editor
4. Verify tables appear in Table Editor
5. Try creating a job again → Should work! ✅
