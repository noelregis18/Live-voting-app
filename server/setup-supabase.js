/**
 * Supabase setup script for VoteHub
 * 
 * This script shows the SQL commands you need to run in your Supabase SQL Editor
 * to set up the necessary tables for the VoteHub application.
 * 
 * Note: This is not meant to be executed directly - copy these SQL commands
 * into the Supabase SQL Editor at https://app.supabase.com/project/_/sql
 */

/*
 * Create tables
 */

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Poll options table
CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/*
 * Enable Row Level Security (RLS)
 */

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

/*
 * Create policies
 */

-- Users policies (only authenticated users can view profiles, users can only edit their own profiles)
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Polls policies (all polls are viewable, only creators can update/delete)
CREATE POLICY "Polls are viewable by everyone" ON public.polls
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create polls" ON public.polls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only creators can update polls" ON public.polls
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Only creators can delete polls" ON public.polls
  FOR DELETE USING (auth.uid() = created_by);

-- Poll options policies
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update poll option votes" ON public.poll_options
  FOR UPDATE USING (true);

/*
 * Create functions
 */

-- Function to create a poll with options
CREATE OR REPLACE FUNCTION create_poll(
  title TEXT,
  options TEXT[],
  user_id UUID
)
RETURNS UUID AS $$
DECLARE
  poll_id UUID;
  option_text TEXT;
BEGIN
  -- Insert new poll
  INSERT INTO public.polls (title, created_by)
  VALUES (title, user_id)
  RETURNING id INTO poll_id;
  
  -- Insert options for the poll
  FOREACH option_text IN ARRAY options LOOP
    INSERT INTO public.poll_options (poll_id, text, votes)
    VALUES (poll_id, option_text, 0);
  END LOOP;
  
  RETURN poll_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vote on a poll option
CREATE OR REPLACE FUNCTION vote_on_poll(
  option_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.poll_options
  SET votes = votes + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
 * Sample data (optional)
 */

-- Insert a test user (with password 'password123')
INSERT INTO public.users (username, email, password)
VALUES (
  'TestUser',
  'test@example.com',
  '$2a$10$LsRwjxHMQHAf.bAMuIX5jevHZ.0XbCIR9Uy/FPyTMQMrO1VHSc1lC'
);

-- Get the user ID
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM public.users WHERE email = 'test@example.com';
  
  -- Create a test poll
  PERFORM create_poll(
    'Favorite Programming Language',
    ARRAY['JavaScript', 'Python', 'Java', 'C#'],
    user_id
  );
  
  -- Create another test poll
  PERFORM create_poll(
    'Best Web Framework',
    ARRAY['React', 'Vue', 'Angular', 'Svelte'],
    user_id
  );
END $$; 