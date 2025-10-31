import React, { useState } from 'react'

/**
 * QuestionBankManager - Advanced question editing component
 * Can be used within JobManagement or CandidateManagement
 */
const QuestionBankManager = ({ questions, onChange, maxQuestions = 20, title = "Interview Questions" }) => {
  const [expandedQuestions, setExpandedQuestions] = useState(new Set([0]))
  const [draggedIndex, setDraggedIndex] = useState(null)

  const addQuestion = () => {
    if (questions.length >= maxQuestions) {
      alert(`Maximum ${maxQuestions} questions allowed`)
      return
    }
    onChange([...questions, ''])
    // Expand the newly added question
    setExpandedQuestions(new Set([...expandedQuestions, questions.length]))
  }

  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      alert('At least one question is required')
      return
    }
    const newQuestions = questions.filter((_, i) => i !== index)
    onChange(newQuestions)
    // Update expanded state
    const newExpanded = new Set(
      Array.from(expandedQuestions)
        .filter(i => i !== index)
        .map(i => i > index ? i - 1 : i)
    )
    setExpandedQuestions(newExpanded)
  }

  const updateQuestion = (index, value) => {
    const newQuestions = [...questions]
    newQuestions[index] = value
    onChange(newQuestions)
  }

  const duplicateQuestion = (index) => {
    if (questions.length >= maxQuestions) {
      alert(`Maximum ${maxQuestions} questions allowed`)
      return
    }
    const newQuestions = [...questions]
    newQuestions.splice(index + 1, 0, questions[index])
    onChange(newQuestions)
  }

  const moveQuestion = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= questions.length) return
    const newQuestions = [...questions]
    const [movedQuestion] = newQuestions.splice(fromIndex, 1)
    newQuestions.splice(toIndex, 0, movedQuestion)
    onChange(newQuestions)
  }

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedQuestions(newExpanded)
  }

  const expandAll = () => {
    setExpandedQuestions(new Set(questions.map((_, i) => i)))
  }

  const collapseAll = () => {
    setExpandedQuestions(new Set())
  }

  const importQuestions = () => {
    const text = prompt('Paste questions (one per line):')
    if (!text) return
    
    const newQuestions = text
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .slice(0, maxQuestions)
    
    if (newQuestions.length > 0) {
      onChange(newQuestions)
      alert(`Imported ${newQuestions.length} questions`)
    }
  }

  const exportQuestions = () => {
    const text = questions
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n')
    
    navigator.clipboard.writeText(text)
    alert('Questions copied to clipboard!')
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    // Visual feedback
    e.currentTarget.style.borderTop = '2px solid #3b82f6'
  }

  const handleDragLeave = (e) => {
    e.currentTarget.style.borderTop = ''
  }

  const handleDrop = (e, index) => {
    e.preventDefault()
    e.currentTarget.style.borderTop = ''
    
    if (draggedIndex !== null && draggedIndex !== index) {
      moveQuestion(draggedIndex, index)
      setDraggedIndex(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {title}
          </label>
          <p className="text-xs text-gray-500 mt-1">
            {questions.length} of {maxQuestions} questions • Drag to reorder
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Expand All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Collapse All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={importQuestions}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Import
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={exportQuestions}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Export
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {questions.map((question, index) => {
          const isExpanded = expandedQuestions.has(index)
          const isEmpty = !question || question.trim() === ''
          
          return (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`border rounded-lg transition-all ${
                isEmpty ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {/* Question Header */}
              <div
                className="flex items-center p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {/* Drag Handle */}
                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  
                  {/* Question Number */}
                  <span className="font-medium text-gray-700 w-8">{index + 1}.</span>
                  
                  {/* Question Preview */}
                  <div className="flex-1 min-w-0">
                    {isExpanded ? (
                      <span className="text-sm text-gray-500">Click to collapse</span>
                    ) : (
                      <span className={`text-sm truncate block ${isEmpty ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {question || '(Empty question - click to edit)'}
                      </span>
                    )}
                  </div>
                  
                  {/* Expand Icon */}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Question Editor (Expanded) */}
              {isExpanded && (
                <div className="p-3 pt-0 space-y-3 border-t border-gray-100">
                  <textarea
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows="3"
                    placeholder="Enter your interview question here..."
                  />
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveQuestion(index, index - 1)
                        }}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      
                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveQuestion(index, index + 1)
                        }}
                        disabled={index === questions.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateQuestion(index)
                        }}
                        className="p-1 text-blue-500 hover:text-blue-700"
                        title="Duplicate question"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Character Count */}
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">
                        {question.length} characters
                      </span>
                      
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm('Delete this question?')) {
                            removeQuestion(index)
                          }
                        }}
                        disabled={questions.length <= 1}
                        className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete question"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Question Button */}
      {questions.length < maxQuestions && (
        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Question ({questions.length}/{maxQuestions})</span>
        </button>
      )}

      {/* Empty State Warning */}
      {questions.filter(q => !q || q.trim() === '').length > 0 && (
        <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              {questions.filter(q => !q || q.trim() === '').length} empty question(s)
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Please fill in all questions before saving
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionBankManager
