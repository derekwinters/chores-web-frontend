# Visual regression (Storybook + Playwright)

Iteration 5 of the design-token rollout
([derekwinters/chores-web-docs#11](https://github.com/derekwinters/chores-web-docs/issues/11),
[#25](https://github.com/derekwinters/chores-web-frontend/issues/25)): a Storybook
catalog of the [mapping-matrix](https://github.com/derekwinters/chores-web-design-tokens/blob/main/docs/mapping-matrix.md)
components, screenshot-gated in CI so pixel drift in the tokenized UI fails PRs
instead of shipping silently. The Android sibling is the Roborazzi suite in
`chores-web-android` (`docs/snapshot-testing.md` there).

## Commands

| Command | What it does |
|---|---|
| `npm run storybook` | Dev Storybook on :6006, theme toolbar with all six palettes |
| `npm run build-storybook` | Static build to `storybook-static/` |
| `npm run visual` | Screenshot every story under **dark** and **paper**, compare against `.visual-baselines/` (builds Storybook first if `storybook-static/` is missing) |
| `npm run visual:update` | Re-record all baselines (then eyeball the diffs and commit) |

`scripts/visual-regression.mjs` is plain Node + Playwright: it serves
`storybook-static/`, loads `iframe.html?id=<story>&viewMode=story&globals=theme:<theme>`
at a fixed 800x600 viewport (deviceScaleFactor 1), disables CSS
animations/transitions and the caret, waits for network idle +
`document.fonts.ready` + a settle timeout, and compares with pixelmatch
(per-pixel threshold 0.1, anti-aliased pixels ignored, up to 0.1% differing
pixels allowed — override with `VISUAL_DIFF_RATIO`).

On failure, `.visual-diffs/` gets a `<name>.diff.png` (highlighted pixels) and
`<name>.actual.png` per failing snapshot; CI uploads it as the `visual-diffs`
artifact.

## Theming

`.storybook/preview.js` defines a `theme` toolbar global with the six palettes
from `@derekwinters/design-tokens/themes.json` (dark, light, charcoal, paper,
pink, frog; default dark). The decorator runs the app's real runtime-theming
path — `applyTheme()` from `src/utils/theme.js` — before every render. Only
**dark** and **paper** are gated: they are the mapping-matrix parity themes and
match the Android golden pair.

## Naming convention (cross-repo gallery)

Baselines are named `<component>_<variant>_<dark|paper>.png` to pair 1:1 with
the Android Roborazzi goldens in the token gallery
([chores-web-design-tokens#6](https://github.com/derekwinters/chores-web-design-tokens/issues/6)):
story id `pillbadge--variants` + theme `dark` → `pillbadge_variants_dark.png`
(replace `--` with `_`, strip non-alphanumerics). Storybook `title` is the
component (`PillBadge`), the story export is the variant (`Variants`). Shared
components use the Android names exactly (`pillbadge_variants`,
`chorerow_list`, `buttons_primarysecondary`, `textfield_outlined`,
`alertdialog_deleteconfirm`); web-only components (nav items, toast, avatar,
progress bar, micro-label) follow the same convention.

The CI job uploads `storybook-static/` + `.visual-baselines/` as the
`web-snapshots` artifact on every run — that artifact shape (baseline PNGs
under `.visual-baselines/` with the names above) is what the gallery consumes.

## Fonts

`.storybook/preview-head.html` loads the same Google-Fonts stylesheet as the
app's `index.html` (DM Sans + Playfair Display), and the script waits for
`document.fonts.ready` before screenshotting. CI runners must be able to reach
`fonts.googleapis.com` (GitHub-hosted runners can); if fonts fail to load, text
falls back to system fonts and snapshots will (correctly) fail.

Baselines are rendered by headless Chromium. Locally the script uses
Playwright's pinned build when present, otherwise it falls back to any
Chromium/headless-shell found under `PLAYWRIGHT_BROWSERS_PATH`. If a Chromium
major-version jump or runner-image font change causes wholesale drift, re-record
with `npm run visual:update` and review the PNG diffs in the PR.
