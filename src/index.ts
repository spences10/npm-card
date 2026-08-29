#!/usr/bin/env node

import { defineCommand, runMain } from 'citty';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { default_profile, display_card } from './api.js';

const current_dir = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
	readFileSync(join(current_dir, '..', 'package.json'), 'utf-8'),
) as { version?: string };

const main = defineCommand({
	meta: {
		name: 'spences10',
		version: pkg.version,
		description: 'Display Scott Spence’s npm card.',
	},
	args: {
		plain: {
			type: 'boolean',
			alias: 'p',
			description: 'Output an unstyled, copy-friendly card',
			default: false,
		},
		json: {
			type: 'boolean',
			alias: 'j',
			description: 'Output the profile as JSON',
			default: false,
		},
		color: {
			type: 'boolean',
			description: 'Enable ANSI colors',
			negativeDescription: 'Disable ANSI colors',
			default: true,
		},
	},
	run({ args }) {
		if (args.json) {
			console.log(JSON.stringify(default_profile, null, 2));
			return;
		}
		display_card(default_profile, {
			plain: args.plain,
			color: args.color,
		});
	},
});

void runMain(main);
