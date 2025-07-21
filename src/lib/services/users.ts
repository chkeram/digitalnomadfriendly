/**
 * User Service - Database operations for user management
 * 
 * Handles user profile creation, updates, and synchronization between
 * Supabase Auth and our application database.
 */

import type { User } from '$lib/types/database'
import type { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'

/**
 * Create or update user profile in database from Supabase Auth user
 */
export async function upsertUserProfile(
	supabaseUser: SupabaseUser, 
	supabaseClient: SupabaseClient<Database>
): Promise<User | null> {
	try {
		console.log('🔄 Attempting to upsert user profile for:', supabaseUser.email)
		
		// Map Supabase user to our database User format
		const userData = {
			id: supabaseUser.id,
			email: supabaseUser.email || '',
			name: supabaseUser.user_metadata?.full_name || 
				  supabaseUser.user_metadata?.name || '',
			avatar_url: supabaseUser.user_metadata?.avatar_url || '',
			last_login_at: new Date().toISOString(),
			// Keep existing user preferences if they exist, otherwise use defaults
			updated_at: new Date().toISOString()
		}

		console.log('📝 User data to upsert:', userData)

		// Test if we can access the users table at all
		console.log('🔍 Testing users table access...')
		const { data: tableTest, error: tableError } = await supabaseClient
			.from('users')
			.select('id')
			.limit(1)
		
		if (tableError) {
			console.error('❌ Cannot access users table:', tableError)
		} else {
			console.log('✅ Users table accessible')
		}

		const { data, error } = await supabaseClient
			.from('users')
			.upsert(userData, { 
				onConflict: 'id',
				ignoreDuplicates: false 
			})
			.select()
			.single()

		if (error) {
			console.error('❌ Error upserting user profile:', error)
			console.error('❌ Error details:', JSON.stringify(error, null, 2))
			return null
		}

		console.log('✅ User profile upserted successfully:', data.email)
		return data
	} catch (error) {
		console.error('❌ Unexpected error in upsertUserProfile:', error)
		return null
	}
}

/**
 * Get user profile from database by ID
 */
export async function getUserProfile(
	userId: string, 
	supabaseClient: SupabaseClient<Database>
): Promise<User | null> {
	try {
		const { data, error } = await supabaseClient
			.from('users')
			.select('*')
			.eq('id', userId)
			.is('deleted_at', null)
			.single()

		if (error) {
			if (error.code === 'PGRST116') {
				// User not found - this is normal for first-time users
				return null
			}
			console.error('❌ Error fetching user profile:', error)
			return null
		}

		return data
	} catch (error) {
		console.error('❌ Unexpected error in getUserProfile:', error)
		return null
	}
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
	userId: string, 
	preferences: {
		noise_tolerance?: number
		wifi_importance?: number
		preferred_seating?: 'quiet' | 'social' | 'outdoor' | 'any'
		work_style?: 'focused' | 'collaborative' | 'mixed'
	},
	supabaseClient: SupabaseClient<Database>
): Promise<boolean> {
	try {
		const { error } = await supabaseClient
			.from('users')
			.update({
				...preferences,
				updated_at: new Date().toISOString()
			})
			.eq('id', userId)

		if (error) {
			console.error('❌ Error updating user preferences:', error)
			return false
		}

		console.log('✅ User preferences updated')
		return true
	} catch (error) {
		console.error('❌ Unexpected error in updateUserPreferences:', error)
		return false
	}
}

/**
 * Update user profile (name, avatar, etc.)
 */
export async function updateUserProfile(
	userId: string,
	updates: {
		name?: string
		avatar_url?: string
	},
	supabaseClient: SupabaseClient<Database>
): Promise<boolean> {
	try {
		const { error } = await supabaseClient
			.from('users')
			.update({
				...updates,
				updated_at: new Date().toISOString()
			})
			.eq('id', userId)

		if (error) {
			console.error('❌ Error updating user profile:', error)
			return false
		}

		console.log('✅ User profile updated')
		return true
	} catch (error) {
		console.error('❌ Unexpected error in updateUserProfile:', error)
		return false
	}
}

/**
 * Get user statistics (reviews, venues visited, etc.)
 */
export async function getUserStats(
	userId: string,
	supabaseClient: SupabaseClient<Database>
): Promise<{
	total_reviews: number
	total_venues_visited: number
	favorite_venues: number
} | null> {
	try {
		// Get review count
		const { count: reviewCount } = await supabaseClient
			.from('reviews')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId)
			.is('deleted_at', null)

		// Get venue visit count (unique venues)
		const { data: venueVisits } = await supabaseClient
			.from('venue_visits')
			.select('venue_id')
			.eq('user_id', userId)

		const uniqueVenues = new Set(venueVisits?.map(visit => visit.venue_id) || [])

		// Get favorites count
		const { count: favoritesCount } = await supabaseClient
			.from('favorites')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId)

		return {
			total_reviews: reviewCount || 0,
			total_venues_visited: uniqueVenues.size,
			favorite_venues: favoritesCount || 0
		}
	} catch (error) {
		console.error('❌ Error getting user stats:', error)
		return null
	}
}

/**
 * Sync user stats to user table (for performance)
 */
export async function syncUserStats(
	userId: string, 
	supabaseClient: SupabaseClient<Database>
): Promise<void> {
	try {
		const stats = await getUserStats(userId, supabaseClient)
		if (!stats) return

		await supabaseClient
			.from('users')
			.update({
				total_reviews: stats.total_reviews,
				total_venues_visited: stats.total_venues_visited,
				updated_at: new Date().toISOString()
			})
			.eq('id', userId)

		console.log('✅ User stats synced')
	} catch (error) {
		console.error('❌ Error syncing user stats:', error)
	}
}