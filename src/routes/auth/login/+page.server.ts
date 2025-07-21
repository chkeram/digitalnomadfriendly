import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
	google: async ({ locals, url }) => {
		// Get redirect destination from URL params or default to home
		const redirectTo = url.searchParams.get('redirectTo') ?? '/'
		const callbackUrl = `${url.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
		
		console.log('🔵 Initiating Google OAuth with callback:', callbackUrl)
		
		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: callbackUrl
			}
		})

		if (error) {
			console.error('❌ OAuth sign-in error:', error)
			return fail(500, {
				message: 'Authentication failed. Please try again.'
			})
		}

		if (!data.url) {
			console.error('❌ No OAuth URL returned from Supabase')
			return fail(500, {
				message: 'Authentication setup failed. Please try again.'
			})
		}

		console.log('✅ Redirecting to OAuth provider:', data.url)
		// Redirect to OAuth provider
		throw redirect(303, data.url)
	}
}