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
    }
  })
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

// Speak question using TTS
app.post('/api/speak-question', async (req, res) => {
  try {
    const { interviewId, question, roomName } = req.body

    console.log('🔊 TTS Request for:', question)
    
    // For demonstration, we'll use OpenAI's TTS
    if (openai) {
      try {
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "nova", // Similar to Amy Medium
          input: question,
        })

        const buffer = Buffer.from(await mp3.arrayBuffer())
        
        // Convert buffer to base64 data URL
        const base64Audio = buffer.toString('base64')
        const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`
        
        console.log('✅ Audio generated, size:', buffer.length, 'bytes')
        
        // Return audio as data URL for immediate playback
        res.json({ 
          success: true, 
          audioUrl: audioDataUrl,
          message: 'Question spoken (using OpenAI TTS)' 
        })
      } catch (error) {
        console.error('TTS Error:', error)
        res.json({ 
          success: true, 
          message: 'Question queued (TTS error)',
          error: error.message
        })
      }
    } else {
      console.warn('⚠️ OpenAI not configured, no TTS available')
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
  console.log('\n💡 To configure missing services, update your .env file\n')
})

export default app
