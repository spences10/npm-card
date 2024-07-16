# My npm card

```js
npx spences10
```

Thanks to [Tierney Cyren], and the [original repo]

## Run locally

From the root of the project:

```bash
pnpm run build
```

To create a global link with pnpm, use:

```bash
pnpm link --global
```

This creates a symbolic link to your package in the global pnpm store.

Now you should be able to run your package using:

```bash
pnpm dlx spences10
```

When you're done testing, you can unlink the package:

```bash
pnpm unlink --global spences10
```

[tierney cyren]: https://github.com/bnb
[original repo]: https://github.com/bnb/bitandbang
