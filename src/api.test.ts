import { afterEach, describe, expect, it, vi } from 'vitest';
import { display_card } from './api.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('display_card', () => {
	it('writes the card to standard output', () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});

		display_card();

		expect(log).toHaveBeenCalledOnce();
		expect(log).toHaveBeenCalledWith(expect.any(String));
	});
});
