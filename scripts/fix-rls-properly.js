#!/usr/bin/env node

/**
 * Properly Fix RLS Security
 * 
 * This script ensures RLS is properly enabled and configured
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSProperly() {
  console.log('🔧 Properly fixing RLS security...')
  
  const sqlCommands = [
    {
      name: 'Enable RLS',
      sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Drop existing policies',
      sql: `
        DROP POLICY IF EXISTS "Users can view their own profile" ON users;
        DROP POLICY IF EXISTS "Users can create their own profile" ON users;
        DROP POLICY IF EXISTS "Users can update their own profile" ON users;
        DROP POLICY IF EXISTS "Anyone can view public user data" ON users;
        DROP POLICY IF EXISTS "Users can manage their own profile" ON users;
      `
    },
    {
      name: 'Create secure policies',
      sql: `
        -- Allow users to view only their own profile
        CREATE POLICY "Users can view own profile" ON users
          FOR SELECT USING (auth.uid() = id);
        
        -- Allow users to create their own profile
        CREATE POLICY "Users can create own profile" ON users
          FOR INSERT WITH CHECK (auth.uid() = id);
        
        -- Allow users to update their own profile
        CREATE POLICY "Users can update own profile" ON users
          FOR UPDATE USING (auth.uid() = id);
        
        -- Allow users to delete their own profile
        CREATE POLICY "Users can delete own profile" ON users
          FOR DELETE USING (auth.uid() = id);
      `
    }
  ]

  for (const command of sqlCommands) {
    try {
      console.log(`📝 ${command.name}...`)
      
      // For direct SQL execution, let's try a different approach
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ sql: command.sql })
      })

      if (response.ok) {
        console.log(`   ✅ ${command.name}: Success`)
      } else {
        const error = await response.text()
        console.log(`   ⚠️ ${command.name}: ${error}`)
      }
    } catch (err) {
      console.log(`   ❌ ${command.name}: ${err.message}`)
    }
  }

  // Verify the fix
  console.log('\n🔍 Verifying RLS fix...')
  
  // Test anonymous access
  const anonClient = createClient(supabaseUrl, process.env.PUBLIC_SUPABASE_ANON_KEY)
  const { data: testData, error: testError } = await anonClient
    .from('users')
    .select('*')
    .limit(1)

  if (testError) {
    console.log('✅ RLS WORKING: Anonymous access properly blocked')
    console.log(`   Error: ${testError.message}`)
  } else {
    console.log('⚠️ RLS STILL NOT WORKING: Anonymous access still allowed')
  }
}

fixRLSProperly()