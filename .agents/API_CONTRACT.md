# API Contract

This document is the coding-agent reference for using and extending
`jakke-graphics-ts`.

## Public Surface

The package-root public API is defined by `src/index.ts`. Treat existing exports
as compatibility-sensitive:

- `BVHTree`, `BVHTriangle`, `BVHBoundingBox`, and `BVHHit`
- `BVHVertex`
- `computeContexHull2d`
- `computeOBB2d`
- `PointEvaluationUtils`
- geometry types from `basicGeometries`
- `ActionResult`
- `VectorUtils`
- `VectorChain`
- `LineEvaluation`
- `CollisionUtils`
- `Direction`
- `LineManipulationUtils`
- `Polyline2dEvaluationFactor`, `FlagsStrict`, `IntersectionInfo`, and
  `PointInAreaResult`
- `PolylineUtils`
- `PolygonUtils`

Do not remove or rename existing exports. Historical spelling mistakes are part
of the compatibility surface; keep names such as `computeContexHull2d` and the
`lineManipluationUtils` file path available when adding corrected aliases.

## Dependency Policy

Runtime code must remain dependency-free by default. `package.json` should not
gain a `dependencies` section unless the user explicitly approves a policy
change. Build, test, packaging, and documentation tools belong in
`devDependencies`.

## Geometry Data Shapes

Use the existing plain object shapes:

- `Vertex2d`: `{ x: number; y: number }`
- `Vertex3d`: `{ x: number; y: number; z: number }`
- `Line2d`: `{ p0: Vertex2d; p1: Vertex2d }`
- `Line`: `{ p0: Vertex3d; p1: Vertex3d }`
- `Triangle`: `{ p0: Vertex3d; p1: Vertex3d; p2: Vertex3d }`
- `Polyline2d`: `Vertex2d[]`
- `Polyline3d`: `Vertex3d[]`
- `BoundingBox2d` and `BoundingBox3d`

Coordinates are unitless. Do not bake millimeter, meter, pixel, or scene-unit
assumptions into generic APIs.

## Return Conventions

- Return new geometry objects instead of mutating inputs unless an existing API
  clearly documents mutation.
- Use `undefined` for ordinary "no geometric result" cases when that matches
  neighboring APIs.
- Avoid throwing for expected degeneracy such as parallel lines, empty
  polylines, invalid triangles, or non-intersections.
- Use explicit result objects when callers need diagnostic flags, as seen in
  polygon and polyline helpers.
- Keep numeric tolerance local and documented. Add an optional `eps` parameter
  only when callers need control over tolerance.

## Namespace Conventions

Existing utilities are grouped in namespaces:

- `VectorUtils` for vector arithmetic, conversion, bounding boxes, and chained
  operations.
- `LineEvaluation` for point-on-line, intersections, parameters, and foot-point
  calculations.
- `LineManipulationUtils` for line transformations.
- `PolylineUtils` for length, foot-point, intersection, and point-in-area
  helpers.
- `PolygonUtils` for planar checks, triangle splitting, barycentric evaluation,
  and point-in-triangle checks.
- `CollisionUtils` for bounding box, line, triangle, and surface collision
  helpers.

When adding related functions, prefer the existing namespace for that concept.
If a new concept is large enough to justify its own file, export it from
`src/index.ts` only after deciding it is intended public API.

## Documentation Requirements

Public APIs should have concise JSDoc comments that explain:

- what the function or type represents
- parameter and return semantics
- degenerate cases and `undefined` returns
- tolerance or coordinate assumptions

TypeDoc is configured through `typedoc.json` and generated with:

```powershell
cmd /c npm run docs
```

Generated docs are written to `docs/`. Do not hand-edit generated TypeDoc HTML.

## Compatibility Rules For New Work

- Add new APIs without changing old call signatures.
- Add aliases instead of renaming existing names.
- Keep old behavior unless a test and user request justify changing it.
- Add tests for normal cases, boundary cases, and degenerate geometry.
- Update README, TypeDoc comments, and this contract when a new public API family
  is introduced.
