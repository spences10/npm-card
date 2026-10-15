import { describe, expect, it } from 'vitest';
import {
	detect_color_level,
	fg_code,
	palette,
	rgb_to_256,
} from './palette.js';

const tty = { isTTY: true };

describe('detect_color_level', () => {
	it.each([
		[{ NO_COLOR: '1', COLORTERM: 'truecolor' }, tty, 0],
		[{ FORCE_COLOR: '3' }, { isTTY: false }, 3],
		[{ FORCE_COLOR: '0', COLORTERM: 'truecolor' }, tty, 0],
		[{ COLORTERM: 'truecolor' }, { isTTY: false }, 0],
		[{ COLORTERM: 'truecolor' }, tty, 3],
		[{ TERM_PROGRAM: 'WezTerm' }, tty, 3],
		[{ TERM: 'xterm-256color' }, tty, 2],
		[{ TERM: 'xterm' }, tty, 1],
		[{ TERM: 'dumb', COLORTERM: 'truecolor' }, tty, 0],
	] as const)('%o on %o is %i', (env, stream, expected) => {
		expect(detect_color_level(stream, env)).toBe(expected);
	});
});

describe('colour codes', () => {
	it('maps to the xterm 256 palette', () => {
		expect(rgb_to_256([255, 0, 0])).toBe(196);
		expect(rgb_to_256([255, 255, 255])).toBe(231);
		expect(rgb_to_256([128, 128, 128])).toBe(244);
	});

	it('writes foreground codes for each level', () => {
		expect(fg_code(palette.yellow, 3)).toBe('38;2;255;207;51');
		expect(fg_code(palette.yellow, 2)).toMatch(/^38;5;\d+$/);
		expect(fg_code(palette.yellow, 1)).toBe('93');
	});
});
