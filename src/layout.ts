import {
	can_set,
	large_font,
	set_text,
	small_font,
	text_width,
	type Pixel,
	type PixelFont,
} from './font.js';
import { palette, type Rgb } from './palette.js';
import { link_text, type CardProfile } from './profile.js';

export type LayoutKind = 'full' | 'compact';

export interface TextRun {
	readonly row: number;
	readonly col: number;
	readonly text: string;
	readonly color: Rgb;
	readonly bold?: boolean;
	readonly underline?: boolean;
	readonly link?: string;
}

export interface Pill {
	readonly row: number;
	readonly col: number;
	readonly label: string;
	readonly color: Rgb;
}

/**
 * Everything on the card, positioned in card cells. Name pixels use
 * pixel rows, two per card row.
 */
export interface Scene {
	readonly kind: LayoutKind;
	readonly width: number;
	readonly height: number;
	readonly pixels: readonly Pixel[];
	readonly texts: readonly TextRun[];
	readonly pills: readonly Pill[];
}

/** Blank columns left of the card. */
export const MARGIN = 2;

/** Terminal cells needed: margin, card and shadow; blank line, card and shadow. */
export function footprint(scene: Scene): {
	columns: number;
	rows: number;
} {
	return {
		columns: MARGIN + scene.width + 1,
		rows: scene.height + 2,
	};
}

const PILL_COLORS = [palette.yellow, palette.mint, palette.peri];

function fit(text: string, max: number): string {
	if (text.length <= max) return text;
	return max <= 1 ? text.slice(0, max) : `${text.slice(0, max - 1)}…`;
}

interface SetName {
	readonly pixels: Pixel[];
	/** Card rows used, including the 1px drop shadow. */
	readonly rows: number;
}

function set_lines(
	lines: readonly string[],
	font: PixelFont,
): SetName {
	const line_height = font.height + 1;
	const pixels = lines.flatMap((line, i) =>
		set_text(line, font).map((p) => ({
			x: p.x,
			y: p.y + i * line_height,
		})),
	);
	return {
		pixels,
		rows: Math.ceil((lines.length * line_height) / 2),
	};
}

/** Wrap words greedily into lines no wider than `max` pixels. */
function wrap_words(
	words: readonly string[],
	font: PixelFont,
	max: number,
): string[] | undefined {
	const lines: string[] = [];
	for (const word of words) {
		if (text_width(word, font) + 1 > max) return undefined;
		const last = lines.at(-1);
		const joined = last === undefined ? word : `${last} ${word}`;
		if (last !== undefined && text_width(joined, font) + 1 <= max) {
			lines[lines.length - 1] = joined;
		} else {
			lines.push(word);
		}
	}
	return lines;
}

function set_name(
	name: string,
	max_width: number,
	allow_large: boolean,
): SetName | undefined {
	const words = name.trim().split(/\s+/);
	if (allow_large && can_set(name, large_font)) {
		const lines = wrap_words(words, large_font, max_width);
		if (lines && lines.length <= 2)
			return set_lines(lines, large_font);
	}
	const line = words.join(' ');
	if (
		can_set(line, small_font) &&
		text_width(line, small_font) + 1 <= max_width
	) {
		return set_lines([line], small_font);
	}
	return undefined;
}

function place_name(
	profile: CardProfile,
	pad: number,
	row: number,
	inner: number,
	allow_large: boolean,
	texts: TextRun[],
): { pixels: Pixel[]; row: number } {
	const name = set_name(profile.name, inner, allow_large);
	if (!name) {
		texts.push({
			row,
			col: pad,
			text: fit(profile.name.toUpperCase(), inner),
			color: palette.yellow,
			bold: true,
		});
		return { pixels: [], row: row + 1 };
	}
	return {
		pixels: name.pixels.map((p) => ({
			x: p.x + pad,
			y: p.y + row * 2,
		})),
		row: row + name.rows,
	};
}

function full_scene(profile: CardProfile): Scene {
	const width = 72;
	const pad = 4;
	const inner = width - pad * 2;
	const texts: TextRun[] = [];
	const pills: Pill[] = [];

	const name = place_name(profile, pad, 2, inner, true, texts);
	let row = name.row + 1;
	texts.push({
		row: row++,
		col: pad,
		text: fit(`@${profile.handle}`, inner),
		color: palette.mint,
		bold: true,
	});
	texts.push({
		row: row++,
		col: pad,
		text: fit(profile.role, inner),
		color: palette.fog,
		bold: true,
	});
	if (profile.pitch) {
		texts.push({
			row: row++,
			col: pad,
			text: fit(profile.pitch, inner),
			color: palette.peri,
		});
	}
	row++;

	const tags = profile.tags ?? [];
	if (tags.length > 0) {
		let col = pad;
		tags.forEach((tag, i) => {
			const label = tag.toUpperCase();
			// pill is label plus a space each side, shadow one column right
			if (col + label.length + 3 > width - pad) return;
			pills.push({
				row,
				col,
				label,
				color: PILL_COLORS[i % PILL_COLORS.length]!,
			});
			col += label.length + 5;
		});
		// pill row and its shadow row; links follow directly to keep
		// the full card inside an 80x24 terminal
		row += 2;
	}

	const label_width =
		Math.max(...profile.links.map((link) => link.label.length)) + 2;
	for (const link of profile.links) {
		texts.push({
			row,
			col: pad,
			text: link.label,
			color: palette.peri,
		});
		texts.push({
			row: row++,
			col: pad + label_width,
			text: fit(link_text(link), inner - label_width),
			color: palette.fog,
			underline: true,
			link: link.url,
		});
	}

	return {
		kind: 'full',
		width,
		height: row + 1,
		pixels: name.pixels,
		texts,
		pills,
	};
}

function compact_scene(profile: CardProfile): Scene {
	const width = 60;
	const pad = 3;
	const inner = width - pad * 2;
	const texts: TextRun[] = [];

	const name = place_name(profile, pad, 1, inner, false, texts);
	let row = name.row + 1;

	const handle = `@${profile.handle}`;
	const separator = ' · ';
	if (
		handle.length + separator.length + profile.role.length <=
		inner
	) {
		texts.push({
			row,
			col: pad,
			text: handle,
			color: palette.mint,
			bold: true,
		});
		texts.push({
			row,
			col: pad + handle.length,
			text: separator,
			color: palette.peri,
		});
		texts.push({
			row: row++,
			col: pad + handle.length + separator.length,
			text: profile.role,
			color: palette.fog,
			bold: true,
		});
	} else {
		texts.push({
			row: row++,
			col: pad,
			text: fit(handle, inner),
			color: palette.mint,
			bold: true,
		});
		texts.push({
			row: row++,
			col: pad,
			text: fit(profile.role, inner),
			color: palette.fog,
			bold: true,
		});
	}
	row++;

	const label_width =
		Math.max(...profile.links.map((link) => link.label.length)) + 2;
	const cell_width =
		label_width +
		Math.max(...profile.links.map((link) => link_text(link).length));
	const columns = cell_width * 2 + 2 <= inner ? 2 : 1;
	const text_width_max =
		columns === 2 ? cell_width - label_width : inner - label_width;
	profile.links.forEach((link, i) => {
		const col = pad + (i % columns) * (cell_width + 2);
		const link_row = row + Math.floor(i / columns);
		texts.push({
			row: link_row,
			col,
			text: link.label,
			color: palette.peri,
		});
		texts.push({
			row: link_row,
			col: col + label_width,
			text: fit(link_text(link), text_width_max),
			color: palette.fog,
			underline: true,
			link: link.url,
		});
	});
	row += Math.ceil(profile.links.length / columns);

	return {
		kind: 'compact',
		width,
		height: row + 1,
		pixels: name.pixels,
		texts,
		pills: [],
	};
}

export function build_scene(
	profile: CardProfile,
	kind: LayoutKind,
): Scene {
	return kind === 'full'
		? full_scene(profile)
		: compact_scene(profile);
}

/**
 * The largest layout that fits. Rows only matter when animating:
 * redrawing in place needs the whole card on screen.
 */
export function choose_scene(
	profile: CardProfile,
	space: { columns: number; rows?: number },
): Scene | undefined {
	for (const kind of ['full', 'compact'] as const) {
		const scene = build_scene(profile, kind);
		const needed = footprint(scene);
		if (
			needed.columns <= space.columns &&
			(space.rows === undefined || needed.rows <= space.rows)
		) {
			return scene;
		}
	}
	return undefined;
}
