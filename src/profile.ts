export interface CardLink {
	readonly label: string;
	readonly url: string;
	/** Shown instead of the URL. Defaults to the URL without its scheme. */
	readonly text?: string;
}

export interface CardProfile {
	readonly name: string;
	readonly handle: string;
	readonly role: string;
	readonly pitch?: string;
	readonly tags?: readonly string[];
	readonly links: readonly CardLink[];
}

export const default_profile: CardProfile = {
	name: 'Scott Spence',
	handle: 'spences10',
	role: 'Product Engineer & Engineering Lead',
	pitch:
		'I ship production AI, workflow products and SvelteKit systems.',
	tags: ['Svelte Ambassador', 'Svelte Society London'],
	links: [
		{ label: 'web', url: 'https://scottspence.com' },
		{ label: 'github', url: 'https://ss10.dev/git' },
		{ label: 'bluesky', url: 'https://ss10.dev/bluesky' },
		{ label: 'linkedin', url: 'https://ss10.dev/li' },
	],
};

export function link_text(link: CardLink): string {
	return link.text ?? link.url.replace(/^[a-z]+:\/\//i, '');
}
