# Error Handling & Debugging

Comprehensive guide to handling authentication errors, debugging issues, and implementing robust error recovery.

## 🎯 Learning Objectives
- Identify and resolve common authentication errors
- Implement comprehensive error handling strategies
- Debug authentication flows effectively
- Create user-friendly error messages
- Monitor and log authentication issues

## 🚨 Common Authentication Errors

### 1. OAuth Callback Errors

#### Invalid Authorization Code
```typescript
// Error: OAuth callback with invalid/expired code
// Cause: User took too long, code expired, or tampered URL

export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  
  // Handle OAuth provider errors first
  if (error) {
    console.error('OAuth provider error:', error)
    const errorMessages = {
      'access_denied': 'You denied access to your Google account',
      'invalid_request': 'Invalid OAuth request',
      'unsupported_response_type': 'OAuth configuration error'
    }
    
    const message = errorMessages[error] || 'Authentication failed'
    throw redirect(303, `/auth/login?error=${encodeURIComponent(message)}`)
  }
  
  if (!code) {
    console.error('No authorization code in callback')
    throw redirect(303, '/auth/login?error=Invalid callback - no authorization code')
  }
  
  try {
    const { data, error: exchangeError } = await locals.supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      
      // Handle specific exchange errors
      if (exchangeError.message.includes('expired')) {
        throw redirect(303, '/auth/login?error=Authorization code expired, please try again')
      }
      
      if (exchangeError.message.includes('invalid')) {
        throw redirect(303, '/auth/login?error=Invalid authorization code')
      }
      
      throw redirect(303, '/auth/login?error=Authentication failed')
    }
    
    // Continue with success flow...
  } catch (error) {
    console.error('Unexpected callback error:', error)
    throw redirect(303, '/auth/login?error=An unexpected error occurred')
  }
}
```

#### User Verification Failures
```typescript
// Error: getUser() fails after successful code exchange
// Cause: Token validation issues, network problems

const { data: userData, error: userError } = await locals.supabase.auth.getUser()

if (userError) {
  console.error('User verification failed:', userError)
  
  // Handle specific user validation errors
  if (userError.message.includes('JWT')) {
    console.error('JWT validation failed - possible token corruption')
    throw redirect(303, '/auth/login?error=Session validation failed')
  }
  
  if (userError.message.includes('network')) {
    console.error('Network error during user verification')
    throw redirect(303, '/auth/login?error=Network error, please try again')
  }
  
  throw redirect(303, '/auth/login?error=User verification failed')
}
```

### 2. Session Management Errors

#### Invalid Refresh Token
```typescript
// Error: "Invalid Refresh Token" in browser console
// Cause: Token expired, user logged out elsewhere, token corruption

export const handleInvalidRefreshToken = async (error: any) => {
  if (error?.message?.includes('Invalid Refresh Token') || 
      error?.message?.includes('refresh_token_not_found')) {
    
    console.log('🔄 Refresh token invalid, clearing session')
    
    // Clear all auth state
    await supabase.auth.signOut()
    session.set(null)
    user.set(null)
    
    // Clear any cached data
    localStorage.removeItem('supabase.auth.token')
    
    // Redirect to login if on protected page
    if (window.location.pathname.startsWith('/profile') ||
        window.location.pathname.startsWith('/favorites')) {
      window.location.href = '/auth/login?error=Session expired'
    }
    
    return
  }
  
  // Re-throw if not a refresh token error
  throw error
}

// Usage in auth state change handler
supabase.auth.onAuthStateChange(async (event, session) => {
  try {
    const { data: userData, error } = await supabase.auth.getUser()
    
    if (error) {
      await handleInvalidRefreshToken(error)
      return
    }
    
    // Continue with normal auth state update
  } catch (error) {
    console.error('Auth state change error:', error)
  }
})
```

#### Session Persistence Issues
```typescript
// Error: User logged out after page refresh
// Cause: Cookie configuration, HTTPS issues, domain problems

// Diagnostic function
export async function diagnoseSessionIssues() {
  console.log('🔍 Diagnosing session issues...')
  
  // Check if cookies are being set
  const cookies = document.cookie.split(';').map(c => c.trim())
  const authCookies = cookies.filter(c => c.includes('supabase'))
  
  console.log('Auth cookies found:', authCookies.length)
  authCookies.forEach(cookie => console.log('  -', cookie.substring(0, 50) + '...'))
  
  // Check session retrieval
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  console.log('Session retrieval:', sessionError ? 'FAILED' : 'SUCCESS')
  if (sessionError) console.error('Session error:', sessionError)
  
  // Check user retrieval
  const { data: userData, error: userError } = await supabase.auth.getUser()
  console.log('User retrieval:', userError ? 'FAILED' : 'SUCCESS')
  if (userError) console.error('User error:', userError)
  
  // Check environment
  console.log('Environment:', {
    url: window.location.origin,
    https: window.location.protocol === 'https:',
    supabaseUrl: PUBLIC_SUPABASE_URL
  })
}

// Call this function when debugging session issues
// diagnoseSessionIssues()
```

### 3. Profile Sync Errors

#### Database Profile Creation Failures
```typescript
// Error: "User profile sync failed" in console
// Cause: RLS policies, database connection, validation errors

export async function upsertUserProfile(
  supabaseUser: SupabaseUser, 
  supabaseClient: SupabaseClient<Database>
): Promise<User | null> {
  try {
    console.log('🔄 Attempting user profile sync...')
    
    // Validate required data
    if (!supabaseUser.id || !supabaseUser.email) {
      console.error('❌ Missing required user data:', {
        hasId: !!supabaseUser.id,
        hasEmail: !!supabaseUser.email
      })
      return null
    }
    
    // Test database connection first
    const { data: connectionTest, error: connectionError } = await supabaseClient
      .from('users')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError)
      return null
    }
    
    const userData = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || 
            supabaseUser.user_metadata?.name || '',
      avatar_url: supabaseUser.user_metadata?.avatar_url || '',
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 User data to upsert:', userData)
    
    const { data, error } = await supabaseClient
      .from('users')
      .upsert(userData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Profile upsert error:', error)
      
      // Handle specific database errors
      if (error.code === '42501') {
        console.error('❌ RLS Policy Error: User cannot insert/update')
        return null
      }
      
      if (error.code === '23505') {
        console.error('❌ Unique Constraint Error:', error.details)
        return null
      }
      
      if (error.message.includes('violates row-level security')) {
        console.error('❌ RLS Policy Violation - check policies')
        return null
      }
      
      return null
    }

    console.log('✅ User profile synced successfully')
    return data
    
  } catch (error) {
    console.error('❌ Unexpected error in profile sync:', error)
    return null
  }
}
```

#### RLS Policy Errors
```typescript
// Error: RLS policy violations
// Cause: Missing policies, incorrect policy conditions

// Debug RLS policies
export async function debugRLSPolicies(supabaseClient: SupabaseClient) {
  console.log('🔍 Debugging RLS policies...')
  
  try {
    // Test anonymous access (should fail)
    const { data: anonData, error: anonError } = await supabaseClient
      .from('users')
      .select('*')
      .limit(1)
    
    if (anonError) {
      if (anonError.message.includes('row-level security')) {
        console.log('✅ RLS is working - anonymous access blocked')
      } else {
        console.error('❌ Unexpected error:', anonError)
      }
    } else {
      console.error('❌ RLS VULNERABILITY: Anonymous access allowed')
      console.log('Data returned:', anonData)
    }
    
    // Test authenticated user context
    const { data: userData, error: userError } = await supabaseClient.auth.getUser()
    
    if (userData.user) {
      console.log('✅ User authenticated:', userData.user.id)
      
      // Test user data access
      const { data: profileData, error: profileError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userData.user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Cannot access own profile:', profileError)
      } else {
        console.log('✅ Can access own profile')
      }
    } else {
      console.log('❌ No authenticated user context')
    }
    
  } catch (error) {
    console.error('❌ RLS debug failed:', error)
  }
}
```

## 🛠️ Error Handling Strategies

### 1. Graceful Degradation
```typescript
// Continue with limited functionality when non-critical features fail

export const load: PageServerLoad = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession()
  
  if (!session || !user) {
    return { session: null, user: null, dbUser: null, userStats: null }
  }

  // Try to get database profile (non-critical)
  let dbUser = null
  try {
    dbUser = await getUserProfile(user.id, locals.supabase)
  } catch (error) {
    console.warn('⚠️ Failed to load user profile, continuing with auth data only:', error)
    // Continue without database profile - use auth user data
  }
  
  // Try to get user stats (non-critical)
  let userStats = null
  try {
    userStats = await getUserStats(user.id, locals.supabase)
  } catch (error) {
    console.warn('⚠️ Failed to load user stats, showing defaults:', error)
    userStats = { total_reviews: 0, total_venues_visited: 0, favorite_venues: 0 }
  }

  return {
    session,
    user,
    dbUser,
    userStats
  }
}
```

### 2. Retry Logic
```typescript
// Implement automatic retries for transient errors

export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt} failed:`, error)
      
      // Don't retry on authentication errors
      if (error?.message?.includes('JWT') || 
          error?.message?.includes('Unauthorized') ||
          error?.message?.includes('row-level security')) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Usage
try {
  const dbUser = await retryOperation(
    () => getUserProfile(user.id, supabaseClient),
    3,
    1000
  )
} catch (error) {
  console.error('Failed to get user profile after retries:', error)
}
```

### 3. User-Friendly Error Messages
```typescript
// Convert technical errors to user-friendly messages

export function getErrorMessage(error: any): string {
  // Authentication errors
  if (error?.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }
  
  if (error?.message?.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.'
  }
  
  if (error?.message?.includes('JWT expired')) {
    return 'Your session has expired. Please sign in again.'
  }
  
  // Network errors
  if (error?.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  
  // Database errors
  if (error?.message?.includes('row-level security')) {
    return 'Access denied. Please contact support if this problem persists.'
  }
  
  // Rate limiting
  if (error?.message?.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  
  // Generic fallback
  return 'An unexpected error occurred. Please try again or contact support.'
}

// Usage in components
<script lang="ts">
  import { getErrorMessage } from '$lib/utils/errors'
  
  let errorMessage = ''
  
  async function handleLogin() {
    try {
      await signIn()
    } catch (error) {
      errorMessage = getErrorMessage(error)
    }
  }
</script>

{#if errorMessage}
  <div class="error-message">
    {errorMessage}
  </div>
{/if}
```

## 🔍 Debugging Tools

### 1. Debug Console Logger
```typescript
// Enhanced logging for debugging authentication issues

export class AuthDebugger {
  private static isDebugMode = import.meta.env.DEV || import.meta.env.VITE_DEBUG_AUTH === 'true'
  
  static log(message: string, data?: any) {
    if (this.isDebugMode) {
      console.log(`🔍 [AUTH] ${message}`, data)
    }
  }
  
  static warn(message: string, data?: any) {
    if (this.isDebugMode) {
      console.warn(`⚠️ [AUTH] ${message}`, data)
    }
  }
  
  static error(message: string, error?: any) {
    console.error(`❌ [AUTH] ${message}`, error)
  }
  
  static logAuthState(session: Session | null, user: User | null) {
    if (this.isDebugMode) {
      console.group('🔍 Auth State')
      console.log('Session:', session ? 'EXISTS' : 'NULL')
      console.log('User:', user ? user.email : 'NULL')
      console.log('Timestamp:', new Date().toISOString())
      console.groupEnd()
    }
  }
  
  static logSessionDetails(session: Session) {
    if (this.isDebugMode) {
      console.group('🔍 Session Details')
      console.log('User ID:', session.user.id)
      console.log('Email:', session.user.email)
      console.log('Expires:', new Date(session.expires_at * 1000).toISOString())
      console.log('Provider:', session.user.app_metadata.provider)
      console.groupEnd()
    }
  }
}

// Usage throughout the app
AuthDebugger.log('Starting OAuth flow')
AuthDebugger.logAuthState(session, user)
AuthDebugger.error('Profile sync failed', error)
```

### 2. Authentication Flow Tracer
```typescript
// Trace authentication flow for debugging

export class AuthTracer {
  private static steps: Array<{ step: string; timestamp: string; data?: any }> = []
  
  static trace(step: string, data?: any) {
    this.steps.push({
      step,
      timestamp: new Date().toISOString(),
      data
    })
    
    if (import.meta.env.DEV) {
      console.log(`📍 [TRACE] ${step}`, data)
    }
  }
  
  static getTrace() {
    return this.steps
  }
  
  static clearTrace() {
    this.steps = []
  }
  
  static printTrace() {
    console.group('📍 Authentication Flow Trace')
    this.steps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.step} (${step.timestamp})`, step.data)
    })
    console.groupEnd()
  }
}

// Usage in auth flow
AuthTracer.trace('OAuth login initiated')
AuthTracer.trace('OAuth callback received', { code: !!code })
AuthTracer.trace('Code exchange successful', { hasSession: !!session })
AuthTracer.trace('User verification completed', { userId: user.id })
AuthTracer.trace('Profile sync completed', { success: !!dbUser })
```

### 3. Environment Validation
```typescript
// Validate environment configuration

export function validateAuthEnvironment() {
  const issues: string[] = []
  
  // Check required environment variables
  if (!PUBLIC_SUPABASE_URL) {
    issues.push('PUBLIC_SUPABASE_URL is not set')
  }
  
  if (!PUBLIC_SUPABASE_ANON_KEY) {
    issues.push('PUBLIC_SUPABASE_ANON_KEY is not set')
  }
  
  if (!PUBLIC_SUPABASE_AUTH_REDIRECT_URL) {
    issues.push('PUBLIC_SUPABASE_AUTH_REDIRECT_URL is not set')
  }
  
  // Validate URL formats
  try {
    new URL(PUBLIC_SUPABASE_URL)
  } catch {
    issues.push('PUBLIC_SUPABASE_URL is not a valid URL')
  }
  
  // Check if running on HTTPS in production
  if (import.meta.env.PROD && location.protocol !== 'https:') {
    issues.push('Production environment should use HTTPS')
  }
  
  // Check if redirect URL matches current origin
  if (PUBLIC_SUPABASE_AUTH_REDIRECT_URL) {
    try {
      const redirectUrl = new URL(PUBLIC_SUPABASE_AUTH_REDIRECT_URL)
      const currentOrigin = location.origin
      
      if (redirectUrl.origin !== currentOrigin) {
        issues.push(`Redirect URL origin (${redirectUrl.origin}) doesn't match current origin (${currentOrigin})`)
      }
    } catch {
      issues.push('PUBLIC_SUPABASE_AUTH_REDIRECT_URL is not a valid URL')
    }
  }
  
  if (issues.length > 0) {
    console.error('❌ Authentication Environment Issues:')
    issues.forEach(issue => console.error(`  - ${issue}`))
    return false
  }
  
  console.log('✅ Authentication environment is properly configured')
  return true
}

// Run validation in development
if (import.meta.env.DEV) {
  validateAuthEnvironment()
}
```

## 📊 Error Monitoring

### 1. Error Reporting Service
```typescript
// Send errors to monitoring service

export class ErrorReporter {
  static async reportAuthError(error: any, context: string, userId?: string) {
    const errorData = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      userId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    // Log locally
    console.error(`❌ [${context}]`, error)
    
    // Send to monitoring service (e.g., Sentry, LogRocket)
    try {
      if (import.meta.env.PROD) {
        // await sendToMonitoringService(errorData)
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }
}

// Usage
try {
  await upsertUserProfile(user, supabaseClient)
} catch (error) {
  ErrorReporter.reportAuthError(error, 'profile_sync', user?.id)
  throw error
}
```

### 2. Health Check Endpoint
```typescript
// API endpoint to check authentication system health

// src/routes/api/health/auth/+server.ts
export const GET: RequestHandler = async ({ locals }) => {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      supabase_connection: false,
      database_access: false,
      auth_service: false
    },
    errors: []
  }
  
  try {
    // Test Supabase connection
    const { data: connectionTest } = await locals.supabase.auth.getSession()
    healthCheck.checks.supabase_connection = true
    
    // Test database access
    const { data: dbTest, error: dbError } = await locals.supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (!dbError) {
      healthCheck.checks.database_access = true
    } else {
      healthCheck.errors.push(`Database error: ${dbError.message}`)
    }
    
    // Test auth service
    const { data: authTest } = await locals.supabase.auth.getUser()
    healthCheck.checks.auth_service = true
    
  } catch (error) {
    healthCheck.status = 'unhealthy'
    healthCheck.errors.push(error.message)
  }
  
  const allHealthy = Object.values(healthCheck.checks).every(check => check)
  if (!allHealthy) {
    healthCheck.status = 'degraded'
  }
  
  return json(healthCheck, {
    status: healthCheck.status === 'healthy' ? 200 : 503
  })
}
```

## 🧪 Testing Error Scenarios

### 1. Error Simulation
```typescript
// Simulate different error conditions for testing

export class ErrorSimulator {
  static simulateNetworkError() {
    return Promise.reject(new Error('fetch: Network request failed'))
  }
  
  static simulateJWTExpired() {
    return Promise.reject(new Error('JWT expired'))
  }
  
  static simulateRLSViolation() {
    return Promise.reject(new Error('new row violates row-level security policy'))
  }
  
  static simulateInvalidRefreshToken() {
    return Promise.reject(new Error('Invalid Refresh Token: Refresh Token Not Found'))
  }
}

// Test error handling
test('handles JWT expiration correctly', async () => {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockImplementation(() => ErrorSimulator.simulateJWTExpired())
    }
  }
  
  const result = await safeGetSession(mockClient)
  
  expect(result.session).toBeNull()
  expect(result.user).toBeNull()
})
```

## 🔗 Next Steps

1. **[Testing Authentication](./11-testing-auth.md)** - Test authentication thoroughly
2. **[Production Deployment](./12-production-deploy.md)** - Deploy securely
3. **Back to [Authentication Overview](./README.md)** - Review complete system

---

Proper error handling is crucial for a robust authentication system. Users should never see technical errors, and developers should have comprehensive debugging information.