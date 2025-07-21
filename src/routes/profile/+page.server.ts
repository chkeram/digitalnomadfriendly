import { fail } from '@sveltejs/kit'
import { getUserProfile, getUserStats, updateUserPreferences } from '$lib/services/users'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession()
	
	if (!session || !user) {
		// This will be handled by the auth guard in hooks.server.ts
		return {
			session: null,
			user: null,
			dbUser: null,
			userStats: null
		}
	}

	// Get user profile from database
	const dbUser = await getUserProfile(user.id, locals.supabase)
	
	// Get user statistics
	const userStats = await getUserStats(user.id, locals.supabase)

	return {
		session,
		user,
		dbUser,
		userStats
	}
}

export const actions: Actions = {
	updatePreferences: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession()
		
		if (!session || !user) {
			return fail(401, { error: 'Unauthorized' })
		}

		const formData = await request.formData()
		const preferences = {
			noise_tolerance: parseInt(formData.get('noise_tolerance') as string),
			wifi_importance: parseInt(formData.get('wifi_importance') as string),
			preferred_seating: formData.get('preferred_seating') as 'quiet' | 'social' | 'outdoor' | 'any',
			work_style: formData.get('work_style') as 'focused' | 'collaborative' | 'mixed'
		}

		// Validate preferences
		if (preferences.noise_tolerance < 1 || preferences.noise_tolerance > 5 ||
			preferences.wifi_importance < 1 || preferences.wifi_importance > 5) {
			return fail(400, { error: 'Invalid preference values' })
		}

		const success = await updateUserPreferences(user.id, preferences, locals.supabase)
		
		if (!success) {
			return fail(500, { error: 'Failed to update preferences' })
		}

		return { success: true }
	}
}