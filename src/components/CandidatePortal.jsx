import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import InterviewRoom from './InterviewRoom'

const CandidatePortal = ({ token }) => {
  const [candidate, setCandidate] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [interview, setInterview] = useState(null)

  useEffect(() => {
    loadCandidateData()
  }, [token])

  const loadCandidateData = async () => {
    try {
      // Fetch candidate by access token
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*, jobs(*)')
        .eq('access_token', token)
        .single()

      if (candidateError) throw candidateError

      if (!candidateData) {
        throw new Error('Invalid interview link')
      }

      setCandidate(candidateData)
      setJob(candidateData.jobs)

      // Check if interview already exists
      const { data: existingInterview } = await supabase
        .from('interviews')
        .select('*')
        .eq('candidate_id', candidateData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingInterview) {
        setInterview(existingInterview)
        if (existingInterview.status === 'in_progress') {
          setInterviewStarted(true)
        }
      }
    } catch (error) {
      console.error('Error loading candidate data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const startInterview = async () => {
    try {
      // Create or update interview record
      let interviewData
      
      if (interview) {
        // Update existing interview
        const { data, error } = await supabase
          .from('interviews')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
            livekit_room_name: `interview-${candidate.id}`
          })
          .eq('id', interview.id)
          .select()
          .single()

        if (error) throw error
        interviewData = data
      } else {
        // Create new interview
        const { data, error } = await supabase
          .from('interviews')
          .insert({
            candidate_id: candidate.id,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            livekit_room_name: `interview-${candidate.id}`
          })
          .select()
          .single()

        if (error) throw error
        interviewData = data
      }

      // Update candidate status
      await supabase
        .from('candidates')
        .update({ status: 'in_progress' })
        .eq('id', candidate.id)

      setInterview(interviewData)
      setInterviewStarted(true)
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Error starting interview: ' + error.message)
    }
  }

  const completeInterview = async () => {
    try {
      // Update interview status
      await supabase
        .from('interviews')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', interview.id)

      // Update candidate status
      await supabase
        .from('candidates')
        .update({ status: 'completed' })
        .eq('id', candidate.id)

      setInterviewStarted(false)
      alert('Interview completed successfully! You can now close this window.')
    } catch (error) {
      console.error('Error completing interview:', error)
      alert('Error completing interview: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading interview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full card">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Invalid Interview Link</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <p className="mt-4 text-sm text-gray-500">
              Please contact HR for a valid interview link.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (interviewStarted && interview) {
    return (
      <InterviewRoom
        candidate={candidate}
        job={job}
        interview={interview}
        onComplete={completeInterview}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI Interview</h1>
          <p className="mt-2 text-gray-600">{job?.title}</p>
        </div>

        {/* Welcome Card */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {candidate?.name}!
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              You've been invited to complete an AI-powered interview for the position of <strong>{job?.title}</strong>.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Interview Details:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span><strong>{candidate?.custom_questions?.length || 0} questions</strong> to answer</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Estimated time: <strong>15-20 minutes</strong></span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Voice-based interview with <strong>AI agent</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="card mb-6">
          <h3 className="font-bold text-gray-900 mb-3">🎯 Before You Begin:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>Find a quiet place with minimal background noise</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>Make sure your microphone is working properly</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>Speak clearly and at a natural pace</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>The AI will ask you questions one by one and listen to your responses</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>Take your time to think before answering</span>
            </li>
          </ul>
        </div>

        {/* Start Button */}
        <button
          onClick={startInterview}
          className="w-full btn-primary py-4 text-lg"
        >
          <span className="flex items-center justify-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Interview
          </span>
        </button>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Your interview will be recorded and reviewed by the HR team.
        </p>
      </div>
    </div>
  )
}

export default CandidatePortal
