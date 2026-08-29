import boxen, { type Options as BoxenOptions } from 'boxen';
import chalk from 'chalk';
import { instagram, passion, rainbow } from 'gradient-string';

export interface CardProfile {
	readonly name: string;
	readonly handle: string;
	readonly work: string;
	readonly bluesky: string;
	readonly github: string;
	readonly linkedin: string;
	readonly web: string;
}

export interface CardRenderOptions {
	readonly color?: boolean;
	readonly plain?: boolean;
}

export const default_profile: CardProfile = {
	name: 'Scott Spence',
	handle: 'spences10',
	work: 'Product Engineer @ Cloud Lobsters',
	bluesky: 'https://ss10.dev/bluesky',
	github: 'https://ss10.dev/git',
	linkedin: 'https://ss10.dev/li',
	web: 'https://scottspence.com',
};

const boxen_options: BoxenOptions = {
	padding: 1,
	margin: 1,
	borderStyle: 'round',
	borderColor: '#663399',
};

function plain_card(profile: CardProfile): string {
	return [
		`${profile.name} (@${profile.handle})`,
		`Work: ${profile.work}`,
		`Bluesky: ${profile.bluesky}`,
		`GitHub: ${profile.github}`,
		`LinkedIn: ${profile.linkedin}`,
		`Web: ${profile.web}`,
	].join('\n');
}

export function create_card(
	profile: CardProfile = default_profile,
	options: CardRenderOptions = {},
): string {
	if (options.plain) return plain_card(profile);

	const color = options.color ?? chalk.level > 0;
	const style = (
		value: string,
		gradient: (text: string) => string,
	) => (color ? gradient(value) : value);
	const bold = (value: string) => (color ? chalk.bold(value) : value);
	const lines = [
		style(profile.name.toUpperCase(), passion),
		style(`@${profile.handle}`, chalk.cyan),
		'',
		`${bold('Work:')}  ${style(profile.work, rainbow)}`,
		`${bold('Bluesky:')}  ${style(profile.bluesky, instagram)}`,
		`${bold('GitHub:')}  ${style(profile.github, instagram)}`,
		`${bold('LinkedIn:')}  ${style(profile.linkedin, instagram)}`,
		`${bold('Web:')}  ${style(profile.web, instagram)}`,
	];
	const render_options = color
		? boxen_options
		: { ...boxen_options, borderColor: undefined };

	return boxen(lines.join('\n'), render_options);
}

export function display_card(
	profile: CardProfile = default_profile,
	options: CardRenderOptions = {},
): void {
	console.log(create_card(profile, options));
}
