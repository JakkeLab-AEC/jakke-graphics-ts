# Documentation Index

This index lists the active agent documents for `jakke-graphics-ts`.

## Primary Documents

- `AGENTS.md`
  - Top-level project rules, compatibility expectations, dependency policy, and
    verification commands.
- `.agents/API_CONTRACT.md`
  - Agent-facing API conventions for using and extending the geometry library.
- `.agents/WORKFLOW.md`
  - Standard edit, verification, and work-log flow.
- `README.md`
  - User-facing package overview, installation, examples, and docs commands.
- `typedoc.json`
  - TypeDoc generation settings.
- `docs/`
  - Generated API documentation.

## Source Map

### Package Entry

- `src/index.ts`

### Models

- `src/models/types/basicGeometries.ts`
- `src/models/types/errorMessages.ts`
- `src/models/bvhTree.ts`
- `src/models/mesh.ts`
- `src/models/basic/vertex3d.ts`

### Utilities

- `src/utils/vectorUtils.ts`
- `src/utils/lineEvaluationUtils.ts`
- `src/utils/lineManipluationUtils.ts`
- `src/utils/polylineUtils.ts`
- `src/utils/polygonUtils.ts`
- `src/utils/collisionUtils.ts`
- `src/utils/convexHullUtils.ts`
- `src/utils/obbUtils.ts`
- `src/utils/pointEvaluationUtils.ts`

### Tests

- `__tests__/*.test.ts`

## Reading Shortcuts

### Adding A Geometry Algorithm

1. `AGENTS.md`
2. `.agents/API_CONTRACT.md`
3. Relevant source file under `src/models` or `src/utils`
4. Existing tests under `__tests__`
5. Generated docs under `docs/` if API lookup is needed

### Changing Public API Documentation

1. `AGENTS.md`
2. `.agents/API_CONTRACT.md`
3. `README.md`
4. TypeDoc comments in the affected source files
5. `typedoc.json`

### Preparing Release Output

1. `AGENTS.md`
2. `package.json`
3. `pack.config.js`
4. `.npmignore`
5. `README.md`
