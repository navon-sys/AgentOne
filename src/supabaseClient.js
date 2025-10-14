import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema initialization SQL (Run this in Supabase SQL Editor):
/*
-- Enable Row Level Security
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS interview_transcripts ENABLE ROW LEVEL SECURITY;

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  title TEXT NOT NULL,
  description TEXT,
  default_questions JSONB DEFAULT '[]'::JSONB,
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  access_token TEXT UNIQUE NOT NULL,
  custom_questions JSONB DEFAULT '[]'::JSONB,
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'link_sent', 'in_progress', 'completed', 'reviewed')),
  hr_notes TEXT,
  interview_link TEXT
);

-- Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  ai_summary TEXT,
  ai_score INTEGER CHECK (ai_score >= 1 AND ai_score <= 10),
  livekit_room_name TEXT
);

-- Interview Transcripts Table
CREATE TABLE IF NOT EXISTS interview_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('ai', 'candidate')),
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  question_index INTEGER
);

-- Row Level Security Policies

-- Jobs: Authenticated users can read/write their own jobs
CREATE POLICY "Users can read their own jobs" ON jobs
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own jobs" ON jobs
  FOR DELETE USING (auth.uid() = created_by);

-- Candidates: Authenticated users can manage candidates for their jobs
CREATE POLICY "Users can read candidates for their jobs" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = candidates.job_id AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert candidates for their jobs" ON candidates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = candidates.job_id AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update candidates for their jobs" ON candidates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = candidates.job_id AND jobs.created_by = auth.uid()
    )
  );

-- Candidates can read their own data via access_token (handled in app logic)

-- Interviews: Related to candidates
CREATE POLICY "Users can read interviews for their candidates" ON interviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates 
      JOIN jobs ON candidates.job_id = jobs.id 
      WHERE interviews.candidate_id = candidates.id 
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert interviews" ON interviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update interviews" ON interviews
  FOR UPDATE USING (true);

-- Transcripts: Related to interviews
CREATE POLICY "Users can read transcripts for their interviews" ON interview_transcripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interviews
      JOIN candidates ON interviews.candidate_id = candidates.id
      JOIN jobs ON candidates.job_id = jobs.id
      WHERE interview_transcripts.interview_id = interviews.id
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert transcripts" ON interview_transcripts
  FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_access_token ON candidates(access_token);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_interview_id ON interview_transcripts(interview_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
*/
