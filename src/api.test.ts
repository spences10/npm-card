import { EventEmitter } from 'node:events';
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
	role: 'Programmer',
	links: [
		{ label: 'web', url: 'https://example.com' },
		{ label: 'github', url: 'https://example.com/github' },
	],
};

const ESC = '\u001B';

class FakeOutput extends EventEmitter {
	chunks: string[] = [];
	constructor(
		readonly isTTY: boolean,
		readonly columns = 100,
		readonly rows = 40,
	) {
		super();
	}
	write(chunk: string) {
		this.chunks.push(chunk);
		return true;
	}
	get text() {
		return this.chunks.join('');
	}
}

class FakeInput extends EventEmitter {
	readonly isTTY = true;
	raw: boolean[] = [];
	setRawMode(mode: boolean) {
		this.raw.push(mode);
		return this;
	}
	resume() {
		return this;
	}
	pause() {
		return this;
	}
}

const as_output = (output: FakeOutput) =>
	output as unknown as NodeJS.WriteStream;
const as_input = (input: FakeInput) =>
	input as unknown as NodeJS.ReadStream;

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('create_card', () => {
	it('renders the default profile as plain text', () => {
		const card = create_card(default_profile, { plain: true });

		expect(card).toContain('Scott Spence (@spences10)');
		expect(card).toContain('Product Engineer & Engineering Lead');
		expect(card).toContain('web: https://scottspence.com');
		expect(card).not.toContain('┏');
	});

	it('renders a custom profile without colour', () => {
		const card = create_card(custom_profile, {
			color: false,
			columns: 100,
		});

		expect(card).toContain('@ada');
		expect(card).toContain('Programmer');
		expect(card).toContain('example.com/github');
		expect(card).toContain('┏');
		expect(card).not.toContain(ESC);
	});

	it('uses truecolor and clickable links at level 3', () => {
		const card = create_card(default_profile, {
			color: 3,
			columns: 100,
		});

		expect(card).toContain('38;2;255;207;51');
		expect(card).toContain(`${ESC}]8;;https://scottspence.com`);
	});

	it('falls back to the 256 colour palette at level 2', () => {
		const card = create_card(default_profile, {
			color: 2,
			columns: 100,
		});

		expect(card).toContain('38;5;');
		expect(card).not.toContain('38;2;');
	});

	it.each([
		[100, 'full', '[SVELTE AMBASSADOR]'],
		[70, 'compact', '@spences10 · Product Engineer'],
		[40, 'plain', 'web: https://scottspence.com'],
	])(
		'picks a layout for %i columns (%s)',
		(columns, kind, expected) => {
			const card = create_card(default_profile, {
				color: false,
				columns,
			});

			expect(card).toContain(expected);
			// plain text wraps however the terminal likes; cards must fit
			if (kind === 'plain') return;
			for (const line of card.split('\n')) {
				expect(Array.from(line).length).toBeLessThanOrEqual(columns);
			}
		},
	);

	it('honours an explicit layout', () => {
		const card = create_card(default_profile, {
			color: false,
			layout: 'compact',
			columns: 200,
		});

		expect(card).toContain('@spences10 · Product Engineer');
		expect(card).not.toContain('[SVELTE AMBASSADOR]');
	});
});

describe('display_card', () => {
	it('writes the plain card', async () => {
		const output = new FakeOutput(false);

		await display_card(custom_profile, {
			plain: true,
			output: as_output(output),
		});

		expect(output.text).toContain('Ada Lovelace (@ada)');
	});

	it('prints a static card when output is not a terminal', async () => {
		const output = new FakeOutput(false);

		await display_card(default_profile, {
			output: as_output(output),
		});

		expect(output.text).toContain('@spences10');
		expect(output.text).not.toContain(`${ESC}[?25l`);
	});

	it('prints a static card with --no-animation', async () => {
		vi.stubEnv('CI', '');
		const output = new FakeOutput(true);

		await display_card(default_profile, {
			color: 3,
			animate: false,
			output: as_output(output),
		});

		expect(output.text).toContain('@spences10');
		expect(output.text).not.toContain(`${ESC}[?25l`);
	});

	it('animates in a terminal and skips to the end on a key', async () => {
		vi.stubEnv('CI', '');
		vi.stubEnv('TERM', 'xterm-256color');
		const output = new FakeOutput(true, 100, 40);
		const input = new FakeInput();

		const done = display_card(default_profile, {
			color: 3,
			seed: 1,
			output: as_output(output),
			input: as_input(input),
		});
		input.emit('data', Buffer.from('x'));
		await done;

		expect(output.text).toContain(`${ESC}[?25l`);
		expect(output.text.endsWith(`${ESC}[?25h`)).toBe(true);
		expect(output.text).toContain('ss10.dev/bluesky');
		expect(input.raw).toEqual([true, false]);
		expect(input.listenerCount('data')).toBe(0);
		expect(output.listenerCount('resize')).toBe(0);
	});

	it('animates the compact card in a short terminal', async () => {
		vi.stubEnv('CI', '');
		const output = new FakeOutput(true, 100, 14);
		const input = new FakeInput();

		const done = display_card(default_profile, {
			color: 3,
			output: as_output(output),
			input: as_input(input),
		});
		output.emit('resize');
		await done;

		expect(output.text).toContain(`${ESC}[?25l`);
		expect(output.text).toContain('@spences10');
		expect(output.text).not.toContain('SVELTE AMBASSADOR');
	});

	it('does not animate in CI', async () => {
		vi.stubEnv('CI', 'true');
		const output = new FakeOutput(true);

		await display_card(default_profile, {
			color: 3,
			output: as_output(output),
		});

		expect(output.text).not.toContain(`${ESC}[?25l`);
	});
});
