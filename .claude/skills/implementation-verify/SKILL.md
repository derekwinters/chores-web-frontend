---
name: implementation-verify
description: Verify the vite production build compiles cleanly and show changes summary for user review
---

# Implementation Verify Skill

Runs the vite production build (`npm run build`) to verify the app compiles cleanly, then shows a summary of changes for user review.

## Usage

```
/implementation-verify <issue-number>
```

## Workflow

1. **Build**: `npm run build` (vite production build)
2. **Verify build succeeded**: Check exit code, report any compile/bundle errors
3. **Theming check** (CSS custom properties only): confirm no hardcoded color
   values were introduced in component CSS. All colors and visual primitives
   must use the CSS custom properties from `src/index.css` /
   `@derekwinters/design-tokens` — never hardcoded values (per `CLAUDE.md`
   "Theming"). `src/__tests__/designTokens.test.js` enforces part of this; flag
   any hardcoded color so it is fixed before commit rather than tripping the test.
4. **Prepare changes summary**:
   - List all files modified
   - Show line change counts
   - Summarize implementation
   - Display test results
5. **Pause workflow**: Wait for user approval or request for changes

## Parameters

- `issue_number` (optional): For reference in output

## Output

Shows:
- Files modified with line counts
- Implementation summary
- Test results
- Build status
- Ready for user to:
  - Approve for commit
  - Request more changes
  - Abort

## Notes

- Called by orchestrator after tests pass
- Build verification (`npm run build`) confirms no compile/bundle errors introduced
- The theming check keeps hardcoded colors from reaching commit / tripping `src/__tests__/designTokens.test.js`
- Shows all changes before user reviews
- User has control point here
