---
name: implementation-finalize
description: Push branch to origin and create pull request. Does NOT commit — commits happen at doc-pre and after user approval. Removes in-development label. PR title uses conventional commit format.
---

# Implementation Finalize Skill

Pushes branch to origin and creates the pull request. Commits are made at earlier stages; this skill handles push and PR creation only.

## Usage

```
/implementation-finalize <issue-number> <commit-type>
```

## Workflow

1. **Push branch**: `git push -u origin <branch-name>`
2. **Create PR**:
   - Title: conventional commit format — `<type>: <description> (#<number>)`
   - Body: opens with `## Deviations and Decisions` (the block composed at the
     orchestrator's reflect state, `None.` under any empty subsection), then
     `## Summary` bullets, then `## Implementation`, then `Closes #<number>` on
     its own line (see PR Format below)
3. **Remove `in-development` label**: `gh issue edit <N> --remove-label "in-development"`
4. **Return PR URL**

## Parameters

- `issue_number` (required): GitHub issue number
- `commit_type` (required): Type of commit (feat, fix, refactor, docs, test, chore)

## PR Format

The body opens with `## Deviations and Decisions` (composed by the orchestrator
at its reflect state), present even when empty, followed by `## Summary`,
`## Implementation`, and a bare `Closes #<number>` line:

```
Title: <type>: <description> (#<issue-number>)

Body:
## Deviations and Decisions

### Deviations
- **<file/area>**: <what deviated from the contract and why>.

### Decisions
- **<ambiguity>**: <how it was resolved>.  Prevention: <what would prevent recurrence>.

## Summary
- <bullet points summarizing changes>

## Implementation
- Changes: <what changed, by area — UI, API Client, Theming/Tokens, Routing, Tests/Stories, Docs>
- Tests: <what was tested>

Closes #<issue-number>
```

An empty `### Deviations` or `### Decisions` subsection emits `None.` under its
heading (the heading still appears).

## Theming Check (frontend)

Before finalizing, confirm no hardcoded color values were introduced in
component CSS — all colors and visual primitives must use the CSS custom
properties from `src/index.css` / `@derekwinters/design-tokens` (per `CLAUDE.md`
"Theming"; `src/__tests__/designTokens.test.js` enforces part of this). This
mirrors the check in `implementation-verify` and guards the same invariant at
push time.

## Milestone Mode

When invoked with `existing_pr` (milestone mode), this skill pushes to the existing shared branch and does **not** create a PR or touch the PR body — the milestone orchestrator owns the PR body exclusively (see `milestone-implementation-orchestrator.md`). It returns a short summary (issue number, title, commit subject) for the orchestrator to use when ticking that issue's checkbox.

## Notes

- Does NOT stage or commit — commits happen at:
  - doc-pre stage: `docs:` commit for documentation updates
  - after user approval: `feat:/fix:/refactor:` commit for code changes
  - doc-validate stage: `docs:` commit if corrections needed (conditional)
- PR title must follow conventional commit format
- "Closes #N" must appear on its own line to trigger GitHub auto-close (standalone mode)
- `in-development` label removed at this step (not at commit time) in standalone mode; in milestone mode the milestone orchestrator removes it after each issue completes
