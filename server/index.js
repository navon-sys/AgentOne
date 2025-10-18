import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@deepgram/sdk'
import OpenAI from 'openai'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize clients
const deepgram = process.env.DEEPGRAM_API_KEY 
  ? createClient(process.env.DEEPGRAM_API_KEY)
  : null

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Interview Platform API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      livekitToken: 'POST /api/livekit-token',
      speakQuestion: 'POST /api/speak-question',
      transcribe: 'POST /api/transcribe',
      generateResponse: 'POST /api/generate-response',
      generateSummary: 'POST /api/generate-summary',
      piperTTS: 'POST /api/piper-tts'
    }
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    services: {
      livekit: !!process.env.LIVEKIT_API_KEY,
      deepgram: !!process.env.DEEPGRAM_API_KEY,
      openai: !!process.env.OPENAI_API_KEY
    },
    openaiConfigured: !!openai
  })
})

// Test TTS endpoint
app.get('/api/test-tts', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ 
        success: false, 
        message: 'OpenAI not configured',
        env_key_exists: !!process.env.OPENAI_API_KEY,
        openai_client_exists: !!openai
      })
    }
    
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: "This is a test of the text to speech system.",
    })
    
    const buffer = Buffer.from(await mp3.arrayBuffer())
    const base64Audio = buffer.toString('base64')
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`
    
    res.json({
      success: true,
      message: 'TTS working!',
      audioUrl: audioDataUrl,
      audioSize: buffer.length
    })
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
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

    const token = await at.toJwt()
    const wsUrl = process.env.VITE_LIVEKIT_URL || 'ws://20.82.140.166:7880'

    // Ensure token is a string
    const tokenString = String(token)
    
    console.log('Generated LiveKit token for:', participantName, 'in room:', roomName)
    console.log('Token length:', tokenString.length)

    res.json({ token: tokenString, wsUrl })
  } catch (error) {
    console.error('Error generating LiveKit token:', error)
    res.status(500).json({ error: error.message })
  }
})

// Speak question using TTS - Returns audio directly
app.post('/api/speak-question', async (req, res) => {
  try {
    const { interviewId, question, roomName } = req.body

    console.log('🔊 TTS Request for:', question)
    console.log('📊 OpenAI configured:', !!openai)
    
    // Check if OpenAI is configured
    if (!openai) {
      console.warn('⚠️ OpenAI not configured')
      return res.json({ 
        success: false, 
        message: 'TTS not configured - OpenAI API key missing',
        audioUrl: null
      })
    }
    
    try {
      console.log('🎵 Generating speech with OpenAI TTS...')
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // Clear, professional voice
        input: question,
        speed: 1.0
      })

      console.log('📥 Converting audio to buffer...')
      const buffer = Buffer.from(await mp3.arrayBuffer())
      console.log('✅ Audio buffer created, size:', buffer.length, 'bytes')
      
      // Convert buffer to base64 data URL
      const base64Audio = buffer.toString('base64')
      const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`
      
      console.log('✅ Audio data URL created, length:', audioDataUrl.length)
      console.log('📤 Sending response with audioUrl...')
      
      // Return audio as data URL for immediate playback
      res.json({ 
        success: true, 
        audioUrl: audioDataUrl,
        message: 'Question spoken (using OpenAI TTS)',
        audioSize: buffer.length
      })
      
      console.log('✅ Response sent successfully')
    } catch (error) {
      console.error('❌ TTS Generation Error:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n')[0]
      })
      
      res.json({ 
        success: false, 
        message: 'TTS generation failed',
        error: error.message,
        audioUrl: null
      })
    }
  } catch (error) {
    console.error('❌ Server Error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message,
      audioUrl: null
    })
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
  console.log('\n💡 To configure missing services, update your .env file\n')
})

export default app
