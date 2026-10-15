# My npm card

Run the card without installing it:

```bash
npx spences10
```

![The card animating in: a navy card wipes open, pixels fly in to spell SCOTT SPENCE, and the links decrypt into place](https://raw.githubusercontent.com/spences10/npm-card/main/assets/card.gif)

In a terminal with colour and room for it, the card animates in: a
navy card wipes open, the pixels of the name fly in and land, and the
details decrypt into place. Press any key to skip to the end.

The full card needs 75×24, which fits the classic 80×24 terminal. A
compact card (63×12) takes over in shorter or narrower terminals. When
output is piped, in CI, or with `--no-animation`, the finished card is
printed straight away; without colour it is drawn as an outline.

## CLI options

```text
--plain          Output an unstyled, copy-friendly card
--json           Output the profile as JSON
--compact        Use the compact card
--no-color       Disable ANSI colors
--no-animation   Show the finished card straight away
--help           Show usage information
--version        Show the installed version
```

`NO_COLOR` and `FORCE_COLOR` are respected.

## API

Create a custom card or display it directly:

```js
import { create_card, display_card } from 'spences10';

const profile = {
	name: 'Ada Lovelace',
	handle: 'ada',
	role: 'Programmer',
	pitch: 'First to publish an algorithm for a machine.',
	tags: ['Analytical Engine'],
	links: [
		{ label: 'web', url: 'https://example.com' },
		{ label: 'github', url: 'https://example.com/github' },
	],
};

console.log(create_card(profile, { plain: true }));
console.log(
	create_card(profile, { layout: 'compact', color: false }),
);
await display_card(profile);
```

`create_card` returns the finished card as a string. `display_card`
prints it, animating when it can.

Options for both:

- `plain`: unstyled text
- `color`: `false`, `true`, or a level (`1` basic, `2` 256 colours,
  `3` truecolor); detected by default
- `layout`: `'auto'` (default), `'full'` or `'compact'`
- `columns`: width for `'auto'`; defaults to the terminal's

`display_card` also takes `animate` (default `true`), `seed` for a
repeatable animation, and `output` / `input` streams.

Names are set in a pixel font (A–Z, `-`, `.`, `'`). Other characters
fall back to plain text.

The package also exports `default_profile` and the `CardProfile`,
`CardLink`, `CardRenderOptions` and `DisplayOptions` types.

## Development

```bash
pnpm install
pnpm run check
pnpm run test
pnpm run build
```

Thanks to [Tierney Cyren] and the [original repo].

[tierney cyren]: https://github.com/bnb
[original repo]: https://github.com/bnb/bitandbang
