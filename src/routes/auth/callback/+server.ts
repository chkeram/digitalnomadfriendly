import { redirect } from '@sveltejs/kit'
import { upsertUserProfile } from '$lib/services/users'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code')
	const next = url.searchParams.get('redirectTo') ?? '/'

	if (code) {
		// Exchange the OAuth code for a session
		const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code)
		
		if (!error && data.session) {
			// Verify the session is valid by calling getUser()
			const { data: userData, error: userError } = await locals.supabase.auth.getUser()
			
			if (!userError && userData.user) {
				console.log('✅ User authenticated successfully:', userData.user.email)
				console.log('🔍 User data from auth:', {
					id: userData.user.id,
					email: userData.user.email,
					metadata: userData.user.user_metadata
				})
				
				// Test database connection first
				console.log('🔍 Testing database connection...')
				const { data: testData, error: testError } = await locals.supabase
					.from('users')
					.select('count')
					.limit(1)
				
				if (testError) {
					console.error('❌ Database connection test failed:', testError)
				} else {
					console.log('✅ Database connection successful')
				}
				
				// Create or update user profile in database
				console.log('🔄 Attempting to sync user profile...')
				const dbUser = await upsertUserProfile(userData.user, locals.supabase)
				if (dbUser) {
					console.log('✅ User profile synced to database successfully')
					console.log('📝 Created/updated user:', dbUser)
				} else {
					console.log('⚠️ User profile sync failed, but authentication successful')
				}
				
				// Success - redirect to intended destination
				throw redirect(303, next)
			} else {
				console.error('❌ User verification failed:', userError)
				throw redirect(303, '/auth/login?error=Authentication verification failed')
			}
		}
		
		// Authentication failed
		console.error('❌ OAuth callback error:', error)
		throw redirect(303, '/auth/login?error=Authentication failed')
	}

	// No code parameter - invalid callback
	console.error('❌ No authorization code in callback')
	throw redirect(303, '/auth/login?error=Invalid callback')
}