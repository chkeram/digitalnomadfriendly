#!/usr/bin/env node

/**
 * Test Database Insert Without RLS
 * 
 * This temporarily disables RLS to test if the basic insert works
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDatabaseInsert() {
  console.log('🧪 Testing database insert without RLS...')
  
  try {
    // Test data
    const testUser = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Test UUID
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: '',
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Attempting to insert test user...')
    const { data, error } = await supabase
      .from('users')
      .upsert(testUser, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Insert failed:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Insert successful!')
      console.log('📋 Created user:', data)
      
      // Clean up test data
      console.log('🧹 Cleaning up test data...')
      await supabase.from('users').delete().eq('id', testUser.id)
      console.log('✅ Test data cleaned up')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testDatabaseInsert()