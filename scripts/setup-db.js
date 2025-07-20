#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = dirname(__dirname)

// Validate environment variables
if (!process.env.PUBLIC_SUPABASE_URL) {
  console.error('❌ PUBLIC_SUPABASE_URL is required')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required')
  console.error('💡 Get it from: Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  try {
    console.log('🔄 Creating exec_sql function...')
    const createFunctionSQL = readFileSync(join(projectRoot, 'scripts', 'create-exec-function.sql'), 'utf8')
    
    // Try to create function using raw HTTP request to Supabase
    const response = await fetch(`${process.env.PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql: createFunctionSQL })
    })
    
    if (response.ok) {
      console.log('✅ exec_sql function created successfully')
      return true
    } else {
      // Function might already exist, let's test it
      const testResponse = await fetch(`${process.env.PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql: 'SELECT 1;' })
      })
      
      if (testResponse.ok) {
        console.log('✅ exec_sql function already exists')
        return true
      }
      
      console.log('⚠️  Could not create exec_sql function - falling back to manual mode')
      return false
    }
  } catch (error) {
    console.log('⚠️  Could not create exec_sql function - falling back to manual mode')
    return false
  }
}

async function runSQL(filePath, description, useFunction = true) {
  try {
    console.log(`🔄 ${description}...`)
    const sql = readFileSync(filePath, 'utf8')
    
    if (useFunction) {
      // Try to execute via exec_sql function
      const { data, error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.log(`⚠️  Function execution failed: ${error.message}`)
        console.log('📋 Please run the following SQL in Supabase Dashboard → SQL Editor:')
        console.log('=' .repeat(60))
        console.log(sql)
        console.log('=' .repeat(60))
        console.log(`Press Enter when you've executed the SQL for: ${description}`)
        
        // Wait for user input
        await new Promise(resolve => {
          process.stdin.once('data', () => resolve())
        })
      } else {
        console.log(`✅ ${description} completed automatically`)
      }
    } else {
      // Manual execution mode
      console.log('📋 Please run the following SQL in Supabase Dashboard → SQL Editor:')
      console.log('=' .repeat(60))
      console.log(sql)
      console.log('=' .repeat(60))
      console.log(`Press Enter when you've executed the SQL for: ${description}`)
      
      // Wait for user input
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve())
      })
    }
    
    console.log(`✅ ${description} completed`)
    return true
  } catch (error) {
    console.error(`❌ Failed to ${description.toLowerCase()}:`, error.message)
    return false
  }
}

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...')
    const { data, error } = await supabase.from('_health').select('*').limit(1)
    if (error && !error.message.includes('does not exist')) {
      throw error
    }
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
    return false
  }
}

async function checkPostGIS() {
  try {
    console.log('🔄 Checking PostGIS extension...')
    
    // Test PostGIS by running a simple spatial function
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT PostGIS_Version() as version;' 
    })
    
    if (error) {
      console.log('⚠️  PostGIS not detected - please enable it manually')
      console.log('💡 Go to: Supabase Dashboard → Database → Extensions → Enable PostGIS')
      return false
    }
    
    console.log('✅ PostGIS extension is available')
    return true
  } catch (error) {
    console.log('⚠️  Cannot verify PostGIS - assuming it\'s enabled')
    return true
  }
}

async function main() {
  console.log('🚀 Starting database setup...\n')
  
  // Test connection
  if (!(await testConnection())) {
    process.exit(1)
  }
  
  // Check PostGIS
  await checkPostGIS()
  
  // Try to create exec_sql function for automated execution
  const canUseFunction = await createExecSqlFunction()
  
  // Run migration
  const migrationPath = join(projectRoot, 'database', 'migrations', '001_initial_schema.sql')
  if (!(await runSQL(migrationPath, 'Running database migration', canUseFunction))) {
    process.exit(1)
  }
  
  // Run seed data
  const seedPath = join(projectRoot, 'database', 'seed', 'sample_data.sql')
  if (!(await runSQL(seedPath, 'Loading sample data', canUseFunction))) {
    process.exit(1)
  }
  
  console.log('\n🎉 Database setup completed successfully!')
  console.log('📋 You can now test with: npm run db:test')
}

main().catch(console.error)