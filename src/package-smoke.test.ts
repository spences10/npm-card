/// <reference types="node" />

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

interface PackResult {
	files: Array<{ path: string }>;
}

function run_cli(
	args: string[] = [],
	env: NodeJS.ProcessEnv = {},
): string {
	return execFileSync(
		process.execPath,
		[join(process.cwd(), 'dist', 'index.js'), ...args],
		{
			encoding: 'utf-8',
			env: { ...process.env, ...env },
		},
	);
}

const package_version = (
	JSON.parse(readFileSync('package.json', 'utf-8')) as {
		version: string;
	}
).version;

describe('package smoke', () => {
	const cli_path = join(process.cwd(), 'dist', 'index.js');

	it('runs the default card', () => {
		const output = run_cli([], { NO_COLOR: '1' });

		expect(output).toContain('@spences10');
		expect(output).toContain('Product Engineer & Engineering Lead');
		expect(output).toContain('scottspence.com');
	});

	it('outputs a plain card', () => {
		const output = run_cli(['--plain']);

		expect(output).toContain('Scott Spence (@spences10)');
		expect(output).not.toContain('┏');
	});

	it('outputs the profile as JSON', () => {
		const profile = JSON.parse(run_cli(['--json'])) as {
			name?: string;
			role?: string;
		};

		expect(profile.name).toBe('Scott Spence');
		expect(profile.role).toBe('Product Engineer & Engineering Lead');
	});

	it('disables ANSI colors explicitly', () => {
		const output = run_cli(['--no-color'], { FORCE_COLOR: '3' });

		expect(output).toContain('@spences10');
		expect(output).not.toContain('\u001B[');
	});

	it('provides Citty help and version output', () => {
		const help = run_cli(['--help']);
		const version = run_cli(['--version']);

		expect(help).toContain('--plain');
		expect(help).toContain('--json');
		expect(help).toContain('--no-color');
		expect(help).toContain('--no-animation');
		expect(help).toContain('--compact');
		expect(version.trim()).toBe(package_version);
	});

	it('outputs the compact card', () => {
		const output = run_cli(['--compact', '--no-color']);

		expect(output).toContain('@spences10 · Product Engineer');
		expect(output).not.toContain('SVELTE AMBASSADOR');
	});

	it('imports the public API without CLI side effects', async () => {
		const api_url = pathToFileURL(
			join(process.cwd(), 'dist', 'api.js'),
		).href;
		const api = (await import(api_url)) as {
			create_card?: unknown;
			default_profile?: unknown;
			display_card?: unknown;
		};

		expect(api.create_card).toBeTypeOf('function');
		expect(api.default_profile).toBeTypeOf('object');
		expect(api.display_card).toBeTypeOf('function');
	});

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
});
