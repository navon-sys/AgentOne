import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import QuestionBankManager from './QuestionBankManager'

const CandidateManagement = ({ user, selectedJob, onSelectCandidate, onBack }) => {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    customQuestions: []
  })

  useEffect(() => {
    if (selectedJob) {
      loadCandidates()
    }
  }, [selectedJob])

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*, interviews(*)')
        .eq('job_id', selectedJob.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCandidates(data || [])
    } catch (error) {
      console.error('Error loading candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAccessToken = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingCandidate) {
        // Update existing candidate
        const { error } = await supabase
          .from('candidates')
          .update({
            name: formData.name,
            email: formData.email,
            custom_questions: formData.customQuestions.length > 0 
              ? formData.customQuestions 
              : selectedJob.default_questions || []
          })
          .eq('id', editingCandidate.id)

        if (error) throw error
        alert('Candidate updated successfully!')
      } else {
        // Create new candidate
        const accessToken = generateAccessToken()
        const interviewLink = `${window.location.origin}/interview?token=${accessToken}`

        const { data, error } = await supabase
          .from('candidates')
          .insert({
            name: formData.name,
            email: formData.email,
            job_id: selectedJob.id,
            access_token: accessToken,
            interview_link: interviewLink,
            custom_questions: formData.customQuestions.length > 0 
              ? formData.customQuestions 
              : selectedJob.default_questions || [],
            status: 'created'
          })
          .select()

        if (error) throw error

        alert(`Candidate added successfully!\n\nInterview Link:\n${interviewLink}\n\nSend this link to the candidate to start the interview.`)
      }
      
      setFormData({ name: '', email: '', customQuestions: [] })
      setShowForm(false)
      setEditingCandidate(null)
      loadCandidates()
    } catch (error) {
      console.error('Error saving candidate:', error)
      alert('Error saving candidate: ' + error.message)
    }
  }

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate)
    setFormData({
      name: candidate.name,
      email: candidate.email,
      customQuestions: candidate.custom_questions || []
    })
    setShowForm(true)
  }

  const handleDelete = async (candidateId, candidateName) => {
    if (!window.confirm(`Are you sure you want to delete ${candidateName}? This will also delete all interview data.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId)

      if (error) throw error
      
      alert('Candidate deleted successfully!')
      loadCandidates()
    } catch (error) {
      console.error('Error deleting candidate:', error)
      alert('Error deleting candidate: ' + error.message)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingCandidate(null)
    setFormData({ name: '', email: '', customQuestions: [] })
  }

  const copyInterviewLink = (link) => {
    navigator.clipboard.writeText(link)
    alert('Interview link copied to clipboard!')
  }

  const updateStatus = async (candidateId, newStatus) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', candidateId)

      if (error) throw error
      loadCandidates()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      created: { class: 'bg-gray-100 text-gray-800', label: 'Created' },
      link_sent: { class: 'bg-blue-100 text-blue-800', label: 'Link Sent' },
      in_progress: { class: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { class: 'bg-green-100 text-green-800', label: 'Completed' },
      reviewed: { class: 'bg-purple-100 text-purple-800', label: 'Reviewed' }
    }

    const config = statusConfig[status] || statusConfig.created
    return <span className={`status-badge ${config.class}`}>{config.label}</span>
  }

  if (!selectedJob) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please select a job first</p>
        <button onClick={onBack} className="mt-4 btn-primary">
          Go to Jobs
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
          Back to Jobs
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{selectedJob.title}</h1>
            <p className="mt-2 text-gray-600">Manage candidates for this position</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Candidate
            </span>
          </button>
        </div>
      </div>

      {/* Candidate Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Interview Questions (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Leave empty to use the default questions for this job: {selectedJob.default_questions?.length || 0} questions
              </p>
              
              {formData.customQuestions.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Using {selectedJob.default_questions?.length || 0} default questions from job
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, customQuestions: selectedJob.default_questions || [''] })}
                    className="mt-3 btn-secondary text-sm"
                  >
                    Customize Questions for This Candidate
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <QuestionBankManager
                    questions={formData.customQuestions}
                    onChange={(questions) => setFormData({ ...formData, customQuestions: questions })}
                    maxQuestions={20}
                    title={`Custom Questions for ${formData.name || 'Candidate'}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset to default questions?')) {
                        setFormData({ ...formData, customQuestions: [] })
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Reset to Default Questions
                  </button>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="submit" className="btn-primary">
                {editingCandidate ? 'Update Candidate' : 'Create Candidate & Generate Link'}
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Candidates List */}
      <div className="space-y-4">
        {candidates.length === 0 ? (
          <div className="text-center py-12 card">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates yet</h3>
            <p className="mt-1 text-sm text-gray-500">Add a candidate to get started.</p>
          </div>
        ) : (
          candidates.map((candidate) => (
            <div key={candidate.id} className="card hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
                    {getStatusBadge(candidate.status)}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{candidate.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {candidate.custom_questions?.length || 0} interview questions
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Created {new Date(candidate.created_at).toLocaleDateString()}
                </div>
              </div>

              {candidate.interview_link && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">Interview Link:</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs text-blue-600 flex-1 truncate">
                      {candidate.interview_link}
                    </code>
                    <button
                      onClick={() => copyInterviewLink(candidate.interview_link)}
                      className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                      title="Copy link"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {candidate.status === 'completed' && (
                  <button
                    onClick={() => onSelectCandidate(candidate)}
                    className="btn-primary text-sm"
                  >
                    View Interview Results
                  </button>
                )}
                {candidate.status === 'created' && (
                  <button
                    onClick={() => updateStatus(candidate.id, 'link_sent')}
                    className="btn-secondary text-sm"
                  >
                    Mark as Link Sent
                  </button>
                )}
                <button
                  onClick={() => handleEdit(candidate)}
                  className="text-sm border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-2 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(candidate.id, candidate.name)}
                  className="text-sm border border-red-300 text-red-600 hover:bg-red-50 rounded-lg px-3 py-2 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <select
                  value={candidate.status}
                  onChange={(e) => updateStatus(candidate.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="created">Created</option>
                  <option value="link_sent">Link Sent</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CandidateManagement
