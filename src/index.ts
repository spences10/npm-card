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
		compact: {
			type: 'boolean',
			alias: 'c',
			description: 'Use the compact card',
			default: false,
		},
		color: {
			type: 'boolean',
			description: 'Enable ANSI colors',
			negativeDescription: 'Disable ANSI colors',
			default: true,
		},
		animation: {
			type: 'boolean',
			description: 'Animate the card in',
			negativeDescription: 'Show the finished card straight away',
			default: true,
		},
	},
	async run({ args }) {
		if (args.json) {
			console.log(JSON.stringify(default_profile, null, 2));
			return;
		}
		await display_card(default_profile, {
			plain: args.plain,
			// --no-color turns colour off; otherwise detect it
			color: args.color ? undefined : false,
			layout: args.compact ? 'compact' : 'auto',
			animate: args.animation,
		});
	},
});

void runMain(main);
