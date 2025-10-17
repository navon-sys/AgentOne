#!/usr/bin/env node

/**
 * LiveKit Connection Test Script
 * Tests LiveKit credentials and connection
 */

import dotenv from 'dotenv'
import { AccessToken } from 'livekit-server-sdk'
import https from 'https'
import { URL } from 'url'

dotenv.config()

console.log('\n🔍 LiveKit Connection Test\n')
console.log('=' .repeat(50))

// Check environment variables
console.log('\n📋 Environment Variables Check:')
console.log('=' .repeat(50))

const livekitUrl = process.env.VITE_LIVEKIT_URL
const apiKey = process.env.LIVEKIT_API_KEY
const apiSecret = process.env.LIVEKIT_API_SECRET

console.log(`VITE_LIVEKIT_URL: ${livekitUrl ? '✅ Set' : '❌ Missing'}`)
if (livekitUrl) {
  console.log(`  Value: ${livekitUrl}`)
  console.log(`  Protocol: ${livekitUrl.startsWith('wss://') ? '✅ WSS (secure)' : '⚠️  Not WSS'}`)
}

console.log(`\nLIVEKIT_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`)
if (apiKey) {
  console.log(`  Length: ${apiKey.length} characters`)
  console.log(`  Preview: ${apiKey.substring(0, 10)}...`)
  if (apiKey.length < 20) {
    console.log(`  ⚠️  WARNING: API key seems too short (${apiKey.length} chars)`)
    console.log(`     LiveKit API keys are typically 40-50+ characters`)
    console.log(`     Your key might be truncated or invalid`)
  } else {
    console.log(`  ✅ Length looks correct`)
  }
}

console.log(`\nLIVEKIT_API_SECRET: ${apiSecret ? '✅ Set' : '❌ Missing'}`)
if (apiSecret) {
  console.log(`  Length: ${apiSecret.length} characters`)
  console.log(`  Preview: ${apiSecret.substring(0, 10)}...`)
  if (apiSecret.length < 30) {
    console.log(`  ⚠️  WARNING: API secret seems too short (${apiSecret.length} chars)`)
  } else {
    console.log(`  ✅ Length looks correct`)
  }
}

// Test token generation
console.log('\n🔑 Token Generation Test:')
console.log('=' .repeat(50))

if (!apiKey || !apiSecret) {
  console.log('❌ Cannot test token generation - credentials missing')
  process.exit(1)
}

try {
  const testRoomName = 'test-room-' + Date.now()
  const testParticipant = 'test-user'
  
  console.log(`Room: ${testRoomName}`)
  console.log(`Participant: ${testParticipant}`)
  
  const at = new AccessToken(apiKey, apiSecret, {
    identity: testParticipant,
    name: testParticipant,
  })
  
  at.addGrant({
    roomJoin: true,
    room: testRoomName,
    canPublish: true,
    canSubscribe: true,
  })
  
  const token = await at.toJwt()
  console.log(`\n✅ Token generated successfully!`)
  console.log(`Token length: ${token.length} characters`)
  console.log(`Token preview: ${token.substring(0, 50)}...`)
  
  // Decode token to check expiration
  const parts = token.split('.')
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      const exp = payload.exp
      const now = Math.floor(Date.now() / 1000)
      const ttl = exp - now
      
      console.log(`\nToken details:`)
      console.log(`  Expires in: ${ttl} seconds (${Math.floor(ttl / 60)} minutes)`)
      console.log(`  Issued at: ${new Date(payload.iat * 1000).toISOString()}`)
      console.log(`  Expires at: ${new Date(exp * 1000).toISOString()}`)
      console.log(`  Room: ${payload.video?.room || 'N/A'}`)
      console.log(`  Identity: ${payload.sub || 'N/A'}`)
    } catch (e) {
      console.log('⚠️  Could not decode token payload')
    }
  }
  
} catch (error) {
  console.log(`❌ Token generation failed: ${error.message}`)
  console.error('Error details:', error)
  process.exit(1)
}

// Test WebSocket URL
console.log('\n🌐 WebSocket URL Test:')
console.log('=' .repeat(50))

if (!livekitUrl) {
  console.log('❌ Cannot test - VITE_LIVEKIT_URL missing')
  process.exit(1)
}

try {
  // Extract hostname from WebSocket URL
  const wsUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://')
  const url = new URL(wsUrl)
  
  console.log(`Testing connection to: ${url.hostname}`)
  console.log(`Protocol: ${url.protocol}`)
  console.log(`Port: ${url.port || (url.protocol === 'https:' ? '443' : '80')}`)
  
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: '/',
    method: 'GET',
    timeout: 5000,
  }
  
  const req = https.request(options, (res) => {
    console.log(`\n✅ Server responded!`)
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`)
    console.log(`Headers:`, Object.keys(res.headers).join(', '))
    
    if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
      console.log(`✅ Server is reachable`)
    } else {
      console.log(`⚠️  Unexpected status code: ${res.statusCode}`)
    }
  })
  
  req.on('error', (error) => {
    console.log(`❌ Connection failed: ${error.message}`)
    if (error.code === 'ENOTFOUND') {
      console.log('   The server hostname could not be found')
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   Connection timed out')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   Connection refused by server')
    }
  })
  
  req.on('timeout', () => {
    console.log('❌ Connection timed out after 5 seconds')
    req.destroy()
  })
  
  req.end()
  
} catch (error) {
  console.log(`❌ URL test failed: ${error.message}`)
}

// Summary
console.log('\n' + '=' .repeat(50))
console.log('📊 Test Summary:')
console.log('=' .repeat(50))

const issues = []

if (!livekitUrl) issues.push('VITE_LIVEKIT_URL is missing')
if (!livekitUrl?.startsWith('wss://')) issues.push('VITE_LIVEKIT_URL should use wss:// protocol')
if (!apiKey) issues.push('LIVEKIT_API_KEY is missing')
if (apiKey && apiKey.length < 20) issues.push('LIVEKIT_API_KEY appears to be truncated or invalid')
if (!apiSecret) issues.push('LIVEKIT_API_SECRET is missing')

if (issues.length === 0) {
  console.log('✅ All checks passed!')
  console.log('\nYour LiveKit configuration appears to be correct.')
  console.log('If you\'re still experiencing errors, check:')
  console.log('  1. Network/firewall settings')
  console.log('  2. Browser console for detailed errors')
  console.log('  3. LiveKit Cloud dashboard for server status')
} else {
  console.log('⚠️  Issues found:')
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`)
  })
  console.log('\n🔧 How to fix:')
  console.log('  1. Visit https://cloud.livekit.io/')
  console.log('  2. Select or create your project')
  console.log('  3. Go to Settings → Keys')
  console.log('  4. Generate new API key and secret')
  console.log('  5. Update your .env file with complete credentials')
  console.log('  6. Restart your backend server')
}

console.log('\n' + '=' .repeat(50))
console.log('For more help, visit: https://docs.livekit.io/')
console.log('=' .repeat(50) + '\n')

// Wait for async operations to complete
setTimeout(() => {
  process.exit(issues.length > 0 ? 1 : 0)
}, 2000)
