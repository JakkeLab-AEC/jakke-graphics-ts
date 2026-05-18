# jakke-graphics-ts

`jakke-graphics-ts` is a TypeScript geometry and graphics utility library for
2D/3D computational geometry work. It is used by JakkeLab modeling tools and is
kept close to zero runtime dependencies: the package has no `dependencies`, and
all tooling lives under `devDependencies`.

## Intended Use

Use this package when a TypeScript project needs reusable geometric primitives
and algorithms without pulling a rendering or CAD framework into runtime code.

Current public API areas include:

- plain geometry types: `Vertex2d`, `Vertex3d`, `Line`, `Line2d`, `Triangle`,
  `Polyline2d`, `Polyline3d`, `BoundingBox2d`, and `BoundingBox3d`
- vector math through `VectorUtils`
- line and polyline evaluation through `LineEvaluation` and `PolylineUtils`
- polygon helpers through `PolygonUtils`
- bounding boxes, OBB, BVH, and collision helpers
- convex hull and point evaluation utilities

## Compatibility

Existing consumers depend on the current API surface. Do not remove, rename, or
change the behavior of existing exports without a deliberate compatibility plan.
Some existing names contain historical spelling mistakes, such as
`computeContexHull2d` and `lineManipluationUtils`; keep those names available
when adding corrected aliases.

## Installation

```bash
npm install jakke-graphics-ts
```

## Example

```ts
import { VectorUtils, type Vertex3d } from "jakke-graphics-ts";

const a: Vertex3d = { x: 0, y: 0, z: 0 };
const b: Vertex3d = { x: 3, y: 4, z: 0 };

const distance = VectorUtils.getDist(a, b);
const direction = VectorUtils.chain(b).subtract(a).normalize().value();
```

## Documentation

Generated API documentation is stored in `docs/` and can be rebuilt with
TypeDoc:

```text
cmd /c npm run docs
```

The published documentation site is:

https://jakkelab-aec.github.io/jakke-graphics-ts

Agent-facing API rules live in `.agents/API_CONTRACT.md`.

## Development

Use `cmd /c` from PowerShell if local script policy blocks npm shims:

```text
cmd /c npm install
cmd /c npm run typecheck
cmd /c npm test -- --runInBand
cmd /c npm run docs
cmd /c npm run build
```

`npm run build` compiles TypeScript and creates an npm tarball in `packed/`.
