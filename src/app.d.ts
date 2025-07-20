// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User } from '$lib/types';

declare global {
	namespace App {
		interface Error {
			code?: string;
			id?: string;
		}
		interface Locals {
			user?: User;
		}
		interface PageData {
			user?: User;
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
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

export {};
