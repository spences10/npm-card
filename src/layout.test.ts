import { describe, expect, it } from 'vitest';
import { create_animation, final_frame } from './animation.js';
import { build_scene, choose_scene, footprint } from './layout.js';
import { default_profile, type CardProfile } from './profile.js';

const profile_named = (name: string): CardProfile => ({
	...default_profile,
	name,
});

describe('layouts', () => {
	it('fits the full card in an 80x24 terminal', () => {
		const size = footprint(build_scene(default_profile, 'full'));

		expect(size.columns).toBeLessThanOrEqual(80);
		expect(size.rows).toBeLessThanOrEqual(24);
	});

	it('keeps the compact card to 12 rows', () => {
		const size = footprint(build_scene(default_profile, 'compact'));

		expect(size.columns).toBeLessThanOrEqual(64);
		expect(size.rows).toBeLessThanOrEqual(12);
	});

	it.each([
		[{ columns: 120, rows: 40 }, 'full'],
		[{ columns: 120, rows: 20 }, 'compact'],
		[{ columns: 70 }, 'compact'],
		[{ columns: 120, rows: 8 }, undefined],
		[{ columns: 40 }, undefined],
	] as const)('chooses for %o', (space, expected) => {
		expect(choose_scene(default_profile, space)?.kind).toBe(expected);
	});

	it('keeps long names inside the card', () => {
		for (const kind of ['full', 'compact'] as const) {
			const scene = build_scene(
				profile_named('Bartholomew Montgomery-Fitzgerald'),
				kind,
			);
			for (const pixel of scene.pixels) {
				expect(pixel.x).toBeLessThan(scene.width - 1);
			}
			for (const run of scene.texts) {
				expect(run.col + Array.from(run.text).length).toBeLessThan(
					scene.width,
				);
			}
		}
	});

	it('writes names the pixel font cannot set as text', () => {
		const scene = build_scene(profile_named('Zoë Ünal'), 'full');

		expect(scene.pixels).toHaveLength(0);
		expect(scene.texts[0]?.text).toBe('ZOË ÜNAL');
	});
});

describe('animation', () => {
	const scene = build_scene(default_profile, 'full');

	it('gives the same frames for the same seed', () => {
		const a = create_animation(scene, { seed: 42 });
		const b = create_animation(scene, { seed: 42 });

		expect(a.frame(600)).toEqual(b.frame(600));
	});

	it('ends on the final frame', () => {
		const animation = create_animation(scene, { seed: 42 });

		expect(animation.frame(Infinity)).toEqual(final_frame(scene));
		expect(animation.frame(400)).not.toEqual(final_frame(scene));
	});

	it('keeps every frame the size of the card and its shadow', () => {
		const animation = create_animation(scene, { seed: 3 });
		for (let t = 0; t <= animation.duration; t += 100) {
			const frame = animation.frame(t);
			expect(frame).toHaveLength(scene.height + 1);
			for (const row of frame) {
				expect(row).toHaveLength(scene.width + 1);
				for (const cell of row) {
					expect(Array.from(cell.ch)).toHaveLength(1);
				}
			}
		}
	});
});
