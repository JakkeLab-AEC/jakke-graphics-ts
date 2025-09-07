import {
	BoundingBox2d,
	BoundingBox3d,
	Line,
	Triangle,
	Vertex2d,
	Vertex3d,
} from "../models/types/basicGeometries";
import { VectorUtils } from "./vectorUtils";
import { LineEvaluation } from "./lineEvaluationUtils";
import { ActionResult } from "../models/types/errorMessages";

const ZERO_VECTOR_TOLERANCE = 1e-6;
const UNIT_VECTOR_TOLERANCE = 1e-6;
const COLLISION_TOLERANCE = 1e-6;

type CollisionResult = {
	hasCollision: boolean;
	hasError: boolean;
	sectionByA?: number[];
	sectionByB?: number[];
};
export type SATSections = {
	setionByA: number[] | undefined;
	setionByB: number[] | undefined;
}[];

/**
 * Utility namespace for collision detection algorithms in 2D and 3D space.
 *
 * Provides functions for detecting collisions between bounding boxes using the Separating Axis Theorem (SAT),
 * as well as intersection calculations between lines and triangles. The utilities support both 2D and 3D
 * oriented bounding boxes, and offer detailed results including error handling and projection sections.
 *
 * @remarks
 * - All collision detection functions handle floating-point imprecision using configurable tolerances.
 * - Functions return detailed results including collision status, error information, and projection sections.
 * - Includes methods for both edge and surface intersection calculations between lines and triangles.
 * - Designed for use in graphics, physics, and geometry processing applications.
 */
export namespace CollisionUtils {
	/**
	 * Determines whether two 2D bounding boxes collide using the Separating Axis Theorem (SAT).
	 *
	 * The function projects both bounding boxes onto four axes (the local axes of each box)
	 * and checks for overlap in each projection. If the projections overlap on all axes,
	 * the boxes are colliding. Optionally, touching (contacting) boxes can be considered as colliding.
	 *
	 * @param boxA - The first bounding box to test for collision.
	 * @param boxB - The second bounding box to test for collision.
	 * @param includeContating - If `true`, boxes that are merely touching are considered colliding; otherwise, only overlapping boxes are considered colliding. Defaults to `false`.
	 * @returns An `ActionResult` containing a boolean indicating collision, an array of SAT section results, and error information if applicable.
	 *
	 * @remarks
	 * - Returns an error if either bounding box has a zero-length axis.
	 * - Uses a tolerance value to handle floating-point imprecision when checking for separation.
	 * - The returned `args` array contains the projected sections for each axis.
	 */
	export function hasBoundingBoxCollision2d(
		boxA: BoundingBox2d,
		boxB: BoundingBox2d,
		includeContating = false
	): ActionResult<SATSections> {
		// Filter the case when zero vectors are given.
		if (
			VectorUtils.getSize({ ...boxA.uAxis, z: 0 }) <=
				ZERO_VECTOR_TOLERANCE ||
			VectorUtils.getSize({ ...boxB.uAxis, z: 0 }) <=
				ZERO_VECTOR_TOLERANCE
		) {
			return {
				result: false,
				hasError: true,
				message: "The vector of each boundingbox should not be zero.",
			};
		}

		const uAxisOfA = VectorUtils.normalize({ ...boxA.uAxis, z: 0 });
		const vAxisOfA = VectorUtils.rotateOnXY(
			{ ...uAxisOfA, z: 0 },
			Math.PI * 0.5
		);

		const uAxisOfB = VectorUtils.normalize({ ...boxB.uAxis, z: 0 });
		const vAxisOfB = VectorUtils.rotateOnXY(
			{ ...uAxisOfB, z: 0 },
			Math.PI * 0.5
		);

		const axes = [uAxisOfA, vAxisOfA, uAxisOfB, vAxisOfB];

		// Get all pts of A
		const p0OfA = { ...boxA.anchor, z: 0 };
		const p1OfA = VectorUtils.add(
			{ ...boxA.anchor, z: 0 },
			VectorUtils.scale({ ...uAxisOfA, z: 0 }, boxA.length.u)
		);
		const p3OfA = VectorUtils.add(
			{ ...boxA.anchor, z: 0 },
			VectorUtils.scale({ ...vAxisOfA, z: 0 }, boxA.length.v)
		);
		const p2OfA = VectorUtils.add(
			p1OfA,
			VectorUtils.scale({ ...vAxisOfA, z: 0 }, boxA.length.v)
		);

		// Get all pts of B
		const p0OfB = { ...boxB.anchor, z: 0 };
		const p1OfB = VectorUtils.add(
			{ ...boxB.anchor, z: 0 },
			VectorUtils.scale({ ...uAxisOfB, z: 0 }, boxB.length.u)
		);
		const p3OfB = VectorUtils.add(
			{ ...boxB.anchor, z: 0 },
			VectorUtils.scale({ ...vAxisOfB, z: 0 }, boxB.length.v)
		);
		const p2OfB = VectorUtils.add(
			p1OfB,
			VectorUtils.scale({ ...vAxisOfB, z: 0 }, boxB.length.v)
		);

		const collisionResult: CollisionResult[] = axes.map((axis) => {
			// Get all foot point on axis of A
			const ptsOnAxisFromA = [
				LineEvaluation.getFootPointOnDirection(axis, p0OfA),
				LineEvaluation.getFootPointOnDirection(axis, p1OfA),
				LineEvaluation.getFootPointOnDirection(axis, p2OfA),
				LineEvaluation.getFootPointOnDirection(axis, p3OfA),
			];

			const ptsOnAxisFromB = [
				LineEvaluation.getFootPointOnDirection(axis, p0OfB),
				LineEvaluation.getFootPointOnDirection(axis, p1OfB),
				LineEvaluation.getFootPointOnDirection(axis, p2OfB),
				LineEvaluation.getFootPointOnDirection(axis, p3OfB),
			];

			// Filter the case when pts has undefined;
			const checkUndefinedPtsA = ptsOnAxisFromA.every(
				(p) => p !== undefined
			);
			const checkUndefinedPtsB = ptsOnAxisFromB.every(
				(p) => p !== undefined
			);

			if (!checkUndefinedPtsA || !checkUndefinedPtsB) {
				return { hasError: true, hasCollision: false };
			}

			const sortedParamsFromA = ptsOnAxisFromA
				.sort((a, b) => a.t - b.t)
				.map((a) => a.t);

			const sortedParamsFromB = ptsOnAxisFromB
				.sort((a, b) => a.t - b.t)
				.map((a) => a.t);

			const sectionByA = [sortedParamsFromA[0], sortedParamsFromA[3]];
			const sectionByB = [sortedParamsFromB[0], sortedParamsFromB[3]];

			let isSeparated: boolean;
			if (includeContating) {
				isSeparated =
					sectionByA[1] < sectionByB[0] - COLLISION_TOLERANCE ||
					sectionByB[1] < sectionByA[0] - COLLISION_TOLERANCE;
			} else {
				isSeparated =
					sectionByA[1] < sectionByB[0] + COLLISION_TOLERANCE ||
					sectionByB[1] < sectionByA[0] + COLLISION_TOLERANCE;
			}
			return {
				hasError: false,
				hasCollision: !isSeparated,
				sectionByA,
				sectionByB,
			};
		});

		return {
			result: collisionResult.every(
				(result) => !result.hasError && result.hasCollision
			),
			args: collisionResult.map((result) => {
				return {
					setionByA: result.sectionByA,
					setionByB: result.sectionByB,
				};
			}),
		};
	}

	/**
	 * Determines whether two 3D bounding boxes collide using the Separating Axis Theorem (SAT).
	 *
	 * This function checks for collision between two oriented bounding boxes (OBBs) in 3D space.
	 * It validates the input axes, ensures perpendicularity, and projects the box corners onto
	 * relevant axes to detect separation. Optionally, it can include contacting (touching) cases
	 * as collisions.
	 *
	 * @param boxA - The first bounding box, defined by anchor, axes, and lengths.
	 * @param boxB - The second bounding box, defined by anchor, axes, and lengths.
	 * @param includeContating - If true, boxes that are merely touching are considered colliding. Defaults to false.
	 * @returns An {@link ActionResult} containing the SAT section results, collision status, and error information.
	 *
	 * @remarks
	 * - Returns an error if any axis is a zero vector or if the u/v axes of a box are not perpendicular.
	 * - Uses a tolerance for zero vectors and perpendicularity checks.
	 * - The result includes detailed projection sections for each axis tested.
	 */
	export function hasBoundingBoxCollision3d(
		boxA: BoundingBox3d,
		boxB: BoundingBox3d,
		includeContating = false
	): ActionResult<SATSections> {
		// Filter the case when zero vectors are given.
		const hasZeroVectors = [
			boxA.uAxis,
			boxA.vAxis,
			boxB.uAxis,
			boxB.vAxis,
		].some((axis) => VectorUtils.getSize(axis) <= ZERO_VECTOR_TOLERANCE);

		if (hasZeroVectors) {
			return {
				result: false,
				hasError: true,
				message: "Some axes are zero vector.",
			};
		}

		// Filter the case when u, v axes are not perpendicular.
		const uAxisA = VectorUtils.normalize(boxA.uAxis);
		const vAxisA = VectorUtils.normalize(boxA.vAxis);
		const uAxisB = VectorUtils.normalize(boxB.uAxis);
		const vAxisB = VectorUtils.normalize(boxB.vAxis);

		const isPerpendicularA =
			Math.abs(VectorUtils.dot(uAxisA, vAxisA)) < UNIT_VECTOR_TOLERANCE;
		const isPerpendicularB =
			Math.abs(VectorUtils.dot(uAxisB, vAxisB)) < UNIT_VECTOR_TOLERANCE;
		if (!isPerpendicularA || !isPerpendicularB) {
			return {
				result: false,
				hasError: true,
				message:
					"U, V axis of each box should be perpendicular to each other.",
			};
		}

		const nAxisA = VectorUtils.normalize(VectorUtils.cross(uAxisA, vAxisA));
		const nAxisB = VectorUtils.normalize(VectorUtils.cross(uAxisB, vAxisB));

		const p0A = { ...boxA.anchor };
		const p1A = VectorUtils.add(
			{ ...p0A },
			VectorUtils.scale(uAxisA, boxA.length.u)
		);
		const p2A = VectorUtils.add(
			{ ...p1A },
			VectorUtils.scale(vAxisA, boxA.length.v)
		);
		const p3A = VectorUtils.add(
			{ ...p0A },
			VectorUtils.scale(vAxisA, boxA.length.v)
		);
		const p4A = VectorUtils.add(
			{ ...p0A },
			VectorUtils.scale(nAxisA, boxA.length.n)
		);
		const p5A = VectorUtils.add(
			{ ...p1A },
			VectorUtils.scale(nAxisA, boxA.length.n)
		);
		const p6A = VectorUtils.add(
			{ ...p2A },
			VectorUtils.scale(nAxisA, boxA.length.n)
		);
		const p7A = VectorUtils.add(
			{ ...p3A },
			VectorUtils.scale(nAxisA, boxA.length.n)
		);

		const p0B = { ...boxB.anchor };
		const p1B = VectorUtils.add(
			{ ...p0B },
			VectorUtils.scale(uAxisB, boxB.length.u)
		);
		const p2B = VectorUtils.add(
			{ ...p1B },
			VectorUtils.scale(vAxisB, boxB.length.v)
		);
		const p3B = VectorUtils.add(
			{ ...p0B },
			VectorUtils.scale(vAxisB, boxB.length.v)
		);
		const p4B = VectorUtils.add(
			{ ...p0B },
			VectorUtils.scale(nAxisB, boxB.length.n)
		);
		const p5B = VectorUtils.add(
			{ ...p1B },
			VectorUtils.scale(nAxisB, boxB.length.n)
		);
		const p6B = VectorUtils.add(
			{ ...p2B },
			VectorUtils.scale(nAxisB, boxB.length.n)
		);
		const p7B = VectorUtils.add(
			{ ...p3B },
			VectorUtils.scale(nAxisB, boxB.length.n)
		);

		const axes = [uAxisA, vAxisA, nAxisA, uAxisB, vAxisB, nAxisB];
		const collisionResult: CollisionResult[] = axes.map((axis) => {
			const ptsOnAxisFromA = [
				LineEvaluation.getFootPointOnDirection(axis, p0A),
				LineEvaluation.getFootPointOnDirection(axis, p1A),
				LineEvaluation.getFootPointOnDirection(axis, p2A),
				LineEvaluation.getFootPointOnDirection(axis, p3A),
				LineEvaluation.getFootPointOnDirection(axis, p4A),
				LineEvaluation.getFootPointOnDirection(axis, p5A),
				LineEvaluation.getFootPointOnDirection(axis, p6A),
				LineEvaluation.getFootPointOnDirection(axis, p7A),
			];

			const ptsOnAxisFromB = [
				LineEvaluation.getFootPointOnDirection(axis, p0B),
				LineEvaluation.getFootPointOnDirection(axis, p1B),
				LineEvaluation.getFootPointOnDirection(axis, p2B),
				LineEvaluation.getFootPointOnDirection(axis, p3B),
				LineEvaluation.getFootPointOnDirection(axis, p4B),
				LineEvaluation.getFootPointOnDirection(axis, p5B),
				LineEvaluation.getFootPointOnDirection(axis, p6B),
				LineEvaluation.getFootPointOnDirection(axis, p7B),
			];

			// Filter the case when pts has undefined;
			const checkUndefinedPtsA = ptsOnAxisFromA.every(
				(p) => p !== undefined
			);
			const checkUndefinedPtsB = ptsOnAxisFromB.every(
				(p) => p !== undefined
			);

			if (!checkUndefinedPtsA || !checkUndefinedPtsB) {
				return { hasError: true, hasCollision: false };
			}

			const sortedParamsFromA = ptsOnAxisFromA
				.sort((a, b) => a.t - b.t)
				.map((a) => a.t);

			const sortedParamsFromB = ptsOnAxisFromB
				.sort((a, b) => a.t - b.t)
				.map((a) => a.t);

			const sectionByA = [sortedParamsFromA[0], sortedParamsFromA[7]];
			const sectionByB = [sortedParamsFromB[0], sortedParamsFromB[7]];

			let isSeparated: boolean;
			if (includeContating) {
				isSeparated =
					sectionByA[1] < sectionByB[0] - COLLISION_TOLERANCE ||
					sectionByB[1] < sectionByA[0] - COLLISION_TOLERANCE;
			} else {
				isSeparated =
					sectionByA[1] < sectionByB[0] + COLLISION_TOLERANCE ||
					sectionByB[1] < sectionByA[0] + COLLISION_TOLERANCE;
			}

			return {
				hasError: false,
				hasCollision: !isSeparated,
				sectionByA,
				sectionByB,
			};
		});

		const containsError = collisionResult.some((r) => r.hasError);
		const containSeparated = collisionResult.some((r) => !r.hasCollision);
		return {
			result: !containSeparated,
			hasError: containsError,
			args: collisionResult.map((result) => {
				return {
					setionByA: result.sectionByA,
					setionByB: result.sectionByB,
				};
			}),
		};
	}

	/**
	 * Computes the intersection points between a given line and the edges of a triangle.
	 *
	 * For each edge of the triangle, checks if the line intersects it, and collects all intersection points.
	 * The resulting intersection points are sorted along the line according to their parameter `t`.
	 *
	 * @param line - The line to test for intersection with the triangle edges.
	 * @param triangle - The triangle whose edges are tested for intersection.
	 * @returns An array of objects, each containing:
	 *   - `t`: The parameter value along the line where the intersection occurs.
	 *   - `p`: The intersection point as a `Vertex3d`.
	 */
	export function getCollisionLineWithTriangleEdges(
		line: Line,
		triangle: Triangle,
		options?: {
			includeEndpointInside?: boolean;
			epsilon?: number;
			dedupeEpsilon?: number;
		}
	) {
		const includeEndpointInside = options?.includeEndpointInside ?? true;
		const eps = options?.epsilon ?? 1e-6;
		const de = options?.dedupeEpsilon ?? 1e-6;

		const AB: Line = { p0: triangle.p0, p1: triangle.p1 };
		const BC: Line = { p0: triangle.p1, p1: triangle.p2 };
		const CA: Line = { p0: triangle.p2, p1: triangle.p0 };

		const hitAB = LineEvaluation.getIntersection(line, AB);
		const hitBC = LineEvaluation.getIntersection(line, BC);
		const hitCA = LineEvaluation.getIntersection(line, CA);

		const pts: Vertex3d[] = [];
		if (hitAB.result && hitAB.pt) pts.push(hitAB.pt);
		if (hitBC.result && hitBC.pt) pts.push(hitBC.pt);
		if (hitCA.result && hitCA.pt) pts.push(hitCA.pt);

		if (includeEndpointInside) {
			if (isPointInTriangle(line.p0, triangle, eps)) pts.push(line.p0);
			if (isPointInTriangle(line.p1, triangle, eps)) pts.push(line.p1);
		}

		const hits = pts
			.map((p) => ({
				t: LineEvaluation.getParameterOnLine(line.p0, line.p1, p),
				p,
			}))
			.sort((a, b) => a.t - b.t);

		const deduped = dedupeByT(hits, de);

		return deduped;
	}

	/**
	 * Removes duplicate intersection points from a sorted array based on the parameter `t` or coordinates.
	 *
	 * @param sorted - Array of intersection objects, each with a parameter `t` and point `p`.
	 * @param eps - Tolerance for considering two `t` values as duplicates. Defaults to 1e-6.
	 * @returns A deduplicated array of intersection objects.
	 */
	function dedupeByT(sorted: { t: number; p: Vertex3d }[], eps = 1e-6) {
		const out: { t: number; p: Vertex3d }[] = [];
		let lastT: number | undefined;
		for (const h of sorted) {
			if (lastT === undefined || Math.abs(h.t - lastT) > eps) {
				out.push(h);
				lastT = h.t;
			}
		}
		return out;
	}

	/**
	 * Checks if a point is inside or on the boundary of a triangle (coplanar and all barycentric coordinates >= -eps).
	 *
	 * @param pt - The point to check.
	 * @param tri - The triangle to test against.
	 * @param eps - Tolerance for floating-point comparison. Defaults to 1e-8.
	 * @returns `true` if the point is inside or on the boundary of the triangle, otherwise `false`.
	 */
	function isPointInTriangle(
		pt: Vertex3d,
		tri: Triangle,
		eps = 1e-8
	): boolean {
		if (!isCoplanar(pt, tri, eps)) return false;
		const bc = barycentricOnTriangle(pt, tri, eps);
		if (!bc) return false;
		const { u, v, w } = bc;
		return u >= -eps && v >= -eps && w >= -eps; // 경계 포함
	}

	/**
	 * Computes the barycentric coordinates (u, v, w) of a point with respect to a triangle in 3D space.
	 *
	 * @param pt - The point for which to compute barycentric coordinates.
	 * @param tri - The triangle, defined by three vertices (p0, p1, p2).
	 * @param eps - Optional epsilon value for numerical stability; if the triangle's area is near zero, returns `undefined`.
	 * @returns An object containing the barycentric coordinates `{ u, v, w }`, or `undefined` if the triangle is degenerate.
	 */
	function barycentricOnTriangle(
		pt: Vertex3d,
		tri: Triangle,
		eps = 1e-12
	): { u: number; v: number; w: number } | undefined {
		const v0 = VectorUtils.subtract(tri.p1, tri.p0);
		const v1 = VectorUtils.subtract(tri.p2, tri.p0);
		const v2 = VectorUtils.subtract(pt, tri.p0);

		const d00 = VectorUtils.dot(v0, v0);
		const d01 = VectorUtils.dot(v0, v1);
		const d11 = VectorUtils.dot(v1, v1);
		const d20 = VectorUtils.dot(v2, v0);
		const d21 = VectorUtils.dot(v2, v1);

		const denom = d00 * d11 - d01 * d01;
		if (Math.abs(denom) < eps) return; // 면적 ~ 0
		const v = (d11 * d20 - d01 * d21) / denom;
		const w = (d00 * d21 - d01 * d20) / denom;
		const u = 1 - v - w;
		return { u, v, w };
	}

	function isCoplanar(pt: Vertex3d, tri: Triangle, eps = 1e-8): boolean {
		const n = VectorUtils.cross(
			VectorUtils.subtract(tri.p1, tri.p0),
			VectorUtils.subtract(tri.p2, tri.p0)
		);
		const dist = VectorUtils.dot(n, VectorUtils.subtract(pt, tri.p0));
		return Math.abs(dist) <= eps * VectorUtils.getSize(n);
	}

	/**
	 * Calculates the intersection point between a line and the surface of a triangle in 3D space.
	 *
	 * The function returns the intersection point as a `Vertex3d` if the line intersects the triangle surface,
	 * or `undefined` if there is no valid intersection (e.g., the intersection point lies outside the triangle).
	 *
	 * @param line - The line to test for intersection, represented by two points (`p0` and `p1`).
	 * @param triangle - The triangle surface, represented by three vertices (`p0`, `p1`, and `p2`).
	 * @returns The intersection point as a `Vertex3d` if the line intersects the triangle surface, otherwise `undefined`.
	 */
	export function getCollisionLineWithTriangleSurface(
		line: Line,
		triangle: Triangle
	): Vertex3d | undefined {
		if (isDetZero(line, triangle)) return;

		const v0 = triangle.p0;
		const v1 = triangle.p1;
		const v2 = triangle.p2;

		const p0 = line.p0;
		const p1 = line.p1;

		const v0v1 = VectorUtils.subtract(v1, v0);
		const v0v2 = VectorUtils.subtract(v2, v0);
		const v0p0 = VectorUtils.subtract(p0, v0);
		const d = VectorUtils.chain(p1).subtract(p0).normalize().value();

		const det = VectorUtils.dot(v0v1, VectorUtils.cross(d, v0v2));

		const v = VectorUtils.dot(d, VectorUtils.cross(v0v2, v0p0)) / det;
		const w = VectorUtils.dot(d, VectorUtils.cross(v0p0, v0v1)) / det;
		const u = 1 - (v + w);

		const result = VectorUtils.chain(v0)
			.scale(u)
			.add(VectorUtils.scale(v1, v))
			.add(VectorUtils.scale(v2, w))
			.value();

		const validParams = [u, v, w].every((val) => val >= 0 && val <= 1);
		return validParams ? result : undefined;
	}

	function isDetZero(line: Line, triangle: Triangle) {
		const v0v1 = VectorUtils.subtract(triangle.p1, triangle.p0);
		const v0v2 = VectorUtils.subtract(triangle.p2, triangle.p0);
		const d = VectorUtils.subtract(line.p1, line.p0);
		const det = VectorUtils.dot(v0v1, VectorUtils.cross(d, v0v2));
		return det === 0;
	}
}
