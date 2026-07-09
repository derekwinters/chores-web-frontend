# CLAUDE.md — Developer and AI Agent Reference

This repo is the React frontend for chores-web. The FastAPI backend lives in
`derekwinters/chores-web-backend`; user-facing docs and the API contract
(golden `openapi.json` + `API_VERSION`) live in `derekwinters/chores-web-docs`.

## API Usage

All API routes are versioned under `/api/v1/`; nginx proxies `/api/` and the
unversioned `/status/` endpoints to the backend service. When the backend
introduces `/api/v{N+1}/`, migrate calls deliberately — the contract source
of truth is `chores-web-docs/docs/api/openapi.json`.

## Theming

All colors and visual primitives MUST use the CSS custom properties defined
in `src/index.css` (the 9-color theme system: background, surface, surface2,
primary, secondary, accent, error, success, warning). Never hardcode color
values in component CSS — runtime themes come from the backend and override
these variables.

## Releases

Versioning is automated with release-please (config under
`.github/release-please/`). The squash-merged PR title is the conventional
commit that drives version bumps. Releases publish
`ghcr.io/derekwinters/chores-web-frontend`.
