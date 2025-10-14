# AI Interview Platform

A full-stack application featuring two distinct user interfaces for conducting AI-powered voice interviews.

## 🎯 Overview

This platform enables HR teams to create job postings, manage candidates, and conduct real-time AI-powered voice interviews with automatic transcription and analysis.

### Key Features

**HR Management Portal (Admin View)**
- 📊 Real-time dashboard with metrics and live interview monitoring
- 💼 Job creation and management with customizable questions
- 👥 Candidate management with unique interview link generation
- 📝 Interview review with AI-powered summaries and scoring
- 🗒️ Private HR notes for each candidate

**Candidate Interview Portal (Client View)**
- 🎤 Real-time voice interview with AI agent
- 📱 Secure token-based access (no login required)
- 💬 Live transcript display during interview
- ⏱️ Progress tracking with question counter
- 🎯 Status indicators (Listening, Thinking, Speaking)

## 🏗️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **LiveKit Client** - Real-time audio streaming

### Backend
- **Node.js + Express** - API server
- **LiveKit Server SDK** - Room management and media orchestration
- **Supabase** - Authentication and PostgreSQL database (Free tier)
- **Deepgram API** - Speech-to-Text (STT)
- **OpenAI GPT-4o** - AI interview responses and analysis
- **Piper TTS** - Text-to-Speech (Amy Medium voice) *with OpenAI fallback*

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **Supabase Account** (Free tier): https://supabase.com
3. **LiveKit Account** (Free tier): https://livekit.io
4. **Deepgram API Key** (Free tier): https://deepgram.com
5. **OpenAI API Key**: https://platform.openai.com

## 🚀 Setup Instructions

### 1. Clone and Install Dependencies

\`\`\`bash
cd /home/azureuser/webapp
npm install
\`\`\`

### 2. Set Up Supabase Database

1. Create a new project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the SQL schema from `src/supabaseClient.js` (the commented SQL at the bottom)
4. Execute the SQL to create all tables and security policies

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your credentials:

\`\`\`env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# LiveKit Configuration
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Deepgram API Key
DEEPGRAM_API_KEY=your-deepgram-api-key

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# Server Configuration
PORT=3001
\`\`\`

### 4. Get Your API Keys

#### Supabase (Free)
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Settings > API
4. Copy the `Project URL` (VITE_SUPABASE_URL)
5. Copy the `anon public` key (VITE_SUPABASE_ANON_KEY)

#### LiveKit (Free)
1. Sign up at https://livekit.io
2. Create a new project
3. Get your WebSocket URL (VITE_LIVEKIT_URL)
4. Generate API key and secret (LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

#### Deepgram (Free $200 credit)
1. Sign up at https://deepgram.com
2. Go to API Keys section
3. Create a new API key (DEEPGRAM_API_KEY)

#### OpenAI (Paid)
1. Sign up at https://platform.openai.com
2. Go to API Keys section
3. Create a new API key (OPENAI_API_KEY)

### 5. Run the Application

**Terminal 1 - Backend Server:**
\`\`\`bash
npm run server
\`\`\`

**Terminal 2 - Frontend Development Server:**
\`\`\`bash
npm run dev
\`\`\`

The application will be available at:
- Frontend: http://20.82.140.166:5173 (or http://localhost:5173)
- Backend API: http://20.82.140.166:3001 (or http://localhost:3001)

## 📖 User Guide

### For HR Staff

1. **Sign Up/Login**
   - Visit http://20.82.140.166:5173 (or http://localhost:5173 locally)
   - Create an account using your email
   - Check your email for confirmation (if required)

2. **Create a Job**
   - Navigate to "Jobs & Candidates"
   - Click "Create New Job"
   - Enter job title, description, and default interview questions
   - Save the job

3. **Add Candidates**
   - Select a job from the list
   - Click "Add Candidate"
   - Enter candidate name and email
   - (Optional) Add custom questions for this specific candidate
   - System generates a unique interview link

4. **Send Interview Link**
   - Copy the generated interview link
   - Send it to the candidate via email or other communication method
   - Mark candidate status as "Link Sent"

5. **Monitor Live Interviews**
   - Dashboard shows real-time active interviews
   - View which candidates are currently being interviewed

6. **Review Completed Interviews**
   - Navigate to completed candidates
   - Click "View Interview Results"
   - Read full transcript
   - Generate AI summary and score
   - Add private HR notes

### For Candidates

1. **Access Interview**
   - Open the unique link sent by HR
   - Review interview instructions
   - Ensure microphone is working

2. **Start Interview**
   - Click "Start Interview"
   - Allow microphone permissions
   - AI will ask questions one by one

3. **During Interview**
   - Speak clearly when AI is listening
   - Watch status indicators
   - See live transcript of conversation
   - Track progress with question counter

4. **Complete Interview**
   - Answer all questions
   - Interview automatically completes
   - System confirms submission

## 🔧 API Endpoints

### Backend Server (Port 3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check and service status |
| `/api/livekit-token` | POST | Generate LiveKit access token |
| `/api/speak-question` | POST | Convert question to speech (TTS) |
| `/api/transcribe` | POST | Transcribe audio (Deepgram STT) |
| `/api/generate-response` | POST | Generate AI response (OpenAI) |
| `/api/generate-summary` | POST | Generate interview summary and score |
| `/api/piper-tts` | POST | Piper TTS endpoint (with OpenAI fallback) |

## 🗄️ Database Schema

### Tables

**jobs**
- id, created_at, updated_at
- title, description
- default_questions (JSONB array)
- created_by (user_id)
- status (active/inactive/archived)

**candidates**
- id, created_at, updated_at
- name, email
- job_id (foreign key)
- access_token (unique)
- custom_questions (JSONB array)
- status (created/link_sent/in_progress/completed/reviewed)
- hr_notes
- interview_link

**interviews**
- id, created_at, updated_at
- candidate_id (foreign key)
- started_at, completed_at
- status (pending/in_progress/completed/failed)
- ai_summary, ai_score (1-10)
- livekit_room_name

**interview_transcripts**
- id, created_at
- interview_id (foreign key)
- speaker (ai/candidate)
- message
- timestamp
- question_index

## 🎨 UI Components

### HR Portal Components
- `LoginPage.jsx` - Authentication
- `HRPortal.jsx` - Main portal wrapper
- `Dashboard.jsx` - Metrics and overview
- `JobManagement.jsx` - Job CRUD operations
- `CandidateManagement.jsx` - Candidate management
- `InterviewReview.jsx` - Interview analysis

### Candidate Portal Components
- `CandidatePortal.jsx` - Landing and instructions
- `InterviewRoom.jsx` - Live interview interface

## 🔐 Security Features

- **Row Level Security (RLS)** on all database tables
- **Secure token-based** candidate access
- **Firebase Authentication** for HR users
- **API key protection** via environment variables
- **CORS enabled** for cross-origin requests

## 🚧 Production Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
\`\`\`bash
npm run build
\`\`\`

2. Deploy the `dist` folder to your hosting provider

### Backend (Railway/Heroku/DigitalOcean)

1. Set environment variables on your hosting platform
2. Deploy the `server` directory
3. Ensure all API keys are properly configured

### Database (Supabase)

- Already cloud-hosted
- Automatic backups and scaling
- Built-in security and authentication

## 🐛 Troubleshooting

### "Microphone not working"
- Check browser permissions
- Ensure HTTPS in production (required for microphone access)

### "LiveKit connection failed"
- Verify LiveKit credentials in .env
- Check that backend server is running
- Ensure WebSocket URL is correct

### "Transcription not working"
- Verify Deepgram API key
- Check API credit balance
- Review console logs for errors

### "AI responses failing"
- Verify OpenAI API key
- Check API credit balance
- Review rate limits

## 📊 Demo Mode

The application includes a demo mode that allows testing without full service setup:
- Uses text input instead of voice
- OpenAI TTS fallback for Piper
- Graceful degradation when services are unavailable

## 🔄 Real-Time Features

- Live interview status updates
- Real-time transcript display
- Active interview monitoring
- WebSocket-based audio streaming

## 📱 Responsive Design

- Mobile-optimized interfaces
- Tablet-friendly layouts
- Desktop-enhanced experience
- Touch-friendly controls

## 🎯 Future Enhancements

- [ ] Video interview support
- [ ] Multi-language interviews
- [ ] Advanced analytics dashboard
- [ ] Candidate self-scheduling
- [ ] Email notifications
- [ ] Interview recording playback
- [ ] Bulk candidate import
- [ ] Custom branding options

## 📝 License

This project is for demonstration and educational purposes.

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API provider documentation
3. Check browser console for errors
4. Verify all environment variables

## 🎉 Credits

Built with:
- React + Vite
- Tailwind CSS
- Supabase
- LiveKit
- Deepgram
- OpenAI
- Piper TTS

---

**Note**: This is a comprehensive demonstration application. For production use, additional security hardening, error handling, and testing are recommended.
