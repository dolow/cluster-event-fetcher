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

	interface EventSummary {
		name: string;
		thumbnailUrl: string;
		reservation: {
			openDatetime: string;
			closeDatetime: string;
		};
		owner: {
			username: string;
			displayName: string;
			photoUrl: string;
		}
	}
	interface UserEventSummaries {
		[username: string]: {
			eventSummaries: EventSummary[];
			owner: {
				username: string;
				displayName: string;
				photoUrl: string;
			}
		}
	}
}

export {};
