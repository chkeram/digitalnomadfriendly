import { redirect } from '@sveltejs/kit'
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