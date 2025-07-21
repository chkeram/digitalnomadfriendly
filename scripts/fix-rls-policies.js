#!/usr/bin/env node

/**
 * Fix RLS Policies for User Profile Creation
 * 
 * This script adds the missing INSERT policy for the users table
 * so that user profiles can be created during authentication.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  console.error('Need: PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for user profile creation...')
  
  try {
    // Step 1: Add INSERT policy for users table
    console.log('📝 Adding INSERT policy for users table...')
    const { error: insertPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can create their own profile" ON users
        FOR INSERT WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');
      `
    })

    if (insertPolicyError) {
      console.error('❌ Error creating INSERT policy:', insertPolicyError)
      return false
    }

    // Step 2: Replace UPDATE policy with a more flexible ALL policy
    console.log('📝 Updating user management policy...')
    const { error: updatePolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can update their own profile" ON users;
        CREATE POLICY "Users can manage their own profile" ON users
        FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
      `
    })

    if (updatePolicyError) {
      console.error('❌ Error updating management policy:', updatePolicyError)
      return false
    }

    console.log('✅ RLS policies fixed successfully!')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the fix
fixRLSPolicies()
  .then(success => {
    if (success) {
      console.log('🎉 User profile creation should now work!')
      console.log('💡 Try logging in again to test the fix.')
    } else {
      console.log('❌ Fix failed. You may need to run the SQL manually in Supabase.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })