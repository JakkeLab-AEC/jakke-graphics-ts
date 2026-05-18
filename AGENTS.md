# AGENTS.md

This is the top-level working guide for agents in
`E:\DEV\Projects\jakke-graphics-ts`.

The repository is a TypeScript computational geometry library. Its primary
purpose is to provide reusable 2D/3D geometry primitives and algorithms for
graphics, BIM, and modeling applications while staying close to zero runtime
dependencies.

Last updated: 2026-05-18

## Work Logs

For code, API, architecture, build, or documentation changes, create or update a
concise work log under `.agents/logs/`.

Use this file name pattern:

```text
.agents/logs/YYYY-MM-DD-topic.md
```

Include:

- local date/time
- workspace path
- changed files
- API, behavior, tooling, or documentation changes
- verification commands and results
- deferred TODOs

## Project Purpose

This package provides a stable base of geometry utilities for TypeScript
applications that need deterministic, framework-independent geometry code.

Goals:

- keep runtime `dependencies` empty unless there is an explicit decision to
  break the zero-dependency policy
- expose plain TypeScript object types for common 2D/3D geometry primitives
- keep algorithms reusable across rendering engines and product domains
- preserve compatibility for existing modeling applications using this package
- generate navigable TypeDoc API documentation for users and coding agents

Non-goals:

- renderer, viewport, Electron, backend, database, or app-shell code
- full CAD/BIM feature parity
- domain-specific business rules inside generic geometry utilities
- adding runtime libraries for problems that can be solved with local code

## Reading Order

1. `AGENTS.md`
2. `.agents/DOCUMENT_INDEX.md`
3. `.agents/API_CONTRACT.md`
4. `.agents/WORKFLOW.md`
5. `README.md`
6. Generated TypeDoc pages under `docs/` when API lookup is needed

## Library Structure

### Public Entry Point

`src/index.ts` defines the package-root export surface. Treat everything
exported from that file as compatibility-sensitive public API.

### Geometry Models

Primary paths:

- `src/models/types/basicGeometries.ts`
- `src/models/types/errorMessages.ts`
- `src/models/bvhTree.ts`
- `src/models/mesh.ts`

Use plain data shapes for primitives. Avoid hidden class state unless a class is
already the established API for that feature.

### Geometry Utilities

Primary paths:

- `src/utils/vectorUtils.ts`
- `src/utils/lineEvaluationUtils.ts`
- `src/utils/lineManipluationUtils.ts`
- `src/utils/polylineUtils.ts`
- `src/utils/polygonUtils.ts`
- `src/utils/collisionUtils.ts`
- `src/utils/convexHullUtils.ts`
- `src/utils/obbUtils.ts`
- `src/utils/pointEvaluationUtils.ts`

Keep algorithms deterministic and independent from rendering engines,
application state, filesystem access, and browser APIs.

### Documentation And Tooling

Primary paths:

- `README.md`
- `typedoc.json`
- `docs/`
- `.agents/*`
- `package.json`

## Task Routing

### API Or Algorithm Changes

Primary paths:

- `src/index.ts`
- `src/models/**/*`
- `src/utils/**/*`
- `__tests__/**/*`

Preserve the existing API before adding new exports. Add focused tests for new
geometry behavior and degenerate cases.

### Documentation Changes

Primary paths:

- `README.md`
- `.agents/DOCUMENT_INDEX.md`
- `.agents/API_CONTRACT.md`
- `.agents/WORKFLOW.md`
- TypeDoc comments in `src/**/*`

Keep user-facing README content concise. Put detailed coding-agent API rules in
`.agents/API_CONTRACT.md`.

### Build And Publish

Primary paths:

- `package.json`
- `package-lock.json`
- `pack.config.js`
- `tsconfig.json`
- `typedoc.json`

Do not add runtime `dependencies` without explicit approval. New tooling should
be added to `devDependencies`.

## Core Rules

- Actual code is the source of truth when docs disagree.
- Preserve all current public exports and behavior unless the user explicitly
  requests a breaking change.
- Keep the package zero-dependency by default. Runtime code must not import
  third-party packages.
- Keep geometry primitives as plain numeric objects unless an existing class API
  already applies.
- Treat coordinates as unitless numbers. Consumers decide whether values mean
  millimeters, meters, pixels, or another unit.
- Avoid unnecessary allocations in hot geometry loops, but do not obscure simple
  algorithms prematurely.
- Keep historical misspellings available for compatibility. Add corrected names
  only as aliases or additional exports.
- New public APIs need TypeScript types, JSDoc/TypeDoc comments, and tests.
- Update `.agents/API_CONTRACT.md` and README/TypeDoc comments when changing
  public API conventions.

## Verification

Choose checks based on change risk:

```powershell
cmd /c npm run typecheck
cmd /c npm test -- --runInBand
cmd /c npm run docs
cmd /c npm run build
```

Documentation-only changes do not require packaging, but should still be checked
with search, TypeDoc generation when relevant, and `git status --short`.

## Final Response Requirements

Summaries should include:

- changed files
- affected layer: API, algorithm, docs, or tooling
- runtime dependency impact
- API compatibility impact
- TypeDoc/documentation impact, if any
- verification performed or intentionally skipped
