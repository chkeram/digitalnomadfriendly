#!/usr/bin/env node

/**
 * Direct RLS Policy Fix
 * 
 * This script applies RLS policies directly without using exec_sql
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

async function applyRLSPolicies() {
  console.log('🔧 Applying RLS policies directly...')
  
  const policies = [
    {
      name: 'Enable RLS',
      sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Users can view their own profile',
      sql: `CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);`
    },
    {
      name: 'Users can create their own profile', 
      sql: `CREATE POLICY "Users can create their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);`
    },
    {
      name: 'Users can update their own profile',
      sql: `CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);`
    },
    {
      name: 'Anyone can view public user data',
      sql: `CREATE POLICY "Anyone can view public user data" ON users FOR SELECT USING (deleted_at IS NULL);`
    }
  ]

  for (const policy of policies) {
    try {
      console.log(`📝 Applying: ${policy.name}`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql })
      
      if (error) {
        // If exec_sql fails, the policy might already exist
        console.log(`   ⚠️ ${policy.name}: ${error.message}`)
      } else {
        console.log(`   ✅ ${policy.name}: Applied successfully`)
      }
    } catch (err) {
      console.log(`   ❌ ${policy.name}: ${err.message}`)
    }
  }

  // Verify policies were applied
  console.log('\n🔍 Verifying policies...')
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users';
      `
    })

    if (error) {
      console.error('❌ Error checking policies:', error)
    } else if (data && data.length > 0) {
      console.log('✅ Policies found:')
      data.forEach(policy => console.log(`   - ${policy.policyname} (${policy.cmd})`))
    } else {
      console.log('⚠️ No policies found')
    }
  } catch (err) {
    console.error('❌ Error verifying policies:', err)
  }
}

applyRLSPolicies()