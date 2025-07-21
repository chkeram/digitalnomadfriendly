# Authentication Flow Overview

Understanding the complete authentication flow in our Digital Nomad Friendly application.

## 🎯 Learning Objectives
- Understand OAuth 2.0 authentication flow
- Learn how Supabase Auth integrates with Google OAuth
- Comprehend server-side session management
- Grasp user profile synchronization

## 📋 Authentication Architecture

### High-Level Flow
```
┌─────────────┐    OAuth     ┌─────────────┐    JWT      ┌─────────────┐
│    User     │──────────────▶│   Google    │─────────────▶│  Supabase   │
│   Browser   │              │   OAuth     │             │    Auth     │
└─────────────┘              └─────────────┘             └─────────────┘
       │                            │                           │
       │                            │                           │
       ▼                            ▼                           ▼
┌─────────────┐    Profile    ┌─────────────┐   Session   ┌─────────────┐
│ Application │──────────────▶│  Database   │─────────────▶│   Server    │
│   Server    │              │    Users    │             │   Hooks     │
└─────────────┘              └─────────────┘             └─────────────┘
```

### Step-by-Step Process

#### 1. User Initiates Login
```typescript
// User clicks "Sign in with Google"
// Triggers: /auth/login (POST action)
export const actions: Actions = {
  google: async ({ locals, url }) => {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback'
      }
    })
    // Redirects to Google OAuth
  }
}
```

#### 2. Google OAuth Flow
```
User Browser → Google OAuth → User Consent → Authorization Code
```

#### 3. OAuth Callback Processing
```typescript
// Google redirects to: /auth/callback?code=xyz
export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code')
  
  // Exchange code for session
  const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code)
  
  // Validate the session
  const { data: userData } = await locals.supabase.auth.getUser()
  
  // Create/update user profile
  const dbUser = await upsertUserProfile(userData.user, locals.supabase)
}
```

#### 4. Session Management
```typescript
// hooks.server.ts - Runs on every request
export const handle: Handle = sequence(supabase, authGuard)

const supabase: Handle = async ({ event, resolve }) => {
  // Create Supabase client with cookies
  event.locals.supabase = createServerClient(...)
  
  // Validate session securely
  event.locals.safeGetSession = async () => {
    const { data: { user } } = await event.locals.supabase.auth.getUser()
    // Only trust server-validated user data
  }
}
```

#### 5. User Profile Creation
```typescript
// Automatically create user profile in database
export async function upsertUserProfile(supabaseUser, supabaseClient) {
  const userData = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.user_metadata?.full_name,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    last_login_at: new Date().toISOString()
  }
  
  const { data, error } = await supabaseClient
    .from('users')
    .upsert(userData)
    .select()
    .single()
}
```

## 🔐 Security Layers

### 1. OAuth Security
- **Authorization Code Flow**: Most secure OAuth flow
- **State Parameter**: CSRF protection (handled by Supabase)
- **Secure Redirects**: Validated redirect URLs

### 2. JWT Token Security
- **Server Validation**: Always validate tokens server-side
- **Token Expiration**: Automatic token refresh
- **Secure Storage**: HTTP-only cookies

### 3. Database Security
- **Row Level Security (RLS)**: Users can only access their own data
- **Authenticated Operations**: All operations require valid auth context
- **Input Validation**: Sanitize all user inputs

## 📊 Session Lifecycle

### Session Creation
```typescript
// After successful OAuth callback
1. Exchange authorization code for JWT
2. Validate JWT with getUser()
3. Create/update user profile in database
4. Set secure session cookies
5. Redirect to intended destination
```

### Session Validation
```typescript
// On every protected route request
1. Extract session from cookies
2. Validate JWT with Supabase auth.getUser()
3. Set user context in locals
4. Proceed with request or redirect to login
```

### Session Termination
```typescript
// User logout
1. Call supabase.auth.signOut()
2. Clear session cookies
3. Redirect to public page
```

## 🎭 Client vs Server State

### Server State (Source of Truth)
```typescript
// hooks.server.ts
event.locals.session = validatedSession
event.locals.user = validatedUser

// Available in:
// - Load functions
// - Server actions
// - Server routes
```

### Client State (Reactive UI)
```typescript
// auth.ts stores
export const session = writable<Session | null>(null)
export const user = writable<User | null>(null)

// Synchronized from server
initializeAuth(serverSession, serverUser)
```

## 🔄 State Synchronization

### Server to Client
```typescript
// +layout.server.ts
export const load: LayoutServerLoad = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession()
  return { session, user }
}

// +layout.svelte
export let data: LayoutData
onMount(() => {
  initializeAuth(data.session, data.user)
})
```

### Client Updates
```typescript
// Auth state changes (login/logout)
supabase.auth.onAuthStateChange(async (event) => {
  // Validate with getUser() for security
  const { data: userData } = await supabase.auth.getUser()
  user.set(userData.user ? mapUser(userData.user) : null)
})
```

## 🚨 Error Handling

### Common Error Scenarios
```typescript
// OAuth callback errors
if (error) {
  console.error('OAuth callback error:', error)
  throw redirect(303, '/auth/login?error=Authentication failed')
}

// User validation errors  
if (userError || !userData.user) {
  console.error('User verification failed:', userError)
  throw redirect(303, '/auth/login?error=Authentication verification failed')
}

// Profile sync errors
if (!dbUser) {
  console.log('⚠️ User profile sync failed, but authentication successful')
  // Continue with auth but show sync warning
}
```

## 📈 Performance Considerations

### Optimization Strategies
1. **Session Caching**: Cache validated sessions briefly
2. **Lazy Loading**: Only load user data when needed
3. **Efficient Queries**: Use select() to limit data transfer
4. **Connection Reuse**: Reuse Supabase client instances

### Monitoring Points
- Authentication success/failure rates
- Profile sync success rates
- Session validation performance
- Database query performance

## 🧪 Testing the Flow

### Manual Testing
1. **Login Flow**: Test complete OAuth flow
2. **Profile Creation**: Verify user profile is created
3. **Session Persistence**: Refresh page, verify still logged in
4. **Logout Flow**: Test complete logout process

### Automated Testing
```typescript
// Test authentication endpoints
test('OAuth callback creates user profile', async () => {
  // Mock OAuth callback
  // Verify user profile creation
  // Check session establishment
})
```

## 🔗 Key Files to Study

1. **`src/hooks.server.ts`** - Session management and validation
2. **`src/routes/auth/callback/+server.ts`** - OAuth callback handling
3. **`src/lib/services/users.ts`** - User profile operations
4. **`src/lib/stores/auth.ts`** - Client-side auth state
5. **`src/routes/+layout.server.ts`** - Server-client state sync

## 📚 Next Steps

1. **[Supabase Auth Integration](./02-supabase-auth.md)** - Deep dive into Supabase Auth
2. **[Security Best Practices](./03-security-practices.md)** - Learn security implementation
3. **[OAuth Setup](./04-oauth-setup.md)** - Configure Google OAuth

---

Understanding this flow is crucial for implementing secure authentication. Each component has a specific role in maintaining security while providing a smooth user experience.