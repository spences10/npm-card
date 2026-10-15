import type { Pixel } from './font.js';
import type { Scene } from './layout.js';
import { mix, palette, type Rgb } from './palette.js';

export interface Cell {
	readonly ch: string;
	readonly fg?: Rgb;
	readonly bg?: Rgb;
	readonly bold?: boolean;
	readonly underline?: boolean;
	readonly link?: string;
}

/** Card plus its one-cell shadow, `scene.height + 1` rows. */
export type Frame = Cell[][];

export interface Animation {
	readonly duration: number;
	frame(t: number): Frame;
}

export interface AnimationOptions {
	/** Same seed, same particle paths. */
	readonly seed?: number;
	/** Outline the card instead of filling it, for no-colour output. */
	readonly mono?: boolean;
}

// timeline, ms
const WIPE_AT = 0;
const WIPE_FOR = 450;
const NAME_AT = 120;
const TEXT_AT = 900;
const SHADOW_AT = 1150;
const SHADOW_FOR = 160;
const PILLS_AT = 1450;
const DURATION = 1900;

const SCRAMBLE = '!<>-_\\/[]{}=+*^?#%&01';

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const ease_out_cubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;
const ease_out_expo = (t: number) =>
	t >= 1 ? 1 : 1 - 2 ** (-10 * Math.max(t, 0));

/** Deterministic PRNG so a seed always gives the same flight paths. */
function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

interface Flight extends Pixel {
	readonly from_x: number;
	readonly from_y: number;
	readonly delay: number;
	readonly duration: number;
}

function plan_flights(
	pixels: readonly Pixel[],
	random: () => number,
): Flight[] {
	return pixels.map((p) => {
		const angle = random() * Math.PI * 2;
		const distance = 40 + random() * 50;
		return {
			...p,
			from_x: p.x + Math.cos(angle) * distance,
			from_y: p.y + Math.sin(angle) * distance * 0.6,
			delay: NAME_AT + random() * 260 + p.x * 4,
			duration: 520 + random() * 220,
		};
	});
}

export function create_animation(
	scene: Scene,
	options: AnimationOptions = {},
): Animation {
	const seed = options.seed ?? Date.now();
	const mono = options.mono ?? false;
	const flights = plan_flights(scene.pixels, mulberry32(seed));
	const { width, height } = scene;

	function frame(t: number): Frame {
		const cells: Frame = Array.from({ length: height + 1 }, () =>
			Array.from({ length: width + 1 }, (): Cell => ({ ch: ' ' })),
		);
		const scramble = mulberry32(seed ^ Math.floor(t));
		const wiped = mono
			? width
			: Math.ceil(ease_out_cubic((t - WIPE_AT) / WIPE_FOR) * width);
		const in_card = (x: number, y: number) =>
			x >= 0 && x < wiped && y >= 0 && y < height;

		// cells inside the card sit on navy unless they bring a background
		const put = (x: number, y: number, cell: Cell) => {
			const row = cells[y];
			if (!row || x < 0 || x > width) return;
			const bg =
				cell.bg ??
				(!mono && in_card(x, y) ? palette.navy : undefined);
			row[x] = bg ? { ...cell, bg } : cell;
		};

		// card: a navy block that wipes open, or an outline in mono
		if (mono) {
			for (let x = 1; x < width - 1; x++) {
				put(x, 0, { ch: '━' });
				put(x, height - 1, { ch: '━' });
			}
			for (let y = 1; y < height - 1; y++) {
				put(0, y, { ch: '┃' });
				put(width - 1, y, { ch: '┃' });
			}
			put(0, 0, { ch: '┏' });
			put(width - 1, 0, { ch: '┓' });
			put(0, height - 1, { ch: '┗' });
			put(width - 1, height - 1, { ch: '┛' });
		} else {
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < wiped; x++) put(x, y, { ch: ' ' });
				if (wiped < width)
					put(wiped, y, { ch: '▌', fg: palette.yellow });
			}
		}

		// hard offset shadow drops in from the top-right corner
		const drop = mono
			? 1
			: ease_out_cubic((t - SHADOW_AT) / SHADOW_FOR);
		if (drop > 0) {
			const shadow_rows = Math.ceil(drop * (height - 1));
			for (let y = 1; y <= shadow_rows; y++) {
				put(width, y, { ch: '█', fg: palette.peri });
			}
			const shadow_cols = Math.ceil(drop * (width - 1));
			for (let x = width - shadow_cols; x <= width; x++) {
				put(x, height, { ch: '▀', fg: palette.peri });
			}
		}

		draw_name(t);
		draw_texts(t);
		draw_pills(t);
		return cells;

		// name pixels fly in from scattered points, flash white on
		// landing, settle to yellow, then drop an ink shadow
		function draw_name(t: number) {
			const lit = new Map<string, Rgb>();
			const shade = new Map<string, Rgb>();
			for (const f of flights) {
				const progress = (t - f.delay) / f.duration;
				if (progress < 0) continue;
				const eased = ease_out_expo(progress);
				const x = Math.round(f.from_x + (f.x - f.from_x) * eased);
				const y = Math.round(f.from_y + (f.y - f.from_y) * eased);
				const since = t - f.delay - f.duration;
				const color =
					progress < 1
						? mix(palette.mint, palette.peri, eased)
						: mix(palette.white, palette.yellow, since / 250);
				lit.set(`${x},${y}`, color);
				if (!mono && progress >= 1 && since > 120) {
					shade.set(`${f.x + 1},${f.y + 1}`, palette.ink);
				}
			}

			// pair pixel rows into half-block cells
			const halves = new Map<string, { top?: Rgb; bottom?: Rgb }>();
			for (const [source, layer] of [
				[shade, 'shade'],
				[lit, 'lit'],
			] as const) {
				for (const [key, color] of source) {
					const [px, py] = key.split(',').map(Number) as [
						number,
						number,
					];
					const cell_key = `${px},${Math.floor(py / 2)}`;
					const half = halves.get(cell_key) ?? {};
					if (py % 2 === 0) {
						if (layer === 'lit' || !half.top) half.top = color;
					} else if (layer === 'lit' || !half.bottom) {
						half.bottom = color;
					}
					halves.set(cell_key, half);
				}
			}
			for (const [key, { top, bottom }] of halves) {
				const [x, y] = key.split(',').map(Number) as [number, number];
				if (mono) {
					put(x, y, { ch: top && bottom ? '█' : top ? '▀' : '▄' });
				} else if (top && bottom) {
					put(
						x,
						y,
						top === bottom
							? { ch: '█', fg: top }
							: { ch: '▀', fg: top, bg: bottom },
					);
				} else {
					put(x, y, { ch: top ? '▀' : '▄', fg: top ?? bottom });
				}
			}
		}

		// text decrypts left to right, each run a little after the last
		function draw_texts(t: number) {
			scene.texts.forEach((run, i) => {
				const start = TEXT_AT + i * 45;
				Array.from(run.text).forEach((ch, j) => {
					const reveal = start + j * 9;
					const x = run.col + j;
					if (mono || t >= reveal) {
						put(x, run.row, {
							ch,
							fg: run.color,
							bold: run.bold,
							underline: run.underline,
							link: run.link,
						});
					} else if (t >= reveal - 160 && ch !== ' ') {
						const glyph =
							SCRAMBLE[Math.floor(scramble() * SCRAMBLE.length)]!;
						put(x, run.row, { ch: glyph, fg: palette.mint });
					}
				});
			});
		}

		// tag pills pop in like stickers, with a hard ink shadow
		function draw_pills(t: number) {
			scene.pills.forEach((pill, i) => {
				if (!mono && t < PILLS_AT + i * 120) return;
				const text = mono ? `[${pill.label}]` : ` ${pill.label} `;
				Array.from(text).forEach((ch, j) => {
					put(pill.col + j, pill.row, {
						ch,
						fg: palette.ink,
						bg: mono ? undefined : pill.color,
						bold: true,
					});
					if (!mono) {
						put(pill.col + j + 1, pill.row + 1, {
							ch: '▀',
							fg: palette.ink,
						});
					}
				});
			});
		}
	}

	return { duration: DURATION, frame };
}

/** The finished card, as the animation ends. */
export function final_frame(scene: Scene, mono = false): Frame {
	return create_animation(scene, { seed: 1, mono }).frame(Infinity);
}
