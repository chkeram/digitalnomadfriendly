// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User } from '$lib/types';
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'

declare global {
	namespace App {
		interface Error {
			code?: string;
			id?: string;
		}
		interface Locals {
			user?: User;
			supabase: SupabaseClient<Database>
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
			session: Session | null
		}
		interface PageData {
			user?: User;
			session: Session | null
		}
		// interface PageState {}
		// interface Platform {}
	}
}

// Environment variables
interface ImportMetaEnv {
	readonly PUBLIC_SUPABASE_URL: string;
	readonly PUBLIC_SUPABASE_ANON_KEY: string;
	readonly PUBLIC_GOOGLE_MAPS_API_KEY: string;
	readonly PUBLIC_ANALYTICS_ID?: string;
	readonly PUBLIC_SUPABASE_AUTH_REDIRECT_URL: string;
	readonly SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

export {};
