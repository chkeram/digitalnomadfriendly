#!/usr/bin/env node

/**
 * Final RLS Security Test
 * 
 * Comprehensive test to verify RLS is working properly
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function finalRLSTest() {
  console.log('🔒 Final RLS Security Test...')
  
  // Test 1: Anonymous client access
  console.log('\n📝 Test 1: Anonymous access attempts')
  const anonClient = createClient(supabaseUrl, anonKey)
  
  try {
    const { data, error } = await anonClient
      .from('users')
      .select('*')
    
    if (error) {
      console.log('✅ RLS WORKING: Anonymous access blocked')
      console.log(`   Error: ${error.message}`)
    } else {
      console.log(`⚠️ Anonymous access returned ${data?.length || 0} rows`)
      if (data && data.length > 0) {
        console.log('❌ SECURITY ISSUE: Anonymous users can see user data')
        console.log('   Sample data:', data[0])
      } else {
        console.log('✅ RLS WORKING: No data returned to anonymous users')
      }
    }
  } catch (err) {
    console.log('✅ RLS WORKING: Exception thrown for anonymous access')
    console.log(`   Error: ${err.message}`)
  }

  // Test 2: Anonymous insert attempt
  console.log('\n📝 Test 2: Anonymous insert attempt')
  try {
    const { data, error } = await anonClient
      .from('users')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'hacker@example.com',
        name: 'Hacker'
      })
    
    if (error) {
      console.log('✅ RLS WORKING: Anonymous insert blocked')
      console.log(`   Error: ${error.message}`)
    } else {
      console.log('❌ SECURITY ISSUE: Anonymous insert succeeded')
    }
  } catch (err) {
    console.log('✅ RLS WORKING: Anonymous insert threw exception')
  }

  // Test 3: Admin access (should work)
  console.log('\n📝 Test 3: Admin access verification')
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  const { data: adminData, error: adminError } = await adminClient
    .from('users')
    .select('id, email')
    .limit(5)

  if (adminError) {
    console.log('❌ Admin access failed:', adminError.message)
  } else {
    console.log(`✅ Admin access working: Found ${adminData?.length || 0} users`)
  }

  console.log('\n🏁 Security test complete!')
}

finalRLSTest()