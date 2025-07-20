import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Database } from '$lib/types/database'

const supabase: Handle = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this request.
	 * 
	 * The client is configured to:
	 * - Handle cookies for session persistence
	 * - Work with SvelteKit's server-side rendering
	 * - Automatically refresh tokens when needed
	 */
	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				/**
				 * SvelteKit's cookies have a `set` method that allows setting a single cookie.
				 * The `setAll` method is a custom method that sets multiple cookies.
				 */
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { 
							...options, 
							path: '/',
							httpOnly: true,
							secure: event.url.protocol === 'https:',
							sameSite: 'lax'
						})
					})
				}
			}
		}
	)

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the JWT.
	 * 
	 * This provides better security by ensuring the session is still valid.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session },
			error: sessionError
		} = await event.locals.supabase.auth.getSession()

		if (!session || sessionError) {
			return { session: null, user: null }
		}

		const {
			data: { user },
			error: userError
		} = await event.locals.supabase.auth.getUser()

		if (userError || !user) {
			// JWT validation failed or user not found
			return { session: null, user: null }
		}

		// Map Supabase user to our User type
		const mappedUser = {
			id: user.id,
			email: user.email || '',
			name: user.user_metadata?.full_name || user.user_metadata?.name || '',
			avatar_url: user.user_metadata?.avatar_url || '',
			created_at: user.created_at || new Date().toISOString(),
			updated_at: user.updated_at || new Date().toISOString(),
			last_login_at: user.last_sign_in_at || undefined,
			noise_tolerance: undefined,
			wifi_importance: undefined,
			preferred_seating: undefined,
			work_style: undefined,
			total_reviews: 0,
			total_venues_visited: 0,
			is_verified: false,
			verification_date: undefined,
			deleted_at: undefined
		}

		return { session, user: mappedUser }
	}

	// Set session and user in locals for use in load functions and pages
	const { session, user } = await event.locals.safeGetSession()
	event.locals.session = session
	event.locals.user = user

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version'
		}
	})
}

const authGuard: Handle = async ({ event, resolve }) => {
	// Protected routes that require authentication
	const protectedPaths = [
		'/profile',
		'/favorites',
		'/reviews',
		'/venues/new',
		'/venues/edit'
	]

	// Check if current path requires authentication
	const requiresAuth = protectedPaths.some(path => 
		event.url.pathname.startsWith(path)
	)

	if (requiresAuth && !event.locals.session) {
		// Store the intended destination for redirect after login
		const redirectTo = event.url.pathname + event.url.search
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`)
	}

	return resolve(event)
}

// Combine all hooks in sequence
export const handle: Handle = sequence(supabase, authGuard)