import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const JobManagement = ({ user, onSelectJob }) => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    defaultQuestions: ['']
  })

  useEffect(() => {
    loadJobs()
  }, [user])

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          candidates(count)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const questions = formData.defaultQuestions.filter(q => q.trim() !== '')
    
    try {
      if (editingJob) {
        const { error } = await supabase
          .from('jobs')
          .update({
            title: formData.title,
            description: formData.description,
            default_questions: questions
          })
          .eq('id', editingJob.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('jobs')
          .insert({
            title: formData.title,
            description: formData.description,
            default_questions: questions,
            created_by: user.id
          })

        if (error) throw error
      }

      setFormData({ title: '', description: '', defaultQuestions: [''] })
      setShowForm(false)
      setEditingJob(null)
      loadJobs()
    } catch (error) {
      console.error('Error saving job:', error)
      alert('Error saving job: ' + error.message)
    }
  }

  const handleEdit = (job) => {
    setEditingJob(job)
    setFormData({
      title: job.title,
      description: job.description || '',
      defaultQuestions: job.default_questions?.length > 0 ? job.default_questions : ['']
    })
    setShowForm(true)
  }

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job? All associated candidates will also be deleted.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error
      loadJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Error deleting job: ' + error.message)
    }
  }

  const addQuestion = () => {
    setFormData({
      ...formData,
      defaultQuestions: [...formData.defaultQuestions, '']
    })
  }

  const removeQuestion = (index) => {
    const questions = [...formData.defaultQuestions]
    questions.splice(index, 1)
    setFormData({ ...formData, defaultQuestions: questions })
  }

  const updateQuestion = (index, value) => {
    const questions = [...formData.defaultQuestions]
    questions[index] = value
    setFormData({ ...formData, defaultQuestions: questions })
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
          <p className="mt-2 text-gray-600">Create and manage job positions</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingJob(null)
            setFormData({ title: '', description: '', defaultQuestions: [''] })
          }}
          className="btn-primary"
        >
          <span className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Job
          </span>
        </button>
      </div>

      {/* Job Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingJob ? 'Edit Job' : 'Create New Job'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="e.g., Junior Software Developer"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="4"
                placeholder="Describe the job role, responsibilities, and requirements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Interview Questions
              </label>
              <p className="text-sm text-gray-500 mb-3">
                These questions will be used for all candidates unless customized individually.
              </p>
              <div className="space-y-3">
                {formData.defaultQuestions.map((question, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="mt-2 text-sm font-medium text-gray-500 w-8">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Enter interview question..."
                    />
                    {formData.defaultQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="mt-2 text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formData.defaultQuestions.length < 10 && (
                <button
                  type="button"
                  onClick={addQuestion}
                  className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="submit" className="btn-primary">
                {editingJob ? 'Update Job' : 'Create Job'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingJob(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.length === 0 ? (
          <div className="col-span-2 text-center py-12 card">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new job position.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="card hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {job.description || 'No description'}
                  </p>
                </div>
                <span className="status-badge bg-green-100 text-green-800">
                  Active
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {job.default_questions?.length || 0} default questions
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {job.candidates?.[0]?.count || 0} candidates
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => onSelectJob(job)}
                  className="flex-1 btn-primary text-sm"
                >
                  Manage Candidates
                </button>
                <button
                  onClick={() => handleEdit(job)}
                  className="btn-secondary text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="text-red-600 hover:text-red-700 px-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default JobManagement
