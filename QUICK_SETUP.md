# Quick Setup Guide - Fix Authentication Error

## Problem Fixed ✅
**Error**: "Forbidden use of secret API key in browser" when creating user

## Solution Implemented
User creation now uses a secure backend endpoint instead of direct frontend Supabase calls.

## Setup Steps

### 1. Get Your Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **`service_role`** key (⚠️ Keep this secret!)

### 2. Create .env File

```bash
# Copy example file
cp .env.example .env
```

Edit `.env` and add your keys:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key  # ⚠️ SECRET!

# Other API keys...
OPENAI_API_KEY=sk-...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
DEEPGRAM_API_KEY=...

# Server config
PORT=3001
VITE_API_URL=http://localhost:3001
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Backend Server

```bash
npm run server
```

You should see:
```
🚀 Backend server running on http://localhost:3001
📋 Configuration Status:
  Supabase Admin: ✅ Configured
```

### 5. Start Frontend (in another terminal)

```bash
npm run dev
```

### 6. Create Your First HR User

1. Open browser: http://localhost:5173
2. Click **"Don't have an account? Sign Up"**
3. Enter email and password (min 6 chars)
4. Click **"Create Account"**
5. Success! You can now sign in

## How It Works Now

### Before (❌ Insecure)
```
Frontend → Supabase signup (exposed secret key) → Error!
```

### After (✅ Secure)
```
Frontend → Backend API → Supabase Admin (service role key) → Success!
```

## API Endpoint Details

**POST** `/api/admin/create-user`

**Request:**
```json
{
  "email": "hr@company.com",
  "password": "securepassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User created successfully. You can now sign in.",
  "user": {
    "id": "uuid",
    "email": "hr@company.com"
  }
}
```

**Response (Error):**
```json
{
  "error": "Email already registered"
}
```

## Security Notes

✅ **Secure**: Service role key stays in backend .env (never exposed to browser)
✅ **Auto-confirmed**: Users can sign in immediately (no email confirmation)
✅ **HR Role**: Users are tagged with `hr_manager` role in metadata
✅ **No public signup**: Supabase public signup can be disabled

## Testing

```bash
# Test backend health
curl http://localhost:3001/api/health

# Test user creation
curl -X POST http://localhost:3001/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Troubleshooting

### Error: "Supabase admin not configured"
❌ **Problem**: Service role key not in .env
✅ **Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` to .env

### Error: "Email already registered"
❌ **Problem**: User already exists
✅ **Fix**: Use a different email or delete user in Supabase Dashboard

### Error: "Connection refused"
❌ **Problem**: Backend not running
✅ **Fix**: Run `npm run server` first

### Error: "Invalid API key"
❌ **Problem**: Wrong service role key
✅ **Fix**: Copy the correct `service_role` key from Supabase Dashboard

## Production Deployment

For production, ensure:

1. ✅ Use environment variables (not .env file)
2. ✅ Enable HTTPS
3. ✅ Restrict CORS to your domain
4. ✅ Add rate limiting to `/api/admin/create-user`
5. ✅ Add authentication/authorization for admin endpoint
6. ✅ Enable email confirmation in Supabase settings

## Need More Help?

See detailed documentation: [FIX_SIGNUP_ERROR.md](./FIX_SIGNUP_ERROR.md)
