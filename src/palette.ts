export type Rgb = readonly [number, number, number];

/** Brand tokens, from the design pack. */
export const palette = {
	ink: [13, 18, 71],
	navy: [16, 26, 102],
	yellow: [255, 207, 51],
	peri: [138, 150, 234],
	tomato: [255, 84, 54],
	mint: [61, 220, 151],
	fog: [238, 240, 255],
	white: [255, 255, 255],
} as const satisfies Record<string, Rgb>;

/** 0 none, 1 basic 16, 2 xterm 256, 3 truecolor. */
export type ColorLevel = 0 | 1 | 2 | 3;

interface Stream {
	readonly isTTY?: boolean;
}

const TRUECOLOR_PROGRAMS = new Set([
	'iTerm.app',
	'WezTerm',
	'ghostty',
	'vscode',
	'Hyper',
	'Tabby',
]);

export function detect_color_level(
	stream: Stream,
	env: NodeJS.ProcessEnv = process.env,
): ColorLevel {
	if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') return 0;
	const force = env.FORCE_COLOR;
	if (force !== undefined) {
		if (force === '0' || force === 'false') return 0;
		if (force === '2') return 2;
		if (force === '3') return 3;
		return 1;
	}
	if (!stream.isTTY || env.TERM === 'dumb') return 0;
	const colorterm = env.COLORTERM?.toLowerCase();
	if (colorterm === 'truecolor' || colorterm === '24bit') return 3;
	if (env.WT_SESSION) return 3;
	if (TRUECOLOR_PROGRAMS.has(env.TERM_PROGRAM ?? '')) return 3;
	if (/kitty|alacritty|ghostty|wezterm/i.test(env.TERM ?? ''))
		return 3;
	if (/256/.test(env.TERM ?? '')) return 2;
	return 1;
}

const distance = (a: Rgb, b: Rgb) =>
	(a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

const CUBE = [0, 95, 135, 175, 215, 255];

function nearest_cube(value: number): number {
	let best = 0;
	for (let i = 1; i < CUBE.length; i++) {
		if (Math.abs(CUBE[i]! - value) < Math.abs(CUBE[best]! - value))
			best = i;
	}
	return best;
}

export function rgb_to_256(rgb: Rgb): number {
	const [r, g, b] = rgb.map(nearest_cube) as [number, number, number];
	const cube: Rgb = [CUBE[r]!, CUBE[g]!, CUBE[b]!];
	const average = (rgb[0] + rgb[1] + rgb[2]) / 3;
	const step = Math.min(
		Math.max(Math.round((average - 8) / 10), 0),
		23,
	);
	const grey_value = 8 + step * 10;
	const grey: Rgb = [grey_value, grey_value, grey_value];
	return distance(rgb, grey) < distance(rgb, cube)
		? 232 + step
		: 16 + 36 * r + 6 * g + b;
}

// VGA-ish values, index 0-7 normal, 8-15 bright
const BASIC: readonly Rgb[] = [
	[0, 0, 0],
	[170, 0, 0],
	[0, 170, 0],
	[170, 85, 0],
	[0, 0, 170],
	[170, 0, 170],
	[0, 170, 170],
	[170, 170, 170],
	[85, 85, 85],
	[255, 85, 85],
	[85, 255, 85],
	[255, 255, 85],
	[85, 85, 255],
	[255, 85, 255],
	[85, 255, 255],
	[255, 255, 255],
];

export function rgb_to_16(rgb: Rgb): number {
	let best = 0;
	for (let i = 1; i < BASIC.length; i++) {
		if (distance(rgb, BASIC[i]!) < distance(rgb, BASIC[best]!))
			best = i;
	}
	return best;
}

export function fg_code(rgb: Rgb, level: ColorLevel): string {
	if (level === 3) return `38;2;${rgb.join(';')}`;
	if (level === 2) return `38;5;${rgb_to_256(rgb)}`;
	const index = rgb_to_16(rgb);
	return String(index < 8 ? 30 + index : 82 + index);
}

export function bg_code(rgb: Rgb, level: ColorLevel): string {
	if (level === 3) return `48;2;${rgb.join(';')}`;
	if (level === 2) return `48;5;${rgb_to_256(rgb)}`;
	const index = rgb_to_16(rgb);
	return String(index < 8 ? 40 + index : 92 + index);
}

export function mix(a: Rgb, b: Rgb, amount: number): Rgb {
	const k = Math.min(Math.max(amount, 0), 1);
	return [
		Math.round(a[0] + (b[0] - a[0]) * k),
		Math.round(a[1] + (b[1] - a[1]) * k),
		Math.round(a[2] + (b[2] - a[2]) * k),
	];
}
