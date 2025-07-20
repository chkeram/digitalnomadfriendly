import { writable, derived, readable } from 'svelte/store'
import { browser } from '$app/environment'
import { supabase } from '$lib/supabase'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '$lib/types'

/**
 * Session store - tracks the current Supabase session
 */
export const session = writable<Session | null>(null)

/**
 * User store - tracks the current authenticated user
 */
export const user = writable<User | null>(null)

/**
 * Loading state for auth operations
 */
export const authLoading = writable<boolean>(false)

/**
 * Authentication error state
 */
export const authError = writable<string | null>(null)

/**
 * Derived store - true if user is authenticated
 */
export const isAuthenticated = derived(
	[session, user],
	([$session, $user]) => Boolean($session && $user)
)

/**
 * Derived store - user's display name (name or email)
 */
export const userDisplayName = derived(
	user,
	($user) => $user?.name || $user?.email || 'User'
)

/**
 * Maps Supabase user to our application User type
 */
function mapSupabaseUser(supabaseUser: SupabaseUser): User {
	return {
		id: supabaseUser.id,
		email: supabaseUser.email || '',
		name: supabaseUser.user_metadata?.full_name || 
			  supabaseUser.user_metadata?.name || '',
		avatar_url: supabaseUser.user_metadata?.avatar_url || '',
		created_at: supabaseUser.created_at || new Date().toISOString(),
		updated_at: supabaseUser.updated_at || new Date().toISOString(),
		last_login_at: supabaseUser.last_sign_in_at || undefined,
		
		// Default user preferences (can be updated later)
		noise_tolerance: undefined,
		wifi_importance: undefined,
		preferred_seating: undefined,
		work_style: undefined,
		
		// Default activity tracking
		total_reviews: 0,
		total_venues_visited: 0,
		is_verified: false,
		verification_date: undefined,
		deleted_at: undefined
	}
}

/**
 * Initialize auth state from session (client-side only)
 */
export function initializeAuth(initialSession: Session | null, initialUser: User | null) {
	// Set initial state from server
	session.set(initialSession)
	user.set(initialUser)

	// Only set up client-side auth listener in browser
	if (browser) {
		// Listen for auth state changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, newSession) => {
				console.log('🔄 Auth state change:', event, newSession?.user?.email)
				
				session.set(newSession)
				authError.set(null)

				if (newSession?.user) {
					// Map Supabase user to our User type
					const mappedUser = mapSupabaseUser(newSession.user)
					user.set(mappedUser)
				} else {
					user.set(null)
				}
			}
		)

		// Return cleanup function
		return () => {
			subscription.unsubscribe()
		}
	}
}

/**
 * Sign out the current user
 */
export async function signOut() {
	authLoading.set(true)
	authError.set(null)

	try {
		const { error } = await supabase.auth.signOut()
		
		if (error) {
			console.error('❌ Sign out error:', error)
			authError.set('Failed to sign out. Please try again.')
		} else {
			console.log('✅ User signed out successfully')
			// State will be updated automatically by auth state change listener
		}
	} catch (error) {
		console.error('❌ Unexpected sign out error:', error)
		authError.set('An unexpected error occurred. Please try again.')
	} finally {
		authLoading.set(false)
	}
}

/**
 * Clear any auth errors
 */
export function clearAuthError() {
	authError.set(null)
}

/**
 * Get current session (client-side helper)
 */
export async function getCurrentSession() {
	if (!browser) return null
	
	const { data: { session: currentSession } } = await supabase.auth.getSession()
	return currentSession
}

/**
 * Get current user (client-side helper)
 */
export async function getCurrentUser() {
	if (!browser) return null
	
	const { data: { user: currentUser } } = await supabase.auth.getUser()
	return currentUser ? mapSupabaseUser(currentUser) : null
}