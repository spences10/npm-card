# My npm card

Run the card without installing it:

```bash
npx spences10
```

## CLI options

```text
--plain       Output an unstyled, copy-friendly card
--json        Output the profile as JSON
--no-color    Disable ANSI colors
--help        Show usage information
--version     Show the installed version
```

For example:

```bash
npx spences10 --plain
npx spences10 --json
```

## API

Create a custom card or display it directly:

```js
import { create_card, display_card } from 'spences10';

const profile = {
	name: 'Ada Lovelace',
	handle: 'ada',
	work: 'Programmer',
	bluesky: 'https://example.com/bluesky',
	github: 'https://example.com/github',
	linkedin: 'https://example.com/linkedin',
	web: 'https://example.com',
};

console.log(create_card(profile, { plain: true }));
display_card(profile, { color: false });
```

The package also exports `default_profile`, `CardProfile`, and
`CardRenderOptions`.

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
