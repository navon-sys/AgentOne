# Fix: "Forbidden use of secret API key in browser" Error

## Problem
Getting error when creating user: "Forbidden use of secret API key in browser"

## Root Cause
This error occurs when Supabase authentication is not properly configured. The `supabase.auth.signUp()` method requires specific Supabase project settings to be enabled.

## Solution

### Step 1: Configure Supabase Authentication Settings

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to**: Authentication → Settings → Auth Providers
4. **Configure Email Provider**:
   - ✅ Enable Email provider
   - ✅ Enable Signup
   - ⚠️ For development: Disable "Confirm email" (turn OFF)
   - ⚠️ For production: Enable "Confirm email" (turn ON)

### Step 2: Configure Site URL and Redirect URLs

1. In **Authentication → URL Configuration**:
   - **Site URL**: 
     - Development: `http://localhost:5173`
     - Production: `https://your-domain.com`
   - **Redirect URLs**: Add both:
     - `http://localhost:5173/**`
     - `https://your-domain.com/**`

### Step 3: Create .env File

Create a `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` with your actual Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Get these from: Supabase Dashboard → Settings → API
```

### Step 4: Verify Row Level Security (RLS) Policies

Make sure your RLS policies allow public signup. Run this SQL in Supabase SQL Editor:

```sql
-- Allow anyone to read their own user data
CREATE POLICY "Users can read their own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);

-- The rest of the policies are already in src/supabaseClient.js
```

### Step 5: Alternative - Use Admin Functions

If you want to keep strict authentication, create a backend endpoint to handle user creation:

**server/index.js** (add this endpoint):

```javascript
// Admin user creation endpoint (requires admin key)
app.post('/api/admin/create-user', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Use Supabase Admin API (requires service role key)
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // This is the SECRET key
    );
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Skip email confirmation
    });
    
    if (error) throw error;
    
    res.json({ success: true, user: data.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Then in **.env** add:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

And update **LoginPage.jsx** to use this endpoint for signup:

```javascript
if (isSignUp) {
  // Call backend instead of direct Supabase
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  setMessage('Account created! You can now sign in.');
}
```

## Quick Test

1. **Start backend**: `npm run server`
2. **Start frontend**: `npm run dev`
3. **Try signing up**: Use a test email and password
4. **Check console**: Look for detailed error messages

## Common Issues

### Issue 1: "Email rate limit exceeded"
**Solution**: Wait 1 hour or use a different email address

### Issue 2: "Invalid API key"
**Solution**: Double-check your VITE_SUPABASE_ANON_KEY in .env

### Issue 3: "Email not confirmed"
**Solution**: 
- Check your email for confirmation link
- OR disable email confirmation in Supabase settings
- OR use the admin endpoint approach above

## Recommended Approach for Your App

For an HR interview platform, I recommend:

1. **Disable public signups** in Supabase (turn OFF "Enable Signup")
2. **Use the admin endpoint** approach to create HR users (more secure)
3. **Keep email confirmation OFF** for development, ON for production
4. **Candidates don't need accounts** - they use access tokens

This way:
- ✅ Only admins can create HR users (via backend with service role key)
- ✅ No public signup form exposure
- ✅ Candidates access interviews via unique tokens (no accounts needed)
- ✅ More secure overall

## Need Help?

If you still get errors:
1. Check Supabase Dashboard → Logs → Auth Logs
2. Look for specific error messages
3. Share the error details for more specific help
