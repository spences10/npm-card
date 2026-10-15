---
'spences10': major
---

Animated card. The name's pixels fly in, the details decrypt, and a
compact layout takes over in short or narrow terminals. Any key skips
the animation; `--no-animation` and `--compact` are new flags.

Breaking: `CardProfile` now takes `role`, optional `pitch` and `tags`,
and a `links` array instead of `work` and the fixed link fields.
`display_card` is async. boxen, chalk and gradient-string are no
longer dependencies.
