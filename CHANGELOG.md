# spences10

## 4.0.0

### Major Changes

- 0f95d20: Animated card. The name's pixels fly in, the details
  decrypt, and a compact layout takes over in short or narrow
  terminals. Any key skips the animation; `--no-animation` and
  `--compact` are new flags.

  Breaking: `CardProfile` now takes `role`, optional `pitch` and
  `tags`, and a `links` array instead of `work` and the fixed link
  fields. `display_card` is async. boxen, chalk and gradient-string
  are no longer dependencies.

## 3.1.0

### Minor Changes

- 64e3296: Add Citty-powered CLI output options and a reusable API for
  creating custom npm profile cards.

## 3.0.3

### Patch Changes

- 2b24f2f: Update work description
- df4bda1: Modernize package tooling with Vite+, TypeScript 7, safer
  dependency releases, and verified npm packaging behavior.
