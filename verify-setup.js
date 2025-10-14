#!/usr/bin/env node

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

console.log('\n🔍 AI Interview Platform - Setup Verification\n')
console.log('=' .repeat(60))

const checks = [
  {
    name: 'Supabase URL',
    env: 'VITE_SUPABASE_URL',
    required: true,
    validate: (val) => val && val.includes('supabase.co'),
    help: 'Get from https://supabase.com → Project Settings → API'
  },
  {
    name: 'Supabase Anon Key',
    env: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    validate: (val) => val && val.length > 50,
    help: 'Get from https://supabase.com → Project Settings → API'
  },
  {
    name: 'LiveKit URL',
    env: 'VITE_LIVEKIT_URL',
    required: true,
    validate: (val) => val && (val.startsWith('wss://') || val.startsWith('ws://')),
    help: 'Get from https://livekit.io → Project Settings'
  },
  {
    name: 'LiveKit API Key',
    env: 'LIVEKIT_API_KEY',
    required: true,
    validate: (val) => val && val.length > 10,
    help: 'Get from https://livekit.io → Project Settings → API Keys'
  },
  {
    name: 'LiveKit API Secret',
    env: 'LIVEKIT_API_SECRET',
    required: true,
    validate: (val) => val && val.length > 10,
    help: 'Get from https://livekit.io → Project Settings → API Keys'
  },
  {
    name: 'Deepgram API Key',
    env: 'DEEPGRAM_API_KEY',
    required: false,
    validate: (val) => val && val.length > 20,
    help: 'Get from https://deepgram.com → API Keys (Optional, $200 free)'
  },
  {
    name: 'OpenAI API Key',
    env: 'OPENAI_API_KEY',
    required: false,
    validate: (val) => val && val.startsWith('sk-'),
    help: 'Get from https://platform.openai.com → API Keys (Optional, paid)'
  }
]

let allRequired = true
let allOptional = true

checks.forEach(check => {
  const value = process.env[check.env]
  const exists = !!value
  const valid = exists && check.validate(value)
  
  const status = valid ? '✅' : (exists ? '⚠️' : '❌')
  const label = check.required ? '[REQUIRED]' : '[OPTIONAL]'
  
  console.log(`\n${status} ${check.name} ${label}`)
  console.log(`   Variable: ${check.env}`)
  console.log(`   Status: ${valid ? 'Valid' : (exists ? 'Invalid format' : 'Not set')}`)
  
  if (!valid) {
    console.log(`   💡 Help: ${check.help}`)
    if (check.required) allRequired = false
    if (!check.required) allOptional = false
  }
})

console.log('\n' + '='.repeat(60))
console.log('\n📊 Summary:\n')

if (allRequired) {
  console.log('✅ All required services configured!')
  console.log('   You can start the application.')
} else {
  console.log('❌ Some required services are missing.')
  console.log('   Please configure all required environment variables.')
}

if (!allOptional) {
  console.log('\n⚠️  Optional services not configured:')
  console.log('   - Interview features may be limited')
  console.log('   - Demo mode will be used where possible')
}

console.log('\n🚀 Next Steps:\n')

if (!allRequired) {
  console.log('1. Copy .env.example to .env')
  console.log('2. Fill in required environment variables')
  console.log('3. Run this script again: node verify-setup.js')
} else {
  console.log('1. Run backend: npm run server')
  console.log('2. Run frontend: npm run dev')
  console.log('3. Visit: http://localhost:5173')
}

console.log('\n📖 Documentation:')
console.log('   - Quick Start: ./QUICKSTART.md')
console.log('   - Full Guide: ./README.md')
console.log('\n')

process.exit(allRequired ? 0 : 1)
