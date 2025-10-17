import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Room } from 'livekit-client'

const InterviewRoom = ({ candidate, job, interview, onComplete }) => {
  const [status, setStatus] = useState('connecting') // connecting, listening, thinking, speaking, completed
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [transcript, setTranscript] = useState([])
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  const audioContextRef = useRef(null)
  const mediaStreamRef = useRef(null)

  const questions = candidate.custom_questions || []
  const totalQuestions = questions.length

  useEffect(() => {
    // Initialize interview
    initializeInterview()
    
    return () => {
      // Cleanup
      if (room) {
        console.log('Cleaning up LiveKit room connection')
        room.removeAllListeners()
        room.disconnect()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const initializeInterview = async () => {
    try {
      console.log('🎬 Starting interview initialization...')
      
      // Check WebRTC support
      if (!('RTCPeerConnection' in window)) {
        throw new Error('Your browser does not support WebRTC. Please use a modern browser like Chrome, Firefox, or Edge.')
      }
      
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Microphone access is not available. ' +
          'This could be because:\n\n' +
          '1. You are accessing the site over HTTP instead of HTTPS\n' +
          '2. Your browser does not support microphone access\n' +
          '3. Microphone permissions are blocked\n\n' +
          'Please try:\n' +
          '• Using Chrome or Firefox\n' +
          '• Granting microphone permissions when prompted\n' +
          '• Accessing via localhost or HTTPS'
        )
      }
      
      console.log('✅ Browser compatibility check passed')

      // Get LiveKit token from backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://20.82.140.166:3001'
      console.log('📡 Requesting LiveKit token from:', `${apiUrl}/api/livekit-token`)
      
      const response = await fetch(`${apiUrl}/api/livekit-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: interview.livekit_room_name,
          participantName: candidate.name,
          interviewId: interview.id
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Token request failed:', response.status, errorText)
        throw new Error(`Failed to get LiveKit token (${response.status}). Make sure the backend server is running and LiveKit credentials are configured.`)
      }

      const { token, wsUrl } = await response.json()
      console.log('✅ LiveKit token received')
      console.log('🔗 Connecting to:', wsUrl)

      // Connect to LiveKit room
      const livekitRoom = new Room({
        // Enable more verbose logging for debugging
        logLevel: 'debug',
        // Adaptive stream settings
        adaptiveStream: true,
        // Dynacast for better performance
        dynacast: true,
      })
      setRoom(livekitRoom)

      // Set up comprehensive event listeners
      livekitRoom.on('trackSubscribed', handleTrackSubscribed)
      livekitRoom.on('trackUnsubscribed', handleTrackUnsubscribed)
      livekitRoom.on('disconnected', handleDisconnected)
      
      // Connection state monitoring
      livekitRoom.on('connectionStateChanged', (state) => {
        console.log('🔌 Connection state changed:', state)
        if (state === 'connected') {
          console.log('✅ Successfully connected to LiveKit room')
        } else if (state === 'reconnecting') {
          console.log('🔄 Reconnecting to LiveKit...')
          setStatus('connecting')
        }
      })
      
      // Connection quality monitoring
      livekitRoom.on('connectionQualityChanged', (quality, participant) => {
        console.log('📊 Connection quality:', quality, 'for:', participant?.identity || 'local')
      })
      
      // Participant events
      livekitRoom.on('participantConnected', (participant) => {
        console.log('👥 Participant connected:', participant.identity)
      })
      
      livekitRoom.on('participantDisconnected', (participant) => {
        console.log('👋 Participant disconnected:', participant.identity)
      })
      
      // Data channel events
      livekitRoom.on('dataReceived', (payload, participant) => {
        console.log('📦 Data received from:', participant?.identity, payload)
      })
      
      // Error handling
      livekitRoom.on('error', (error) => {
        console.error('❌ LiveKit room error:', error)
        setError(`LiveKit error: ${error.message}. This might be due to network issues or invalid credentials.`)
      })
      
      // Media device errors
      livekitRoom.on('mediaDevicesError', (error) => {
        console.error('🎤 Media device error:', error)
        setError(`Microphone error: ${error.message}`)
      })

      console.log('🔌 Connecting to LiveKit room...')
      try {
        await livekitRoom.connect(wsUrl, token)
        console.log('✅ Connected to LiveKit room:', interview.livekit_room_name)
      } catch (connectError) {
        console.error('❌ Failed to connect to LiveKit:', connectError)
        throw new Error(
          `LiveKit connection failed: ${connectError.message}\n\n` +
          'Possible causes:\n' +
          '1. Invalid or expired LiveKit credentials\n' +
          '2. Network/firewall blocking WebRTC connections\n' +
          '3. LiveKit server is unavailable\n\n' +
          'Please check your LiveKit configuration in the .env file.'
        )
      }

      // Start microphone with better error handling
      console.log('🎤 Requesting microphone access...')
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1
          } 
        })
        console.log('✅ Microphone access granted')
      } catch (mediaError) {
        console.error('❌ Microphone error:', mediaError)
        if (mediaError.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied. Please allow microphone access and refresh the page.')
        } else if (mediaError.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and refresh the page.')
        } else if (mediaError.name === 'NotReadableError') {
          throw new Error('Microphone is already in use by another application. Please close other apps using the microphone.')
        } else {
          throw new Error(`Microphone error: ${mediaError.message}`)
        }
      }

      mediaStreamRef.current = stream
      console.log('🎵 Publishing audio track...')
      try {
        await livekitRoom.localParticipant.publishTrack(stream.getAudioTracks()[0])
        console.log('✅ Audio track published successfully')
      } catch (publishError) {
        console.error('❌ Failed to publish audio track:', publishError)
        throw new Error(`Failed to publish audio: ${publishError.message}`)
      }

      setStatus('ready')
      console.log('✅ Interview initialization complete!')
      
      // Start first question
      startQuestion(0)
    } catch (error) {
      console.error('❌ Error initializing interview:', error)
      console.error('Error stack:', error.stack)
      setError(error.message)
      
      // Cleanup on error
      if (room) {
        try {
          room.disconnect()
        } catch (e) {
          console.error('Error disconnecting room:', e)
        }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }

  const startQuestion = async (questionIndex) => {
    if (questionIndex >= totalQuestions) {
      // All questions completed
      finishInterview()
      return
    }

    setCurrentQuestion(questionIndex)
    setStatus('speaking')

    const question = questions[questionIndex]

    // Add AI question to transcript
    const aiMessage = {
      speaker: 'ai',
      message: question,
      timestamp: new Date().toISOString(),
      question_index: questionIndex
    }

    addToTranscript(aiMessage)

    // Request backend to speak the question
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://20.82.140.166:3001'
      await fetch(`${apiUrl}/api/speak-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          question,
          roomName: interview.livekit_room_name
        })
      })

      // After speaking, start listening for response
      setTimeout(() => {
        setStatus('listening')
        startListening(questionIndex)
      }, 2000)
    } catch (error) {
      console.error('Error speaking question:', error)
      setError('Error communicating with interview system')
    }
  }

  const startListening = async (questionIndex) => {
    // Listen for candidate's response
    // In a real implementation, this would use Deepgram for real-time transcription
    // For now, we'll simulate the flow
    
    // After 30 seconds or when user clicks "Next Question", process the answer
    // This is a simplified version - the actual implementation would use
    // real-time speech recognition via Deepgram
  }

  const submitAnswer = async (answer) => {
    setStatus('thinking')

    // Add candidate answer to transcript
    const candidateMessage = {
      speaker: 'candidate',
      message: answer,
      timestamp: new Date().toISOString(),
      question_index: currentQuestion
    }

    addToTranscript(candidateMessage)

    // Move to next question after a short delay
    setTimeout(() => {
      startQuestion(currentQuestion + 1)
    }, 1000)
  }

  const addToTranscript = async (message) => {
    // Add to local state
    setTranscript(prev => [...prev, message])

    // Save to database
    try {
      await supabase
        .from('interview_transcripts')
        .insert({
          interview_id: interview.id,
          speaker: message.speaker,
          message: message.message,
          question_index: message.question_index
        })
    } catch (error) {
      console.error('Error saving transcript:', error)
    }
  }

  const finishInterview = () => {
    setStatus('completed')
  }

  const handleTrackSubscribed = (track, publication, participant) => {
    if (track.kind === 'audio') {
      const audioElement = track.attach()
      document.body.appendChild(audioElement)
    }
  }

  const handleTrackUnsubscribed = (track) => {
    track.detach().forEach(element => element.remove())
  }

  const handleDisconnected = () => {
    console.log('Disconnected from room')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full card">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Connection Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This application requires a running backend server with:
              </p>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>LiveKit server configuration</li>
                <li>Deepgram API for speech recognition</li>
                <li>OpenAI API for AI responses</li>
                <li>Piper TTS for voice synthesis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Interview Completed!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing the interview. Your responses have been recorded and will be reviewed by the HR team.
          </p>
          <button
            onClick={onComplete}
            className="btn-primary w-full"
          >
            Finish & Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job?.title}</h1>
              <p className="text-sm text-gray-600">{candidate?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Question</p>
              <p className="text-2xl font-bold text-primary-600">
                {currentQuestion + 1} / {totalQuestions}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-500"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="card mb-6">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${status === 'listening' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${status === 'listening' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="font-medium">Listening</span>
            </div>
            <div className={`flex items-center space-x-2 ${status === 'thinking' ? 'text-yellow-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${status === 'thinking' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="font-medium">Thinking</span>
            </div>
            <div className={`flex items-center space-x-2 ${status === 'speaking' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${status === 'speaking' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="font-medium">Speaking</span>
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Interview Conversation</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {transcript.length === 0 ? (
              <p className="text-gray-500 italic text-center py-8">
                Connecting to interview room...
              </p>
            ) : (
              transcript.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.speaker === 'ai'
                      ? 'bg-blue-50 border border-blue-100'
                      : 'bg-green-50 border border-green-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">
                      {message.speaker === 'ai' ? '🤖 AI Interviewer' : '👤 You'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-800">{message.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Demo Controls - In production, this would be replaced with real-time audio processing */}
          {status === 'listening' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">
                <strong>Demo Mode:</strong> In production, your voice would be automatically transcribed using Deepgram. 
                For now, type your answer:
              </p>
              <textarea
                id="demo-answer"
                className="input-field mb-3"
                rows="3"
                placeholder="Type your answer here..."
              ></textarea>
              <button
                onClick={() => {
                  const answer = document.getElementById('demo-answer').value
                  if (answer.trim()) {
                    submitAnswer(answer)
                    document.getElementById('demo-answer').value = ''
                  }
                }}
                className="btn-primary w-full"
              >
                Submit Answer & Continue
              </button>
            </div>
          )}
        </div>

        {/* Emergency Exit */}
        <button
          onClick={onComplete}
          className="mt-6 w-full btn-secondary"
        >
          Exit Interview
        </button>
      </div>
    </div>
  )
}

export default InterviewRoom
