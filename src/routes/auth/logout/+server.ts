import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals }) => {
	const { error } = await locals.supabase.auth.signOut()
	
	if (error) {
		console.error('❌ Logout error:', error)
	} else {
		console.log('✅ User logged out successfully')
	}
	
	// Always redirect to home, even if logout had an error
	throw redirect(303, '/')
}