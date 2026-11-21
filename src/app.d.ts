// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	const Bun: {
		password: {
			hash(password: string, options?: unknown): Promise<string>;
			verify(password: string, hash: string): Promise<boolean>;
		};
	};

	interface ImportMeta {
		main?: boolean;
	}
}

export {};
