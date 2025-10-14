import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const InterviewReview = ({ candidate, onBack }) => {
  const [interview, setInterview] = useState(null)
  const [transcripts, setTranscripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [hrNotes, setHrNotes] = useState(candidate?.hr_notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (candidate) {
      loadInterviewData()
    }
  }, [candidate])

  const loadInterviewData = async () => {
    try {
      // Get interview
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .eq('candidate_id', candidate.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (interviewError && interviewError.code !== 'PGRST116') throw interviewError

      if (interviewData) {
        setInterview(interviewData)

        // Get transcripts
        const { data: transcriptData, error: transcriptError } = await supabase
          .from('interview_transcripts')
          .select('*')
          .eq('interview_id', interviewData.id)
          .order('created_at', { ascending: true })

        if (transcriptError) throw transcriptError
        setTranscripts(transcriptData || [])
      }
    } catch (error) {
      console.error('Error loading interview data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveHRNotes = async () => {
    setSavingNotes(true)
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ hr_notes: hrNotes })
        .eq('id', candidate.id)

      if (error) throw error
      alert('Notes saved successfully!')
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Error saving notes: ' + error.message)
    } finally {
      setSavingNotes(false)
    }
  }

  const generateAISummary = async () => {
    if (!interview || transcripts.length === 0) {
      alert('No interview data available to analyze')
      return
    }

    setGenerating(true)
    try {
      // Call backend API to generate summary using OpenAI
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: candidate.name,
          jobTitle: candidate.jobs?.title,
          transcripts: transcripts.map(t => ({
            speaker: t.speaker,
            message: t.message
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to generate summary')

      const { summary, score } = await response.json()

      // Update interview with AI analysis
      const { error } = await supabase
        .from('interviews')
        .update({
          ai_summary: summary,
          ai_score: score
        })
        .eq('id', interview.id)

      if (error) throw error

      // Reload interview data
      loadInterviewData()
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('Error generating AI summary. Make sure the backend server is running.')
    } finally {
      setGenerating(false)
    }
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please select a candidate first</p>
        <button onClick={onBack} className="mt-4 btn-primary">
          Go Back
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center text-primary-600 hover:text-primary-700"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Candidates
        </button>
        <div className="card text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No interview data</h3>
          <p className="mt-1 text-sm text-gray-500">This candidate hasn't completed the interview yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Candidates
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Interview Review</h1>
        <p className="mt-2 text-gray-600">{candidate.name} - {candidate.jobs?.title}</p>
      </div>

      {/* Interview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Interview Status</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 capitalize">{interview.status}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Started At</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {interview.started_at ? new Date(interview.started_at).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Completed At</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {interview.completed_at ? new Date(interview.completed_at).toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* AI Summary & Score */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">AI Analysis</h2>
          <button
            onClick={generateAISummary}
            disabled={generating}
            className="btn-primary text-sm"
          >
            {generating ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              <>
                {interview.ai_summary ? 'Regenerate' : 'Generate'} AI Summary
              </>
            )}
          </button>
        </div>

        {interview.ai_summary ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{interview.ai_summary}</p>
            </div>
            {interview.ai_score && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Candidate Score</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        interview.ai_score >= 8 ? 'bg-green-500' :
                        interview.ai_score >= 6 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${interview.ai_score * 10}%` }}
                    ></div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {interview.ai_score}/10
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            No AI analysis available yet. Click "Generate AI Summary" to analyze the interview.
          </p>
        )}
      </div>

      {/* HR Notes */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">HR Notes</h2>
        <textarea
          value={hrNotes}
          onChange={(e) => setHrNotes(e.target.value)}
          className="input-field"
          rows="6"
          placeholder="Add your private notes about this candidate..."
        />
        <button
          onClick={saveHRNotes}
          disabled={savingNotes}
          className="mt-4 btn-primary"
        >
          {savingNotes ? 'Saving...' : 'Save Notes'}
        </button>
      </div>

      {/* Interview Transcript */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Full Interview Transcript
        </h2>
        {transcripts.length === 0 ? (
          <p className="text-gray-500 italic">No transcript available</p>
        ) : (
          <div className="space-y-4">
            {transcripts.map((transcript, index) => (
              <div
                key={transcript.id}
                className={`p-4 rounded-lg ${
                  transcript.speaker === 'ai'
                    ? 'bg-blue-50 border border-blue-100'
                    : 'bg-green-50 border border-green-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">
                    {transcript.speaker === 'ai' ? '🤖 AI Interviewer' : '👤 ' + candidate.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(transcript.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800">{transcript.message}</p>
                {transcript.question_index !== null && (
                  <span className="inline-block mt-2 text-xs text-gray-500">
                    Question {transcript.question_index + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InterviewReview
