# Workflow

Use this workflow for repeated work in `jakke-graphics-ts`.

## Before Editing

1. Read `AGENTS.md`, `.agents/DOCUMENT_INDEX.md`, and
   `.agents/API_CONTRACT.md` when public API behavior is involved.
2. Identify the affected layer: API, algorithm, docs, tests, or tooling.
3. Check `git status --short`.
4. Inspect the relevant source and tests before deciding on an implementation.

## During Editing

- Keep changes scoped to the requested behavior.
- Preserve current public exports and historical names.
- Do not add runtime dependencies unless explicitly approved.
- Prefer plain object geometry types and deterministic utility functions.
- Add or update JSDoc comments for public APIs so TypeDoc remains useful.
- Update README or `.agents/*` docs when conventions, commands, or API contracts
  change.

## Verification

Choose checks based on risk:

```powershell
cmd /c npm run typecheck
cmd /c npm test -- --runInBand
cmd /c npm run docs
cmd /c npm run build
```

For documentation-only changes, use search and `git status --short`; run
`npm run docs` when TypeDoc configuration or public API documentation changes.

## Work Log

For code, API, tooling, or documentation changes, add a concise log under:

```text
.agents/logs/YYYY-MM-DD-topic.md
```

Include changed files, behavior or documentation impact, verification commands,
results, and any deferred TODOs.

## Final Response

Report:

- what changed
- which files changed
- affected layer
- dependency and API compatibility impact
- verification performed
- anything intentionally skipped
