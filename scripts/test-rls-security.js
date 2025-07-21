#!/usr/bin/env node

/**
 * Test RLS Security
 * 
 * This script tests if RLS is properly protecting user data
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create anonymous client (what normal users use)
const anonClient = createClient(supabaseUrl, anonKey)

// Create admin client (bypasses RLS)
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testRLSSecurity() {
  console.log('🔒 Testing RLS security...')
  
  try {
    // Test 1: Anonymous access should be restricted
    console.log('\n📝 Test 1: Anonymous access to users table')
    const { data: anonData, error: anonError } = await anonClient
      .from('users')
      .select('*')
      .limit(5)

    if (anonError) {
      console.log('✅ RLS WORKING: Anonymous access blocked')
      console.log(`   Error: ${anonError.message}`)
    } else {
      console.log('⚠️ RLS ISSUE: Anonymous access allowed')
      console.log(`   Found ${anonData?.length || 0} users`)
    }

    // Test 2: Admin access should work (bypasses RLS)
    console.log('\n📝 Test 2: Admin access to users table')
    const { data: adminData, error: adminError } = await adminClient
      .from('users')
      .select('id, email')
      .limit(5)

    if (adminError) {
      console.log('❌ Admin access failed:', adminError.message)
    } else {
      console.log('✅ Admin access working')
      console.log(`   Found ${adminData?.length || 0} users`)
      if (adminData && adminData.length > 0) {
        console.log('   Sample user:', adminData[0])
      }
    }

    // Test 3: Check if RLS is actually enabled
    console.log('\n📝 Test 3: Check RLS status')
    const { data: rlsStatus, error: rlsError } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname, 
          tablename, 
          rowsecurity as rls_enabled,
          (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users') as policy_count
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'users';
      `
    })

    if (rlsError) {
      console.log('❌ Cannot check RLS status:', rlsError.message)
    } else if (rlsStatus && rlsStatus.length > 0) {
      const status = rlsStatus[0]
      console.log(`✅ RLS Status: ${status.rls_enabled ? 'ENABLED' : 'DISABLED'}`)
      console.log(`📝 Policy Count: ${status.policy_count}`)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testRLSSecurity()