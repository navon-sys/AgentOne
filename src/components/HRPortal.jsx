import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Dashboard from './Dashboard'
import JobManagement from './JobManagement'
import CandidateManagement from './CandidateManagement'
import InterviewReview from './InterviewReview'

const HRPortal = ({ user }) => {
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard user={user} onNavigate={setActiveView} />
      case 'jobs':
        return (
          <JobManagement
            user={user}
            onSelectJob={(job) => {
              setSelectedJob(job)
              setActiveView('candidates')
            }}
          />
        )
      case 'candidates':
        return (
          <CandidateManagement
            user={user}
            selectedJob={selectedJob}
            onSelectCandidate={(candidate) => {
              setSelectedCandidate(candidate)
              setActiveView('review')
            }}
            onBack={() => setActiveView('jobs')}
          />
        )
      case 'review':
        return (
          <InterviewReview
            candidate={selectedCandidate}
            onBack={() => setActiveView('candidates')}
          />
        )
      default:
        return <Dashboard user={user} onNavigate={setActiveView} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">AI Interview Platform</span>
              </div>

              <div className="hidden md:flex space-x-1">
                <NavButton
                  active={activeView === 'dashboard'}
                  onClick={() => setActiveView('dashboard')}
                  icon={
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  }
                >
                  Dashboard
                </NavButton>
                <NavButton
                  active={activeView === 'jobs' || activeView === 'candidates'}
                  onClick={() => setActiveView('jobs')}
                  icon={
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  }
                >
                  Jobs & Candidates
                </NavButton>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">HR Manager</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  )
}

const NavButton = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
      active
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icon}
    </svg>
    <span>{children}</span>
  </button>
)

export default HRPortal
