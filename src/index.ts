#!/usr/bin/env node

import boxen, { Options as BoxenOptions } from "boxen";
import chalk from "chalk";
import gradient from "gradient-string";

interface CardData {
	name: string;
	handle: string;
	work: string;
	twitter: string;
	github: string;
	linkedin: string;
	web: string;
}

const card_data: CardData = {
	name: "Scott Spence",
	handle: "spences10",
	work: "Engineering Lead @XtendOps",
	twitter: "https://ss10.dev/twitter",
	github: "https://ss10.dev/git",
	linkedin: "https://ss10.dev/li",
	web: "https://scottspence.com",
};

const boxen_options: BoxenOptions = {
	padding: 1,
	margin: 1,
	borderStyle: "round",
	borderColor: "#663399",
};

function create_card(data: CardData): string {
	const name_gradient = gradient.passion;
	const link_gradient = gradient.instagram;
	const work_gradient = gradient.rainbow;

	const lines = [
		name_gradient(data.name.toUpperCase()),
		chalk.cyan(`@${data.handle}`),
		"",
		`${chalk.bold("Work:")}  ${work_gradient(data.work)}`,
		`${chalk.bold("Twitter:")}  ${link_gradient(data.twitter)}`,
		`${chalk.bold("GitHub:")}  ${link_gradient(data.github)}`,
		`${chalk.bold("LinkedIn:")}  ${link_gradient(data.linkedin)}`,
		`${chalk.bold("Web:")}  ${link_gradient(data.web)}`,
	];

	return boxen(lines.join("\n"), boxen_options);
}

export function display_card(): void {
	console.log(create_card(card_data));
}

if (import.meta.url === `file://${process.argv[1]}`) {
	display_card();
}
