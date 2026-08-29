import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	create_card,
	default_profile,
	display_card,
	type CardProfile,
} from './api.js';

const custom_profile: CardProfile = {
	name: 'Ada Lovelace',
	handle: 'ada',
	work: 'Programmer',
	bluesky: 'https://example.com/bluesky',
	github: 'https://example.com/github',
	linkedin: 'https://example.com/linkedin',
	web: 'https://example.com',
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('create_card', () => {
	it('renders the default profile as plain text', () => {
		const card = create_card(default_profile, { plain: true });

		expect(card).toContain('Scott Spence (@spences10)');
		expect(card).toContain('Product Engineer @ Cloud Lobsters');
		expect(card).not.toContain('╭');
	});

	it('renders a custom profile', () => {
		const card = create_card(custom_profile, { plain: true });

		expect(card).toContain('Ada Lovelace (@ada)');
		expect(card).toContain('Work: Programmer');
		expect(card).toContain('Web: https://example.com');
	});

	it('can render the boxed card without ANSI colors', () => {
		const card = create_card(default_profile, { color: false });

		expect(card).toContain('SCOTT SPENCE');
		expect(card).toContain('╭');
		expect(card).not.toContain('\u001B[');
	});
});

describe('display_card', () => {
	it('writes the rendered card to standard output', () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});

		display_card(custom_profile, { plain: true });

		expect(log).toHaveBeenCalledOnce();
		expect(log).toHaveBeenCalledWith(
			expect.stringContaining('Ada Lovelace'),
		);
	});
});
