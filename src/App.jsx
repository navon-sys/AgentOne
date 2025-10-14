import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import HRPortal from './components/HRPortal'
import CandidatePortal from './components/CandidatePortal'
import LoginPage from './components/LoginPage'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [candidateToken, setCandidateToken] = useState(null)

  useEffect(() => {
    // Check for candidate access token in URL
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token) {
      setCandidateToken(token)
      setLoading(false)
      return
    }

    // Check for authenticated HR user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // If candidate token exists, show candidate portal
  if (candidateToken) {
    return <CandidatePortal token={candidateToken} />
  }

  // If no user, show login page
  if (!user) {
    return <LoginPage />
  }

  // Show HR portal for authenticated users
  return <HRPortal user={user} />
}

export default App
