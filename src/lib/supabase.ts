import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import type { Database } from './types/database'

export const supabase = createBrowserClient<Database>(
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	{
		auth: {
			// Optional: Configure shorter session duration (default is 1 hour)
			// autoRefreshToken: true,
			// persistSession: true,
			// detectSessionInUrl: true
		}
	}
)

// Server-side client (for hooks and server routes)
export function createSupabaseServerClient(fetch: typeof globalThis.fetch) {
	return createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			global: { fetch },
			cookies: {
				getAll: () => [],
				setAll: () => {}
			}
		}
	)
}

// Admin client for server-side operations (uses service role key)
export function createSupabaseAdminClient() {
	if (isBrowser()) {
		throw new Error('Admin client should only be used on the server')
	}
	
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!serviceRoleKey) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
	}
	
	return createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		serviceRoleKey,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false
			},
			cookies: {
				getAll: () => [],
				setAll: () => {}
			}
		}
	)
}

// Type exports
export type SupabaseClient = typeof supabase
export type { Database } from './types/database'