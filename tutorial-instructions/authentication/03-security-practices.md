# Security Best Practices

Comprehensive guide to implementing secure authentication with proper security measures and threat mitigation.

## 🎯 Learning Objectives
- Understand authentication security threats
- Implement JWT validation and session security
- Configure Row Level Security (RLS) properly
- Handle security errors and edge cases
- Monitor and audit authentication security

## 🛡️ Security Architecture

### Multi-Layer Security Model
```
┌─────────────────────────────────────────────────────────────┐
│                    Application Security                     │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: OAuth Security (Google + Supabase)                │
│ Layer 2: JWT Token Validation (Server-side)                │
│ Layer 3: Session Management (Secure Cookies)               │
│ Layer 4: Row Level Security (Database)                     │
│ Layer 5: Input Validation & Sanitization                   │
│ Layer 6: Route Protection & Authorization                   │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 JWT Token Security

### 1. Server-Side Validation (Critical)
```typescript
// ❌ NEVER TRUST CLIENT-SIDE SESSION DATA
const session = await supabase.auth.getSession()
// This could be tampered with by malicious clients

// ✅ ALWAYS VALIDATE SERVER-SIDE WITH getUser()
export const safeGetSession = async (supabaseClient) => {
  // Step 1: Validate JWT token server-side
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  
  if (userError || !user) {
    console.warn('JWT validation failed:', userError?.message)
    return { session: null, user: null }
  }
  
  // Step 2: Only get session if user is valid
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
  
  if (!session || sessionError) {
    console.warn('Session retrieval failed:', sessionError?.message)
    return { session: null, user: null }
  }
  
  return { session, user: mapToAppUser(user) }
}
```

### 2. Token Expiration Handling
```typescript
export const handleTokenExpiration = async (error: any) => {
  if (error?.message?.includes('JWT expired') || 
      error?.message?.includes('Invalid Refresh Token')) {
    
    console.log('🔄 Token expired, clearing session')
    
    // Clear client-side session
    await supabase.auth.signOut()
    
    // Clear stores
    session.set(null)
    user.set(null)
    
    // Redirect to login
    throw redirect(303, '/auth/login?error=Session expired')
  }
  
  throw error
}
```

### 3. Secure Token Storage
```typescript
// Supabase handles secure token storage automatically
// But ensure proper cookie configuration
const cookieOptions = {
  path: '/',
  httpOnly: true,                    // Prevent XSS attacks
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'lax' as const,          // CSRF protection
  maxAge: 60 * 60 * 24 * 7          // 7 days
}
```

## 🗃️ Row Level Security (RLS)

### 1. Enable RLS on All Tables
```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on all sensitive tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_visits ENABLE ROW LEVEL SECURITY;
```

### 2. Secure RLS Policies
```sql
-- Users can only access their own data
CREATE POLICY "Users can only see own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can only create own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can only delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- Reviews: Users can manage their own, read others
CREATE POLICY "Users can manage own reviews" ON reviews
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read public reviews" ON reviews
    FOR SELECT USING (deleted_at IS NULL AND NOT is_flagged);

-- Favorites: Strictly personal
CREATE POLICY "Users can only access own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);
```

### 3. Test RLS Policies
```typescript
// Test script to verify RLS is working
export async function testRLSSecurity() {
  console.log('🔒 Testing RLS security...')
  
  // Test 1: Anonymous access should be blocked
  const anonClient = createClient(supabaseUrl, anonKey)
  const { data: anonData, error: anonError } = await anonClient
    .from('users')
    .select('*')
  
  if (anonError && anonError.message.includes('RLS')) {
    console.log('✅ RLS blocking anonymous access')
  } else {
    console.error('❌ RLS VULNERABILITY: Anonymous access allowed')
  }
  
  // Test 2: User can only see own data
  // This would be tested with actual authenticated users
}
```

## 🚫 Input Validation & Sanitization

### 1. Server-Side Validation
```typescript
// Profile update validation
export const updateProfile = async ({ request, locals }) => {
  const { session, user } = await locals.safeGetSession()
  
  if (!session || !user) {
    return fail(401, { error: 'Unauthorized' })
  }
  
  const formData = await request.formData()
  
  // Validate and sanitize inputs
  const name = String(formData.get('name') || '').trim()
  const bio = String(formData.get('bio') || '').trim()
  
  // Input validation
  if (name.length < 1 || name.length > 100) {
    return fail(400, { error: 'Name must be 1-100 characters' })
  }
  
  if (bio.length > 500) {
    return fail(400, { error: 'Bio must be less than 500 characters' })
  }
  
  // Sanitize HTML (if accepting rich text)
  const sanitizedBio = sanitizeHtml(bio, {
    allowedTags: [],  // No HTML allowed
    allowedAttributes: {}
  })
  
  // Update with validated data
  const { error } = await locals.supabase
    .from('users')
    .update({ name, bio: sanitizedBio })
    .eq('id', user.id)
  
  if (error) {
    console.error('Profile update error:', error)
    return fail(500, { error: 'Update failed' })
  }
  
  return { success: true }
}
```

### 2. Client-Side Validation (Defense in Depth)
```typescript
// Profile form validation
export function validateProfileForm(data: FormData) {
  const errors: Record<string, string> = {}
  
  const name = data.get('name') as string
  const email = data.get('email') as string
  
  // Name validation
  if (!name || name.trim().length === 0) {
    errors.name = 'Name is required'
  } else if (name.length > 100) {
    errors.name = 'Name must be less than 100 characters'
  }
  
  // Email validation
  if (!email || !isValidEmail(email)) {
    errors.email = 'Valid email is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

## 🔒 Route Protection & Authorization

### 1. Server-Side Route Protection
```typescript
// hooks.server.ts - Authentication guard
const authGuard: Handle = async ({ event, resolve }) => {
  // Define protection levels
  const publicPaths = ['/', '/auth/login', '/auth/callback']
  const protectedPaths = ['/profile', '/favorites']
  const adminPaths = ['/admin']
  
  const path = event.url.pathname
  
  // Check if route requires authentication
  if (protectedPaths.some(p => path.startsWith(p))) {
    if (!event.locals.session) {
      const redirectTo = path + event.url.search
      throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`)
    }
  }
  
  // Check if route requires admin access
  if (adminPaths.some(p => path.startsWith(p))) {
    if (!event.locals.user?.is_admin) {
      throw error(403, 'Forbidden: Admin access required')
    }
  }
  
  return resolve(event)
}
```

### 2. Page-Level Protection
```typescript
// +page.server.ts - Page-specific protection
export const load: PageServerLoad = async ({ locals, url }) => {
  const { session, user } = await locals.safeGetSession()
  
  // Require authentication
  if (!session || !user) {
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(url.pathname)}`)
  }
  
  // Check specific permissions
  if (url.pathname.startsWith('/admin') && !user.is_admin) {
    throw error(403, 'Forbidden: Admin access required')
  }
  
  return { user, session }
}
```

### 3. Component-Level Protection
```svelte
<!-- Protected component -->
<script lang="ts">
  import { isAuthenticated, user } from '$lib/stores/auth'
  
  // Show loading state while checking auth
  $: if (!$isAuthenticated) {
    // Redirect or show login prompt
  }
</script>

{#if $isAuthenticated}
  <!-- Protected content -->
  <div class="protected-content">
    Welcome, {$user?.name}!
  </div>
{:else}
  <!-- Public content or login prompt -->
  <div class="login-prompt">
    Please sign in to access this content.
  </div>
{/if}
```

## 🚨 Security Monitoring & Logging

### 1. Authentication Event Logging
```typescript
// Security event logger
export class SecurityLogger {
  static logAuthEvent(event: string, userId?: string, details?: any) {
    const logData = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      details,
      ip: details?.ip,
      userAgent: details?.userAgent
    }
    
    console.log('🔒 Security Event:', logData)
    
    // In production, send to monitoring service
    // await sendToMonitoringService(logData)
  }
  
  static logSecurityWarning(message: string, details?: any) {
    console.warn('⚠️ Security Warning:', message, details)
    // Alert security team in production
  }
  
  static logSecurityError(message: string, error: any) {
    console.error('❌ Security Error:', message, error)
    // Immediate alert in production
  }
}

// Usage in authentication flow
export const handleLogin = async (user: User) => {
  SecurityLogger.logAuthEvent('login_success', user.id, {
    ip: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent')
  })
}

export const handleFailedLogin = async (email: string, error: any) => {
  SecurityLogger.logAuthEvent('login_failed', undefined, {
    email,
    error: error.message,
    ip: request.headers.get('x-forwarded-for')
  })
}
```

### 2. Anomaly Detection
```typescript
// Simple anomaly detection
export class AnomalyDetector {
  private static loginAttempts = new Map<string, number[]>()
  
  static checkLoginAttempts(ip: string): boolean {
    const now = Date.now()
    const attempts = this.loginAttempts.get(ip) || []
    
    // Remove attempts older than 15 minutes
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000)
    
    // Check if too many attempts
    if (recentAttempts.length >= 5) {
      SecurityLogger.logSecurityWarning('Too many login attempts', { ip, attempts: recentAttempts.length })
      return false
    }
    
    // Record this attempt
    recentAttempts.push(now)
    this.loginAttempts.set(ip, recentAttempts)
    
    return true
  }
}
```

## 🔍 Security Testing

### 1. Automated Security Tests
```typescript
// Security test suite
describe('Authentication Security', () => {
  test('should block access without valid session', async () => {
    const response = await request(app)
      .get('/profile')
      .expect(302)  // Redirect to login
  })
  
  test('should validate JWT tokens server-side', async () => {
    // Test with invalid/expired token
    const response = await request(app)
      .get('/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401)
  })
  
  test('should enforce RLS policies', async () => {
    // Test that users can't access other users' data
    const user1Token = await getValidToken('user1')
    const user2Id = 'user2-id'
    
    const response = await request(app)
      .get(`/api/users/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(403)
  })
})
```

### 2. Manual Security Checklist
```typescript
// Security audit checklist
export const SECURITY_CHECKLIST = {
  authentication: [
    '✅ JWT tokens validated server-side',
    '✅ Session data not trusted from client',
    '✅ Proper token expiration handling',
    '✅ Secure cookie configuration'
  ],
  authorization: [
    '✅ RLS policies enabled on all tables',
    '✅ Route protection implemented',
    '✅ Admin routes properly protected',
    '✅ User permissions checked'
  ],
  inputValidation: [
    '✅ Server-side input validation',
    '✅ Input sanitization implemented',
    '✅ SQL injection prevention',
    '✅ XSS prevention'
  ],
  monitoring: [
    '✅ Authentication events logged',
    '✅ Failed login attempts tracked',
    '✅ Anomaly detection active',
    '✅ Security alerts configured'
  ]
}
```

## 🚫 Common Security Vulnerabilities

### 1. Client-Side Trust (Critical)
```typescript
// ❌ VULNERABILITY - Trusting client-side data
export const load = async ({ cookies }) => {
  const sessionCookie = cookies.get('session')
  const user = JSON.parse(sessionCookie)  // NEVER DO THIS
  return { user }
}

// ✅ SECURE - Always validate server-side
export const load = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession()
  return { session, user }
}
```

### 2. Missing RLS Policies
```sql
-- ❌ VULNERABILITY - No RLS policy
CREATE TABLE sensitive_data (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  data TEXT
);
-- Anyone can read all data!

-- ✅ SECURE - Proper RLS policy
CREATE TABLE sensitive_data (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  data TEXT
);

ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own data" ON sensitive_data
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Insecure Redirects
```typescript
// ❌ VULNERABILITY - Open redirect
export const GET = async ({ url }) => {
  const redirectTo = url.searchParams.get('redirectTo')
  throw redirect(303, redirectTo)  // Can redirect anywhere!
}

// ✅ SECURE - Validate redirect URLs
export const GET = async ({ url }) => {
  const redirectTo = url.searchParams.get('redirectTo')
  
  if (redirectTo && isValidRedirectUrl(redirectTo)) {
    throw redirect(303, redirectTo)
  }
  
  throw redirect(303, '/')  // Safe default
}

function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://localhost')
    // Only allow relative URLs or same origin
    return parsed.pathname.startsWith('/') && !parsed.host
  } catch {
    return false
  }
}
```

## 🛠️ Security Configuration

### Production Environment Variables
```bash
# Secure production configuration
NODE_ENV=production
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security headers
SECURE_COOKIES=true
TRUST_PROXY=true
RATE_LIMIT_ENABLED=true
```

### Security Headers
```typescript
// app.html - Security headers
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
```

## 🔗 Next Steps

1. **[OAuth Setup](./04-oauth-setup.md)** - Configure secure OAuth
2. **[Row Level Security](./07-rls-security.md)** - Deep dive into RLS
3. **[Error Handling](./10-error-handling.md)** - Handle security errors

---

Security is not optional - it must be built into every layer of your authentication system from the ground up.