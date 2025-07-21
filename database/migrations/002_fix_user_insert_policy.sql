-- Fix User Profile Creation - Add Missing INSERT Policy
-- This migration adds the missing INSERT policy for the users table

-- Add INSERT policy for users table
-- This allows authenticated users to create their own profile
CREATE POLICY "Users can create their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

-- Optional: Add UPSERT-friendly policy that combines INSERT and UPDATE
-- This is more flexible for profile sync operations
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can manage their own profile" ON users
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);