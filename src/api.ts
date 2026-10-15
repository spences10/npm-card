import { create_animation, final_frame } from './animation.js';
import {
	build_scene,
	choose_scene,
	footprint,
	type LayoutKind,
	type Scene,
} from './layout.js';
import { detect_color_level, type ColorLevel } from './palette.js';
import {
	default_profile,
	type CardLink,
	type CardProfile,
} from './profile.js';
import { play, serialize } from './terminal.js';

export { default_profile };
export type { CardLink, CardProfile, ColorLevel, LayoutKind };

export interface CardRenderOptions {
	/** Unstyled, copy-friendly text. */
	readonly plain?: boolean;
	/** `false` for none, `true` to detect, or a level: 1, 2 or 3 (truecolor). */
	readonly color?: boolean | ColorLevel;
	/** `auto` picks the largest layout that fits `columns`. */
	readonly layout?: LayoutKind | 'auto';
	/** Terminal width for `auto`. Defaults to stdout, or 80. */
	readonly columns?: number;
}

export interface DisplayOptions extends CardRenderOptions {
	/** Animate when the terminal can. Default `true`. */
	readonly animate?: boolean;
	/** Same seed, same animation. */
	readonly seed?: number;
	readonly output?: NodeJS.WriteStream;
	readonly input?: NodeJS.ReadStream;
}

function plain_card(profile: CardProfile): string {
	return [
		`${profile.name} (@${profile.handle})`,
		profile.role,
		profile.pitch,
		profile.tags?.length ? profile.tags.join(' · ') : undefined,
		'',
		...profile.links.map((link) => `${link.label}: ${link.url}`),
	]
		.filter((line) => line !== undefined)
		.join('\n');
}

function resolve_level(
	color: CardRenderOptions['color'],
	output: { isTTY?: boolean },
): ColorLevel {
	if (color === false) return 0;
	if (typeof color === 'number') return color;
	const detected = detect_color_level(output);
	// asked for colour explicitly, so give at least basic colour
	return color === true
		? (Math.max(detected, 1) as ColorLevel)
		: detected;
}

function pick_scene(
	profile: CardProfile,
	options: CardRenderOptions,
	columns: number,
): Scene | undefined {
	const layout = options.layout ?? 'auto';
	return layout === 'auto'
		? choose_scene(profile, { columns })
		: build_scene(profile, layout);
}

function render_static(scene: Scene, level: ColorLevel): string {
	return serialize(final_frame(scene, level === 0), level).join('\n');
}

/** The finished card as a string. */
export function create_card(
	profile: CardProfile = default_profile,
	options: CardRenderOptions = {},
): string {
	if (options.plain) return plain_card(profile);
	const level = resolve_level(options.color, process.stdout);
	const columns = options.columns ?? process.stdout.columns ?? 80;
	const scene = pick_scene(profile, options, columns);
	return scene ? render_static(scene, level) : plain_card(profile);
}

/**
 * Print the card. In a terminal with colour and room for it, the card
 * animates in place first; any key skips to the end.
 */
export async function display_card(
	profile: CardProfile = default_profile,
	options: DisplayOptions = {},
): Promise<void> {
	const output = options.output ?? process.stdout;
	const input = options.input ?? process.stdin;
	if (options.plain) {
		output.write(`${plain_card(profile)}\n`);
		return;
	}

	const level = resolve_level(options.color, output);
	const columns = options.columns ?? output.columns ?? 80;
	const animate =
		(options.animate ?? true) &&
		level > 0 &&
		output.isTTY === true &&
		!process.env.CI &&
		process.env.TERM !== 'dumb';

	if (animate) {
		const rows = output.rows ?? 0;
		const layout = options.layout ?? 'auto';
		const scene =
			layout === 'auto'
				? choose_scene(profile, { columns, rows })
				: build_scene(profile, layout);
		const fits =
			scene &&
			footprint(scene).columns <= columns &&
			footprint(scene).rows <= rows;
		if (scene && fits) {
			const animation = create_animation(scene, {
				seed: options.seed,
			});
			await play(animation, { output, input, level });
			return;
		}
	}

	const scene = pick_scene(profile, options, columns);
	output.write(
		scene
			? `\n${render_static(scene, level)}\n\n`
			: `${plain_card(profile)}\n`,
	);
}
