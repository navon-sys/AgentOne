# 🗄️ Fix: Database Schema Not Set Up

## 🚨 The Error

```javascript
Error saving job: 
{
  code: 'PGRST204',
  message: "Could not find the 'created_by' column of 'jobs' in the schema cache"
}
```

**Root Cause:** Your Supabase database tables haven't been created yet.

---

## ✅ SOLUTION: Set Up Database Schema

### **Step 1: Go to Supabase SQL Editor**

1. Open your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar (database icon)
4. Click **"New query"**

### **Step 2: Copy the Schema SQL**

Open the schema file in your project:
```bash
cat /home/user/webapp/supabase-schema.sql
```

OR view it here: [supabase-schema.sql](./supabase-schema.sql)

### **Step 3: Run the SQL in Supabase**

1. **Copy ALL the SQL** from `supabase-schema.sql`
2. **Paste it** into the Supabase SQL Editor
3. Click **"Run"** (or press Ctrl+Enter)
4. Wait for execution to complete

**Expected output:**
```
✅ Tables created successfully:
  - jobs
  - candidates
  - interviews
  - interview_transcripts

Row Level Security enabled on all tables
Policies created for HR staff and candidate access
Indexes created for optimal performance

✅ Database schema initialization complete!
```

### **Step 4: Verify Tables Were Created**

In Supabase:
1. Go to **"Table Editor"** in left sidebar
2. You should see these tables:
   - ✅ `jobs`
   - ✅ `candidates`
   - ✅ `interviews`
   - ✅ `interview_transcripts`

---

## 🔍 What the Schema Creates

### **Tables:**

#### **1. jobs**
Stores job postings created by HR staff
- `id` (UUID, primary key)
- `title` (text)
- `description` (text)
- `default_questions` (JSONB array)
- `created_by` (UUID, references auth.users)
- `status` (active/inactive/archived)
- `created_at`, `updated_at` (timestamps)

#### **2. candidates**
Stores candidate information for each job
- `id` (UUID, primary key)
- `name`, `email` (text)
- `job_id` (UUID, references jobs)
- `access_token` (unique text)
- `interview_link` (text)
- `custom_questions` (JSONB array)
- `status` (created/link_sent/in_progress/completed/reviewed)
- `hr_notes` (text)
- `created_at`, `updated_at` (timestamps)

#### **3. interviews**
Stores interview session data
- `id` (UUID, primary key)
- `candidate_id` (UUID, references candidates)
- `started_at`, `completed_at` (timestamps)
- `status` (pending/in_progress/completed/failed)
- `ai_summary` (text)
- `ai_score` (integer 1-10)
- `livekit_room_name` (text)
- `created_at`, `updated_at` (timestamps)

#### **4. interview_transcripts**
Stores conversation transcripts
- `id` (UUID, primary key)
- `interview_id` (UUID, references interviews)
- `speaker` (ai/candidate)
- `message` (text)
- `question_index` (integer)
- `timestamp`, `created_at` (timestamps)

### **Security:**

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ HR users can only see their own jobs and candidates
- ✅ Candidates can't see other candidates' data
- ✅ Proper foreign key relationships
- ✅ Automatic timestamp updates

### **Performance:**

- ✅ Indexes on frequently queried columns
- ✅ Optimized for quick lookups
- ✅ Cascade deletes for data integrity

---

## 🧪 Test After Setup

### **Step 1: Create a Test Job**

1. Start your app:
   ```bash
   # Backend
   npm run server
   
   # Frontend (new terminal)
   npm run dev
   ```

2. Open http://localhost:5173
3. Sign in with your account
4. Go to **"Jobs & Candidates"**
5. Click **"Create New Job"**
6. Fill in:
   - **Title**: "Test Developer Position"
   - **Description**: "Testing database setup"
   - **Questions**: 
     - "Tell me about yourself"
     - "What are your strengths?"
7. Click **"Create Job"**

**Expected result:** ✅ Job created successfully!

### **Step 2: Verify in Supabase**

1. Go to Supabase → **Table Editor** → **jobs**
2. You should see your newly created job
3. Check that `created_by` column has your user ID

---

## 🛠️ Troubleshooting

### ❌ Error: "relation 'jobs' does not exist"

**Problem:** SQL didn't execute properly

**Solution:**
1. Make sure you copied ALL the SQL (entire file)
2. Check for any error messages in Supabase SQL Editor
3. Try running again

### ❌ Error: "permission denied for table jobs"

**Problem:** RLS policies might be too restrictive

**Solution:**
1. Make sure you're signed in to the app
2. Check that `auth.uid()` is working:
   ```sql
   SELECT auth.uid();
   ```
   Should return your user ID, not NULL

### ❌ Error: "new row violates row-level security policy"

**Problem:** RLS policy blocking insert

**Solution:**
1. Check that you're authenticated
2. Verify the policy allows INSERT:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'jobs';
   ```

### ❌ Still getting "Could not find 'created_by' column"

**Problem:** Schema cache needs refresh

**Solution:**
1. In Supabase, go to **Settings** → **API**
2. Note the changes
3. In your app, restart backend:
   ```bash
   pkill -f "node.*server" && npm run server
   ```
4. Hard refresh browser (Ctrl+Shift+R)

---

## 📋 Quick Setup Checklist

- [ ] Go to Supabase Dashboard
- [ ] Open SQL Editor
- [ ] Copy entire `supabase-schema.sql` file
- [ ] Paste and run in SQL Editor
- [ ] Verify tables created in Table Editor
- [ ] Restart backend server
- [ ] Refresh browser
- [ ] Try creating a job
- [ ] ✅ Should work now!

---

## 🔄 Reset Database (If Needed)

If you need to start fresh:

```sql
-- ⚠️ WARNING: This deletes ALL data!

-- Drop tables (reverse order due to foreign keys)
DROP TABLE IF EXISTS interview_transcripts CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Now run the full schema again
```

Then paste the entire `supabase-schema.sql` content.

---

## 📞 Alternative: Supabase CLI (Advanced)

If you prefer command line:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Push schema
supabase db push
```

---

## ✅ Success Indicators

After running the schema, you should be able to:

- ✅ Create jobs without errors
- ✅ Add candidates to jobs
- ✅ View jobs in Supabase Table Editor
- ✅ See `created_by` column populated with your user ID
- ✅ RLS working (you only see your own jobs)

---

## 📚 Related Files

- **supabase-schema.sql** - Complete database schema
- **SUPABASE_SETUP.md** - Detailed Supabase setup guide
- **README.md** - General project documentation

---

## 💡 Pro Tips

1. **Backup before changes:** Export your data before running schema updates
2. **Use migrations:** For production, use proper migration files
3. **Test policies:** Verify RLS policies work as expected
4. **Monitor logs:** Check Supabase logs for any issues

---

**TL;DR:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire `supabase-schema.sql` file
3. Paste and run
4. Verify tables created
5. Try creating a job in your app
6. ✅ Should work now!

---

Need the SQL file content? Run:
```bash
cat /home/user/webapp/supabase-schema.sql
```

**Now go set up your database! 🚀**
