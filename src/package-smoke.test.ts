/// <reference types="node" />

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

interface PackResult {
	files: Array<{ path: string }>;
}

describe('package smoke', () => {
	const cli_path = join(process.cwd(), 'dist', 'index.js');

	it('packs the CLI and public API entrypoints', () => {
		const raw = execFileSync(
			'pnpm',
			['pack', '--dry-run', '--json'],
			{ encoding: 'utf-8' },
		);
		const result = JSON.parse(raw) as PackResult;
		const files = new Set(result.files.map((file) => file.path));
		const package_json = JSON.parse(
			readFileSync('package.json', 'utf-8'),
		) as {
			bin?: Record<string, string>;
			exports?: Record<string, unknown>;
		};

		expect(package_json.bin?.spences10).toBe('./dist/index.js');
		expect(package_json.exports).toHaveProperty('.');
		for (const expected of [
			'package.json',
			'README.md',
			'dist/index.js',
			'dist/api.js',
			'dist/api.d.ts',
		]) {
			expect(files.has(expected)).toBe(true);
		}
		expect(statSync(cli_path).mode & 0o111).not.toBe(0);
	});

	it('runs the built CLI', () => {
		const output = execFileSync(process.execPath, [cli_path], {
			encoding: 'utf-8',
			env: { ...process.env, NO_COLOR: '1' },
		});

		expect(output).toContain('SCOTT SPENCE');
		expect(output).toContain('Product Engineer @ Cloud Lobsters');
		expect(output).toContain('https://scottspence.com');
	});

	it('imports the public API without CLI side effects', async () => {
		const api_url = pathToFileURL(
			join(process.cwd(), 'dist', 'api.js'),
		).href;
		const api = (await import(api_url)) as {
			display_card?: unknown;
		};

		expect(api.display_card).toBeTypeOf('function');
	});
});
