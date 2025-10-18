import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Room } from 'livekit-client'

const InterviewRoom = ({ candidate, job, interview, onComplete }) => {
  const [status, setStatus] = useState('waiting') // waiting, connecting, ready, listening, thinking, speaking, completed
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [transcript, setTranscript] = useState([])
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  const audioContextRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const [userInteracted, setUserInteracted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const audioPlayerRef = useRef(null)

  const questions = candidate.custom_questions || []
  const totalQuestions = questions.length

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (room) {
        console.log('Cleaning up LiveKit room connection')
        room.removeAllListeners()
        room.disconnect()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
      }
    }
  }, [room])

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
      setUserInteracted(true)
      console.log('✅ Interview initialization complete!')
      
      // Resume AudioContext immediately on user gesture (CRITICAL for Chrome autoplay policy)
      if (window.AudioContext || window.webkitAudioContext) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext
          const tempContext = new AudioContextClass()
          if (tempContext.state === 'suspended') {
            await tempContext.resume()
            console.log('🎼 AudioContext resumed on user gesture, state:', tempContext.state)
          } else {
            console.log('🎼 AudioContext already running, state:', tempContext.state)
          }
          tempContext.close() // Clean up
        } catch (e) {
          console.warn('⚠️ Could not resume AudioContext:', e)
        }
      }
      
      // Also resume any existing AudioContext
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume()
          console.log('▶️ Existing AudioContext resumed after user interaction')
        } catch (e) {
          console.warn('Could not resume existing AudioContext:', e)
        }
      }
      
      // Unmute any audio elements
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach(el => {
        el.muted = false
        console.log('🔊 Audio element unmuted')
      })
      
      console.log('🎯 Starting first question...')
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

    // Request backend to generate speech for the question
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://20.82.140.166:3001'
      console.log('🔊 Requesting AI voice for question:', question)
      console.log('🎯 API URL:', apiUrl)
      
      const response = await fetch(`${apiUrl}/api/speak-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          question,
          roomName: interview.livekit_room_name
        })
      })
      
      console.log('📡 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('❌ TTS request failed:', response.status)
        throw new Error(`TTS request failed: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 Response data:', {
        success: data.success,
        hasAudioUrl: !!data.audioUrl,
        audioUrlLength: data.audioUrl?.length,
        message: data.message
      })
      
      // If we have an audio URL, play it
      if (data.audioUrl) {
        console.log('🎵 Playing AI voice...')
        console.log('📝 Audio URL preview:', data.audioUrl.substring(0, 50) + '...')
        await playAudioFromUrl(data.audioUrl)
      } else {
        console.warn('⚠️ No audio URL received from backend')
        console.log('💬 Response message:', data.message)
        // Wait a moment to simulate speaking
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // After speaking, start listening for response
      console.log('🎤 Transitioning to listening mode...')
      setStatus('listening')
      startListening(questionIndex)
      
    } catch (error) {
      console.error('❌ Error in question speaking flow:', error)
      console.error('Error details:', error.message, error.stack)
      // Continue anyway with text mode
      setStatus('listening')
      startListening(questionIndex)
    }
  }
  
  const playAudioFromUrl = async (url) => {
    try {
      console.log('🎵 Attempting to play audio...')
      console.log('📊 Audio URL length:', url?.length)
      
      // Check if AudioContext needs resuming (Chrome autoplay policy)
      if (window.AudioContext || window.webkitAudioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        const audioContext = new AudioContextClass()
        if (audioContext.state === 'suspended') {
          console.log('🔓 Resuming AudioContext...')
          await audioContext.resume()
        }
        console.log('🎼 AudioContext state:', audioContext.state)
        
        // Close to free resources
        audioContext.close()
      }
      
      // Validate URL format
      if (!url || !url.startsWith('data:audio/mpeg;base64,')) {
        throw new Error('Invalid audio URL format')
      }
      
      // Method 1: Try Blob URL (best browser compatibility)
      try {
        console.log('🔄 Converting base64 to Blob...')
        const base64Data = url.split(',')[1]
        if (!base64Data) {
          throw new Error('Invalid base64 data')
        }
        
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        
        const blob = new Blob([bytes], { type: 'audio/mpeg' })
        console.log('✅ Blob created, size:', blob.size, 'bytes')
        
        const audioUrl = URL.createObjectURL(blob)
        console.log('🔗 Blob URL created:', audioUrl.substring(0, 50) + '...')
        
        // Create and configure audio element
        const audio = new Audio()
        audio.src = audioUrl
        audio.volume = 1.0
        audio.muted = false
        audio.preload = 'auto'
        
        // Store ref for cleanup
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause()
          if (audioPlayerRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioPlayerRef.current.src)
          }
        }
        audioPlayerRef.current = audio
        
        // Add comprehensive event listeners
        audio.onloadedmetadata = () => {
          console.log('📝 Audio metadata loaded, duration:', audio.duration, 'seconds')
        }
        
        audio.oncanplaythrough = () => {
          console.log('✅ Audio can play through')
        }
        
        audio.onplay = () => {
          console.log('▶️ Audio started playing')
          setStatus('speaking')
        }
        
        audio.onended = () => {
          console.log('⏹️ Audio finished playing')
          URL.revokeObjectURL(audioUrl) // Cleanup
          setStatus('listening')
        }
        
        audio.onerror = (e) => {
          console.error('❌ Audio playback error:', {
            error: audio.error,
            code: audio.error?.code,
            message: audio.error?.message,
            src: audio.src.substring(0, 50)
          })
          setStatus('listening')
        }
        
        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
          audio.addEventListener('canplay', resolve, { once: true })
          audio.addEventListener('error', reject, { once: true })
          audio.load()
          
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Audio load timeout')), 5000)
        })
        
        console.log('🎬 Attempting to play...')
        const playPromise = audio.play()
        
        if (playPromise !== undefined) {
          await playPromise
          console.log('🎉 Audio playing successfully!')
        }
        
      } catch (blobError) {
        console.error('❌ Blob method failed:', blobError)
        
        // Method 2: Fallback to direct data URL
        console.log('🔄 Trying direct data URL method...')
        const audio = new Audio(url)
        audio.volume = 1.0
        audio.muted = false
        
        audioPlayerRef.current = audio
        
        audio.onplay = () => console.log('▶️ Data URL audio playing')
        audio.onended = () => setStatus('listening')
        audio.onerror = (e) => console.error('❌ Data URL error:', e)
        
        await audio.play()
        console.log('🎉 Data URL playback started!')
      }
      
    } catch (error) {
      console.error('❌ All audio playback methods failed:', error)
      setStatus('listening')
      
      // Show user-friendly error
      alert('⚠️ Audio playback failed. Please check:\n' +
            '1. Browser permissions for audio\n' +
            '2. System volume is not muted\n' +
            '3. Try clicking "Start Interview" again')
    }
  }
  
  const stopListening = () => {
    if (recognitionRef.current) {
      console.log('⏹️ Manually stopping voice recognition')
      try {
        // Mark as stopped manually to prevent auto-restart
        recognitionRef.current.isStoppedManually = true
        recognitionRef.current.stop()
        setIsRecording(false)
      } catch (err) {
        console.error('Error stopping recognition:', err)
        setIsRecording(false)
      }
    }
  }

  const startListening = async (questionIndex) => {
    console.log('🎤 Starting voice recognition...')
    
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('⚠️ Web Speech API not supported, falling back to text input')
      return // Fall back to demo mode
    }
    
    try {
      // Create speech recognition instance
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      
      // Configure recognition
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1
      
      let finalTranscript = ''
      let interimTranscript = ''
      let isStoppedManually = false
      let restartCount = 0
      const MAX_RESTARTS = 5
      
      // Handle results
      recognition.onresult = (event) => {
        interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
            console.log('📝 Final transcript:', transcript)
          } else {
            interimTranscript += transcript
            console.log('📝 Interim transcript:', transcript)
          }
        }
        
        // Show interim results in UI (optional)
        if (interimTranscript) {
          console.log('👁️ Listening...:', interimTranscript)
        }
      }
      
      // Handle errors
      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error)
        
        if (event.error === 'no-speech') {
          console.log('🤫 No speech detected yet, will restart automatically...')
          // Don't do anything, let onend handle restart
        } else if (event.error === 'aborted') {
          console.log('⏹️ Recognition aborted')
          isStoppedManually = true
        } else if (event.error === 'audio-capture') {
          console.error('🎤 Microphone error - check if mic is working')
          isStoppedManually = true
          setIsRecording(false)
        } else if (event.error === 'not-allowed') {
          console.error('🚫 Microphone permission denied')
          isStoppedManually = true
          setIsRecording(false)
        } else {
          console.error('❌ Recognition error:', event.error)
        }
      }
      
      // Handle end
      recognition.onend = () => {
        console.log('📬 Speech recognition ended')
        
        // If stopped manually or have transcript, don't restart
        if (isStoppedManually) {
          console.log('⏹️ Stopped manually, not restarting')
          setIsRecording(false)
          
          // Submit if we have transcript
          if (finalTranscript.trim()) {
            console.log('✅ Submitting answer:', finalTranscript.trim())
            submitAnswer(finalTranscript.trim())
          }
          return
        }
        
        // If we have a complete answer, submit it
        if (finalTranscript.trim()) {
          console.log('✅ Submitting answer:', finalTranscript.trim())
          setIsRecording(false)
          submitAnswer(finalTranscript.trim())
          return
        }
        
        // Restart recognition if no speech detected and still recording
        if (isRecording && restartCount < MAX_RESTARTS) {
          restartCount++
          console.log(`🔄 Restarting recognition (attempt ${restartCount}/${MAX_RESTARTS})...`)
          setTimeout(() => {
            try {
              if (recognitionRef.current && isRecording) {
                recognitionRef.current.start()
                console.log('▶️ Recognition restarted')
              }
            } catch (err) {
              console.error('Failed to restart:', err)
            }
          }, 100)
        } else if (restartCount >= MAX_RESTARTS) {
          console.warn('⚠️ Max restart attempts reached. Showing text input.')
          setIsRecording(false)
        }
      }
      
      // Start recognition
      recognition.start()
      setIsRecording(true)
      console.log('▶️ Voice recognition started')
      
      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (recognitionRef.current) {
          console.log('⏱️ Time limit reached, stopping recognition')
          recognitionRef.current.stop()
        }
      }, 60000)
      
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error)
      setIsRecording(false)
    }
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

  const handleTrackSubscribed = async (track, publication, participant) => {
    if (track.kind === 'audio') {
      console.log('🔊 Audio track subscribed from:', participant.identity)
      
      // Create audio element
      const audioElement = track.attach()
      audioElement.id = `audio-${participant.identity}`
      
      // Create or resume AudioContext on user interaction
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
          console.log('🎵 AudioContext created')
        } catch (e) {
          console.error('Failed to create AudioContext:', e)
        }
      }
      
      // Resume AudioContext if suspended (required by Chrome autoplay policy)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        console.log('⏸️ AudioContext is suspended, will resume on user interaction')
        // Don't auto-resume - wait for user to click Start Interview
        audioElement.muted = true
      }
      
      // Set audio element properties
      audioElement.autoplay = true
      audioElement.playsInline = true
      
      // Append to body
      document.body.appendChild(audioElement)
      console.log('✅ Audio element attached')
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

  // Waiting for user to start interview
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Begin?
          </h2>
          <div className="text-left mb-6 space-y-3">
            <p className="text-gray-700">
              <strong>Interview Details:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>{totalQuestions}</strong> questions will be asked</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>Your microphone will be used for responses</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Take your time to answer each question</span>
              </li>
            </ul>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800">
              <strong>📱 Before you start:</strong>
            </p>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>• Ensure your microphone is connected</li>
              <li>• Find a quiet location</li>
              <li>• Allow microphone permissions when prompted</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setStatus('connecting')
              initializeInterview()
            }}
            className="btn-primary w-full text-lg py-3"
          >
            🎤 Start Interview
          </button>
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
              <span className="font-medium">🔊 Speaking</span>
            </div>
          </div>
          {status === 'speaking' && (
            <div className="mt-3 text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium animate-pulse">
                🎵 AI is speaking the question... Listen through your speakers!
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Make sure your laptop volume is turned up
              </p>
            </div>
          )}
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

          {/* Voice Recording Controls */}
          {status === 'listening' && (
            <div className="mt-6">
              {isRecording ? (
                <div className="p-6 bg-green-50 border-2 border-green-400 rounded-lg text-center animate-pulse-slow">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-3"></div>
                    <span className="text-lg font-semibold text-green-800">🎤 Listening...</span>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <div className="w-2 h-8 bg-green-500 rounded animate-pulse" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-12 bg-green-500 rounded animate-pulse" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-6 bg-green-500 rounded animate-pulse" style={{animationDelay: '300ms'}}></div>
                      <div className="w-2 h-10 bg-green-500 rounded animate-pulse" style={{animationDelay: '450ms'}}></div>
                      <div className="w-2 h-8 bg-green-500 rounded animate-pulse" style={{animationDelay: '600ms'}}></div>
                    </div>
                    <p className="text-sm text-green-700 font-medium mb-2">
                      🗣️ Start speaking now!
                    </p>
                    <p className="text-xs text-green-600 mb-3">
                      Speak naturally and clearly. Your voice is being transcribed in real-time.
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      💡 Tip: If no speech is detected, recognition will automatically restart
                    </p>
                  </div>
                  <button
                    onClick={stopListening}
                    className="btn-secondary w-full"
                  >
                    ⏹️ Stop & Submit Answer
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="text-lg font-semibold text-blue-800">Ready to answer?</span>
                  </div>
                  <p className="text-sm text-blue-700 text-center mb-4">
                    Voice recognition is ready. Click below or type your answer.
                  </p>
                  
                  {/* Fallback text input for browsers without speech recognition */}
                  <div className="bg-white p-4 rounded-lg border border-blue-200 mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or type your answer:
                    </label>
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
                      Submit Written Answer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audio Test Button (for debugging) */}
        <div className="mt-6 card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🔧 Audio System Test</h3>
          <p className="text-xs text-gray-600 mb-3">
            Click below to test if your browser can play audio through speakers:
          </p>
          <button
            onClick={async () => {
              try {
                console.log('🔍 === AUDIO DIAGNOSTIC TEST ===')
                
                // Test 1: AudioContext
                if (window.AudioContext || window.webkitAudioContext) {
                  const AudioContextClass = window.AudioContext || window.webkitAudioContext
                  const testContext = new AudioContextClass()
                  console.log('✅ AudioContext supported, state:', testContext.state)
                  
                  if (testContext.state === 'suspended') {
                    await testContext.resume()
                    console.log('🔓 AudioContext resumed, new state:', testContext.state)
                  }
                  
                  // Play a test beep
                  const oscillator = testContext.createOscillator()
                  const gainNode = testContext.createGain()
                  oscillator.connect(gainNode)
                  gainNode.connect(testContext.destination)
                  
                  gainNode.gain.value = 0.3 // 30% volume
                  oscillator.frequency.value = 440 // A4 note
                  oscillator.start()
                  setTimeout(() => {
                    oscillator.stop()
                    testContext.close()
                  }, 200)
                  
                  console.log('🔔 Test beep sent (440Hz for 200ms)')
                  alert('✅ Test beep sent!\n\nDid you hear a short beep?\n\n' +
                        '✓ YES: Your audio system works!\n' +
                        '✗ NO: Check system volume/speakers')
                } else {
                  console.error('❌ AudioContext not supported')
                  alert('❌ AudioContext not supported in this browser')
                }
                
                // Test 2: HTML5 Audio Element
                console.log('🎵 Testing HTML5 Audio element...')
                const testAudio = new Audio()
                console.log('   play() method exists:', typeof testAudio.play === 'function')
                console.log('   volume settable:', testAudio.volume === 1.0)
                console.log('   not muted:', !testAudio.muted)
                
                console.log('🔍 === DIAGNOSTIC TEST COMPLETE ===')
                
              } catch (error) {
                console.error('❌ Diagnostic test failed:', error)
                alert('❌ Test failed: ' + error.message)
              }
            }}
            className="btn-secondary w-full text-sm"
          >
            🔍 Test Audio System
          </button>
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
