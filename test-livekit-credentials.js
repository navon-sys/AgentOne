#!/usr/bin/env node

/**
 * LiveKit Credentials Test Script
 * Tests if LiveKit API credentials are valid and can generate tokens
 */

import dotenv from 'dotenv'
import { AccessToken } from 'livekit-server-sdk'

dotenv.config()

console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║                                                                ║')
console.log('║              🔍 LiveKit Credentials Test                       ║')
console.log('║                                                                ║')
console.log('╚════════════════════════════════════════════════════════════════╝')
console.log('')

// Check environment variables
console.log('📋 Checking Environment Variables...')
console.log('')

const livekitUrl = process.env.VITE_LIVEKIT_URL
const apiKey = process.env.LIVEKIT_API_KEY
const apiSecret = process.env.LIVEKIT_API_SECRET

console.log('VITE_LIVEKIT_URL:', livekitUrl ? '✅ Set' : '❌ Missing')
if (livekitUrl) {
  console.log('  Value:', livekitUrl)
  console.log('  Length:', livekitUrl.length, 'characters')
}
console.log('')

console.log('LIVEKIT_API_KEY:', apiKey ? '✅ Set' : '❌ Missing')
if (apiKey) {
  console.log('  Value:', apiKey.substring(0, 10) + '...')
  console.log('  Length:', apiKey.length, 'characters')
  console.log('  Format:', apiKey.startsWith('API') ? '✅ Correct prefix' : '⚠️  Unexpected format')
}
console.log('')

console.log('LIVEKIT_API_SECRET:', apiSecret ? '✅ Set' : '❌ Missing')
if (apiSecret) {
  console.log('  Value:', apiSecret.substring(0, 10) + '...')
  console.log('  Length:', apiSecret.length, 'characters')
}
console.log('')

// Check if all required credentials are present
if (!livekitUrl || !apiKey || !apiSecret) {
  console.log('❌ Missing required LiveKit credentials!')
  console.log('')
  console.log('Please ensure your .env file contains:')
  console.log('  VITE_LIVEKIT_URL=wss://your-project.livekit.cloud')
  console.log('  LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx')
  console.log('  LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  console.log('')
  process.exit(1)
}

// Test token generation
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('🔐 Testing Token Generation...')
console.log('')

try {
  const testParticipant = 'test-user-' + Date.now()
  const testRoom = 'test-room-' + Date.now()
  
  console.log('Creating token for:')
  console.log('  Participant:', testParticipant)
  console.log('  Room:', testRoom)
  console.log('')
  
  const token = new AccessToken(apiKey, apiSecret, {
    identity: testParticipant,
    name: testParticipant
  })
  
  token.addGrant({
    roomJoin: true,
    room: testRoom,
    canPublish: true,
    canSubscribe: true
  })
  
  const jwt = await token.toJwt()
  
  console.log('✅ Token Generated Successfully!')
  console.log('')
  console.log('Token (first 50 chars):', String(jwt).substring(0, 50) + '...')
  console.log('Token length:', String(jwt).length, 'characters')
  console.log('')
  
  // Decode token to show claims
  const jwtString = String(jwt)
  const parts = jwtString.split('.')
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      console.log('Token Claims:')
      console.log('  Identity:', payload.sub)
      console.log('  Name:', payload.name)
      console.log('  Issuer:', payload.iss)
      console.log('  Video Grants:', JSON.stringify(payload.video, null, 2))
      console.log('')
    } catch (e) {
      console.log('  (Could not decode token payload)')
      console.log('')
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('✨ LiveKit Credentials Test: PASSED')
  console.log('')
  console.log('Your credentials are valid and can generate tokens.')
  console.log('If you\'re still getting 401 errors, the issue might be:')
  console.log('')
  console.log('1. ⚠️  LiveKit Project Status')
  console.log('   → Check if your project is active in LiveKit Cloud dashboard')
  console.log('   → Visit: https://cloud.livekit.io/')
  console.log('')
  console.log('2. ⚠️  API Key Mismatch')
  console.log('   → Ensure API key matches the project in LiveKit URL')
  console.log('   → Project in URL: ' + (livekitUrl.match(/([^\/]+)\.livekit\.cloud/) || ['', 'unknown'])[1])
  console.log('')
  console.log('3. ⚠️  Credentials Expired or Revoked')
  console.log('   → Generate new credentials in LiveKit dashboard')
  console.log('   → Settings → API Keys')
  console.log('')
  console.log('4. ⚠️  Network/Firewall Issues')
  console.log('   → Test WebSocket connection manually')
  console.log('   → Check if wss:// protocol is allowed')
  console.log('')
  
} catch (error) {
  console.log('❌ Token Generation Failed!')
  console.log('')
  console.log('Error:', error.message)
  console.log('')
  
  if (error.message.includes('Invalid')) {
    console.log('🔍 Diagnosis: Invalid API credentials')
    console.log('')
    console.log('Common causes:')
    console.log('  1. API Key format is incorrect')
    console.log('  2. API Secret format is incorrect')
    console.log('  3. Key or Secret contains extra spaces/characters')
    console.log('  4. Credentials were copied incorrectly')
    console.log('')
    console.log('Solutions:')
    console.log('  → Go to LiveKit Cloud: https://cloud.livekit.io/')
    console.log('  → Navigate to your project')
    console.log('  → Settings → API Keys')
    console.log('  → Generate new API key pair')
    console.log('  → Copy carefully (no extra spaces)')
    console.log('  → Update .env file')
    console.log('')
  }
  
  console.log('Full error details:')
  console.error(error)
  console.log('')
  process.exit(1)
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
