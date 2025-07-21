#!/usr/bin/env node

/**
 * Check RLS Status and Policies
 * 
 * This script checks the current RLS policies on the users table
 * to verify they were applied correctly.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkRLSStatus() {
  console.log('🔍 Checking RLS status and policies...')
  
  try {
    // Check if users table exists
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users';
      `
    })

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      return
    }

    console.log('📋 Tables found:', tables)

    // Check RLS policies on users table
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tablename, 
          policyname, 
          cmd as command, 
          permissive,
          qual as using_expression,
          with_check as check_expression
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
        ORDER BY policyname;
      `
    })

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError)
      return
    }

    console.log('🔐 Current RLS policies on users table:')
    if (policies && policies.length > 0) {
      policies.forEach(policy => {
        console.log(`  📝 ${policy.policyname}`)
        console.log(`     Command: ${policy.command}`)
        console.log(`     Using: ${policy.using_expression || 'N/A'}`)
        console.log(`     Check: ${policy.check_expression || 'N/A'}`)
        console.log('')
      })
    } else {
      console.log('  ⚠️ No policies found!')
    }

    // Test basic table access
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Cannot access users table:', testError)
    } else {
      console.log('✅ Users table is accessible')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkRLSStatus()