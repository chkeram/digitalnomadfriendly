/**
 * Authentication Service
 * 
 * Minimal wrapper around Supabase auth for client-side operations.
 * Server-side auth operations should use hooks.server.ts directly.
 */

import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { supabase } from '$lib/supabase'
import { authLoading, authError, getCurrentSession, getCurrentUser } from '$lib/stores/auth'

/**
 * Redirect to login page with optional return destination
 */
export function redirectToLogin(returnTo?: string) {
	if (!browser) return
	
	const loginUrl = returnTo 
		? `/auth/login?redirectTo=${encodeURIComponent(returnTo)}`
		: '/auth/login'
	
	goto(loginUrl)
}

/**
 * Redirect to home page
 */
export function redirectToHome() {
	if (!browser) return
	goto('/')
}

/**
 * Check if user has required authentication for a given path
 */
export function requiresAuth(pathname: string): boolean {
	const protectedPaths = [
		'/profile',
		'/favorites', 
		'/reviews',
		'/venues/new',
		'/venues/edit'
	]
	
	return protectedPaths.some(path => pathname.startsWith(path))
}

/**
 * Client-side auth guard - redirects to login if not authenticated
 */
export async function clientAuthGuard(pathname: string) {
	if (!browser || !requiresAuth(pathname)) return
	
	const session = await getCurrentSession()
	
	if (!session) {
		redirectToLogin(pathname)
		return false
	}
	
	return true
}

/**
 * Refresh current session (useful for periodic checks)
 */
export async function refreshSession() {
	if (!browser) return null
	
	authLoading.set(true)
	authError.set(null)
	
	try {
		const { data, error } = await supabase.auth.refreshSession()
		
		if (error) {
			console.error('❌ Session refresh error:', error)
			authError.set('Session expired. Please sign in again.')
			return null
		}
		
		return data.session
	} catch (error) {
		console.error('❌ Unexpected session refresh error:', error)
		authError.set('Unable to refresh session. Please sign in again.')
		return null
	} finally {
		authLoading.set(false)
	}
}

/**
 * Get user profile data (combines auth + database user info)
 */
export async function getUserProfile() {
	if (!browser) return null
	
	const user = await getCurrentUser()
	if (!user) return null
	
	// TODO: Fetch additional user profile data from database
	// This will be implemented in Step 7 (User profile integration)
	
	return user
}

/**
 * Utility to check authentication status
 */
export async function checkAuthStatus() {
	if (!browser) return { isAuthenticated: false, user: null, session: null }
	
	const session = await getCurrentSession()
	const user = await getCurrentUser()
	
	return {
		isAuthenticated: Boolean(session && user),
		user,
		session
	}
}