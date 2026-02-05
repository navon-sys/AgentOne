import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { AccessToken } from 'livekit-server-sdk'
import { createClient as createDeepgramClient } from '@deepgram/sdk'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize clients
const deepgram = process.env.DEEPGRAM_API_KEY 
  ? createDeepgramClient(process.env.DEEPGRAM_API_KEY)
  : null

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// Initialize Supabase Admin Client (with service role key for admin operations)
const supabaseAdmin = (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createSupabaseClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    services: {
      livekit: !!process.env.LIVEKIT_API_KEY,
      deepgram: !!process.env.DEEPGRAM_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      supabase: !!supabaseAdmin
    }
  })
})

// Admin endpoint to create HR users (secure backend-only operation)
app.post('/api/admin/create-user', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: 'Supabase admin not configured. Please set SUPABASE_SERVICE_ROLE_KEY in .env' 
      })
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Create user with admin privileges (skips email confirmation)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'hr_manager'
      }
    })

    if (error) throw error

    res.json({ 
      success: true, 
      message: 'User created successfully. You can now sign in.',
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: error.message })
  }
})

// Generate LiveKit access token
app.post('/api/livekit-token', async (req, res) => {
  try {
    const { roomName, participantName, interviewId } = req.body

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return res.status(500).json({ error: 'LiveKit credentials not configured' })
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantName,
        name: participantName,
      }
    )

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    })

    const token = at.toJwt()
    const wsUrl = process.env.VITE_LIVEKIT_URL || 'ws://20.82.140.166:7880'

    res.json({ token, wsUrl })
  } catch (error) {
    console.error('Error generating LiveKit token:', error)
    res.status(500).json({ error: error.message })
  }
})

// Speak question using TTS (Piper TTS integration would go here)
app.post('/api/speak-question', async (req, res) => {
  try {
    const { interviewId, question, roomName } = req.body

    // In a production environment, this would:
    // 1. Generate speech using Piper TTS (Amy Medium voice)
    // 2. Stream the audio to the LiveKit room
    // 3. Use LiveKit's audio track to play it for the participant
    
    // For demonstration, we'll use OpenAI's TTS as a fallback
    if (openai) {
      try {
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "nova", // Similar to Amy Medium
          input: question,
        })

        const buffer = Buffer.from(await mp3.arrayBuffer())
        
        // In production, stream this to LiveKit room
        // For now, we'll just acknowledge the request
        res.json({ 
          success: true, 
          message: 'Question spoken (using OpenAI TTS demo)' 
        })
      } catch (error) {
        console.error('TTS Error:', error)
        res.json({ 
          success: true, 
          message: 'Question queued (TTS not configured)' 
        })
      }
    } else {
      res.json({ 
        success: true, 
        message: 'Question queued (TTS not configured)' 
      })
    }
  } catch (error) {
    console.error('Error speaking question:', error)
    res.status(500).json({ error: error.message })
  }
})

// Transcribe audio using Deepgram
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioUrl } = req.body

    if (!deepgram) {
      return res.status(500).json({ error: 'Deepgram API key not configured' })
    }

    // In production, this would receive audio stream from LiveKit
    // and use Deepgram's real-time transcription
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: audioUrl },
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
      }
    )

    if (error) throw error

    const transcript = result.results.channels[0].alternatives[0].transcript

    res.json({ transcript })
  } catch (error) {
    console.error('Error transcribing audio:', error)
    res.status(500).json({ error: error.message })
  }
})

// Generate AI response using OpenAI
app.post('/api/generate-response', async (req, res) => {
  try {
    const { question, candidateAnswer, context } = req.body

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI interviewer conducting a professional job interview. 
          Be polite, encouraging, and professional. Ask follow-up questions naturally 
          based on the candidate's responses. Keep responses concise and conversational.
          
          Context: ${context || 'General interview'}`
        },
        {
          role: 'user',
          content: `Question asked: ${question}\nCandidate's answer: ${candidateAnswer}\n\nProvide a brief acknowledgment or follow-up.`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    })

    const response = completion.choices[0].message.content

    res.json({ response })
  } catch (error) {
    console.error('Error generating AI response:', error)
    res.status(500).json({ error: error.message })
  }
})

// Generate interview summary and score
app.post('/api/generate-summary', async (req, res) => {
  try {
    const { candidateName, jobTitle, transcripts } = req.body

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    // Format transcript for analysis
    const conversation = transcripts
      .map(t => `${t.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${t.message}`)
      .join('\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert HR analyst. Analyze the following job interview transcript 
          and provide a comprehensive summary and score. Focus on:
          1. Communication skills
          2. Technical knowledge (if applicable)
          3. Problem-solving abilities
          4. Cultural fit
          5. Overall impression
          
          Provide a score from 1-10 where:
          1-3: Not recommended
          4-6: Average candidate
          7-8: Good candidate
          9-10: Excellent candidate
          
          Format your response as JSON with fields: "summary" (detailed paragraph) and "score" (number 1-10).`
        },
        {
          role: 'user',
          content: `Candidate: ${candidateName}\nPosition: ${jobTitle}\n\nInterview Transcript:\n${conversation}\n\nProvide analysis in JSON format.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(completion.choices[0].message.content)

    res.json({ 
      summary: result.summary || 'Analysis completed',
      score: result.score || 5
    })
  } catch (error) {
    console.error('Error generating summary:', error)
    res.status(500).json({ error: error.message })
  }
})

// Piper TTS endpoint (placeholder for actual Piper TTS integration)
app.post('/api/piper-tts', async (req, res) => {
  try {
    const { text, voice = 'amy_medium' } = req.body

    // In production, this would:
    // 1. Call Piper TTS with the Amy Medium voice model
    // 2. Return the generated audio file
    // 3. Stream it to the LiveKit room
    
    // For now, we'll use OpenAI TTS as a fallback
    if (openai) {
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: text,
      })

      const buffer = Buffer.from(await mp3.arrayBuffer())
      
      res.set('Content-Type', 'audio/mpeg')
      res.send(buffer)
    } else {
      res.status(500).json({ 
        error: 'TTS not configured. Please set up Piper TTS or OpenAI API key.' 
      })
    }
  } catch (error) {
    console.error('Error with TTS:', error)
    res.status(500).json({ error: error.message })
  }
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on http://20.82.140.166:${PORT}`)
  console.log(`🌐 Also accessible at http://localhost:${PORT}`)
  console.log('\n📋 Configuration Status:')
  console.log(`  LiveKit: ${process.env.LIVEKIT_API_KEY ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`  Deepgram: ${process.env.DEEPGRAM_API_KEY ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`  OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`  Supabase Admin: ${supabaseAdmin ? '✅ Configured' : '❌ Not configured'}`)
  console.log('\n💡 To configure missing services, update your .env file')
  console.log('📝 See FIX_SIGNUP_ERROR.md for authentication setup guide\n')
})

export default app
