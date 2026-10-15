import type { Animation, Cell, Frame } from './animation.js';
import { MARGIN } from './layout.js';
import { bg_code, fg_code, type ColorLevel } from './palette.js';

const ESC = '\u001B';
const CSI = `${ESC}[`;
const osc_link = (url = '') => `${ESC}]8;;${url}${ESC}\\`;

function style(cell: Cell, level: ColorLevel): string {
	if (level === 0) return '';
	const codes = ['0'];
	if (cell.bold) codes.push('1');
	if (cell.underline) codes.push('4');
	if (cell.fg) codes.push(fg_code(cell.fg, level));
	if (cell.bg) codes.push(bg_code(cell.bg, level));
	return `${CSI}${codes.join(';')}m`;
}

/** One frame row as a string, margin included, no newline. */
export function serialize_row(
	row: readonly Cell[],
	level: ColorLevel,
): string {
	let out = ' '.repeat(MARGIN);
	let current_style = '';
	let current_link: string | undefined;
	for (const cell of row) {
		// links are only worth emitting where the terminal understands escapes
		const link = level > 0 ? cell.link : undefined;
		if (link !== current_link) {
			out += osc_link(link);
			current_link = link;
		}
		const next_style = style(cell, level);
		if (next_style !== current_style) {
			out += next_style;
			current_style = next_style;
		}
		out += cell.ch;
	}
	if (current_link) out += osc_link();
	if (level > 0) out += `${CSI}0m`;
	return out.trimEnd();
}

export function serialize(frame: Frame, level: ColorLevel): string[] {
	return frame.map((row) => serialize_row(row, level));
}

interface Output {
	readonly rows?: number;
	write(chunk: string): boolean;
	on(event: 'resize', listener: () => void): unknown;
	off(event: 'resize', listener: () => void): unknown;
}

interface Input {
	readonly isTTY?: boolean;
	setRawMode?(mode: boolean): unknown;
	resume(): unknown;
	pause(): unknown;
	on(event: 'data', listener: (data: Buffer) => void): unknown;
	off(event: 'data', listener: (data: Buffer) => void): unknown;
}

export interface PlayOptions {
	readonly output: Output;
	readonly input?: Input;
	readonly level: ColorLevel;
	readonly fps?: number;
}

/**
 * Play an animation in place, below the cursor. Rows that did not
 * change since the last frame are not rewritten. Any key or a resize
 * skips to the final frame. Resolves once the card is printed and
 * the cursor is back.
 */
export function play(
	animation: Animation,
	{ output, input, level, fps = 60 }: PlayOptions,
): Promise<void> {
	const first = animation.frame(0);
	const height = first.length;
	let previous: string[] = [];

	const draw = (frame: Frame) => {
		const rows = serialize(frame, level);
		let out = `${CSI}?2026h`;
		let at = 0;
		rows.forEach((row, i) => {
			if (row === previous[i]) return;
			if (i > at) out += `${CSI}${i - at}B`;
			out += `\r${row}${CSI}K`;
			at = i;
		});
		if (at > 0) out += `${CSI}${at}A`;
		out += `\r${CSI}?2026l`;
		output.write(out);
		previous = rows;
	};

	const show_cursor = () => output.write(`${CSI}?25h`);

	return new Promise((resolve) => {
		// blank line, then reserve the card's rows and go back to the top
		output.write(
			`\n${'\n'.repeat(height - 1)}${CSI}${height - 1}A\r`,
		);
		output.write(`${CSI}?25l`);
		process.once('exit', show_cursor);

		const raw =
			input?.isTTY === true && typeof input.setRawMode === 'function';
		const started = performance.now();
		let finished = false;

		const finish = () => {
			if (finished) return;
			finished = true;
			clearInterval(timer);
			output.off('resize', finish);
			if (input && raw) {
				input.off('data', finish);
				input.setRawMode?.(false);
				input.pause();
			}
			draw(animation.frame(Infinity));
			output.write(`${CSI}${height - 1}B\r\n\n`);
			show_cursor();
			process.off('exit', show_cursor);
			resolve();
		};

		if (input && raw) {
			input.setRawMode?.(true);
			input.resume();
			input.on('data', finish);
		}
		output.on('resize', finish);

		const timer = setInterval(() => {
			const t = performance.now() - started;
			if (t >= animation.duration) finish();
			else draw(animation.frame(t));
		}, 1000 / fps);
		draw(first);
	});
}
