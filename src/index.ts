#!/usr/bin/env node

import chalk from "chalk";
import boxen, { Options as BoxenOptions } from "boxen";

interface CardData {
  name: string;
  handle: string;
  work: string;
  twitter: string;
  github: string;
  linkedin: string;
  web: string;
}

const cardData: CardData = {
  name: "Scott Spence",
  handle: "spences10",
  work: "Engineering Lead @XtendOps",
  twitter: "https://ss10.dev/twitter",
  github: "https://ss10.dev/git",
  linkedin: "https://ss10.dev/li",
  web: "https://scottspence.com",
};

const boxenOptions: BoxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "yellow",
};

function createCard(data: CardData): string {
  const lines = [
    `${chalk.white(data.name)} / ${chalk.cyan(data.handle)}`,
    "",
    `${chalk.white.bold("Work:")}  ${chalk.white(data.work)}`,
    `${chalk.white.bold("Twitter:")}  ${chalk.cyan(data.twitter)}`,
    `${chalk.white.bold("GitHub:")}  ${chalk.cyan(data.github)}`,
    `${chalk.white.bold("LinkedIn:")}  ${chalk.cyan(data.linkedin)}`,
    `${chalk.white.bold("Web:")}  ${chalk.cyan(data.web)}`,
    "",
    `${chalk.white.bold("Card:")}  ${chalk.white("npx spences10")}`,
  ];

  return boxen(lines.join("\n"), boxenOptions);
}

export function displayCard(): void {
  console.log(createCard(cardData));
}

if (require.main === module) {
  displayCard();
}
