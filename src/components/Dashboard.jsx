import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const Dashboard = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeCandidates: 0,
    completedInterviews: 0,
    inProgressInterviews: 0
  })
  const [activeInterviews, setActiveInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    // Set up real-time subscription for active interviews
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'candidates' },
        () => loadDashboardData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'interviews' },
        () => loadDashboardData()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Get total jobs
      const { count: jobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'active')

      // Get candidates
      const { data: candidates } = await supabase
        .from('candidates')
        .select('*, jobs!inner(*)')
        .eq('jobs.created_by', user.id)

      // Get interviews
      const { data: interviews } = await supabase
        .from('interviews')
        .select('*, candidates!inner(*, jobs!inner(*))')
        .eq('candidates.jobs.created_by', user.id)

      const activeCandidates = candidates?.filter(c => 
        ['created', 'link_sent', 'in_progress'].includes(c.status)
      ).length || 0

      const completedInterviews = interviews?.filter(i => 
        i.status === 'completed'
      ).length || 0

      const inProgress = interviews?.filter(i => 
        i.status === 'in_progress'
      ) || []

      setStats({
        totalJobs: jobCount || 0,
        activeCandidates,
        completedInterviews,
        inProgressInterviews: inProgress.length
      })

      setActiveInterviews(inProgress)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your interview platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Job Posts"
          value={stats.totalJobs}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          }
          color="blue"
        />
        <StatCard
          title="Awaiting Interview"
          value={stats.activeCandidates}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          }
          color="yellow"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressInterviews}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          }
          color="green"
          pulse={stats.inProgressInterviews > 0}
        />
        <StatCard
          title="Completed"
          value={stats.completedInterviews}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          }
          color="purple"
        />
      </div>

      {/* Active Interviews */}
      {activeInterviews.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Interviews
          </h2>
          <div className="space-y-3">
            {activeInterviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {interview.candidates?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {interview.candidates?.jobs?.title}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="status-badge bg-green-100 text-green-800">
                    In Progress
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {interview.started_at && new Date(interview.started_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          title="Create Job Post"
          description="Set up a new job position and define interview questions"
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          }
          onClick={() => onNavigate('jobs')}
          color="blue"
        />
        <ActionCard
          title="Manage Candidates"
          description="Add candidates and send interview invitations"
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          }
          onClick={() => onNavigate('jobs')}
          color="green"
        />
      </div>
    </div>
  )
}

const StatCard = ({ title, value, icon, color, pulse }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className={`card ${pulse ? 'ring-2 ring-green-500 ring-opacity-50 animate-pulse-slow' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
      </div>
    </div>
  )
}

const ActionCard = ({ title, description, icon, onClick, color }) => {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700'
  }

  return (
    <button
      onClick={onClick}
      className="card text-left hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${colors[color]} text-white group-hover:scale-110 transition-transform`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

export default Dashboard
