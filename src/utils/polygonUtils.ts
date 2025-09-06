import {
	Line,
	Triangle,
	Vertex2d,
	Vertex3d,
} from "../models/types/basicGeometries";
import { LineEvaluation } from "./lineEvaluationUtils";
import { VectorUtils } from "./vectorUtils";

export namespace PolygonUtils {
	type SplittedTriangles = {
		t0?: { p0: Vertex3d; p1: Vertex3d; p2: Vertex3d };
		t1?: { p0: Vertex3d; p1: Vertex3d; p2: Vertex3d };
		result: boolean;
		flag: QuadrantSplitFlag;
	};

	type QuadrantSplitFlag = { notPlanar: boolean; invalidCase: boolean };

	type Quadrant = {
		p0: Vertex3d;
		p1: Vertex3d;
		p2: Vertex3d;
		p3: Vertex3d;
	};

	/**
	 * Splits a quadrilateral (quadrant) into two triangles if the points are coplanar.
	 *
	 * @param quadrant - An object containing four 3D vertices (p0, p1, p2, p3) representing the corners of the quadrilateral.
	 * @returns An object of type `SplittedTriangles`:
	 * - If the points are not coplanar, returns `result: false` and sets `flag.notPlanar` to true.
	 * - If the split is invalid, returns `result: false` and sets `flag.invalidCase` to true.
	 * - If successful, returns the two triangles (`t0`, `t1`), `result: true`, and flags set to false.
	 */
	export function splitQuadrant(quadrant: Quadrant): SplittedTriangles {
		const { p0, p1, p2, p3 } = quadrant;
		const planarTest = checkPtsOnPlanar(p0, p1, p2, p3);
		if (!planarTest.result)
			return {
				result: false,
				flag: { notPlanar: true, invalidCase: false },
			};

		const triangles = getTriangle(p0, p1, p2, p3);
		if (!triangles)
			return {
				result: false,
				flag: { notPlanar: false, invalidCase: true },
			};

		return {
			...triangles,
			result: true,
			flag: { notPlanar: false, invalidCase: false },
		};
	}

	function getTriangle(
		p0: Vertex3d,
		p1: Vertex3d,
		p2: Vertex3d,
		p3: Vertex3d
	): { t0: Triangle; t1: Triangle } | undefined {
		const p0p2: Line = { p0: p0, p1: p2 };
		const p1p3: Line = { p0: p1, p1: p3 };

		const intersection = LineEvaluation.getIntersection(
			p0p2,
			p1p3,
			false
		);

		if (!intersection) {
			const p0p2Test =
				VectorUtils.ccw(p0, p1, p2) >= 0 &&
				VectorUtils.ccw(p0, p3, p2) >= 0;

			const p1p3Test =
				VectorUtils.ccw(p1, p0, p3) >= 0 &&
				VectorUtils.ccw(p1, p2, p3) >= 0;

			if (p0p2Test === p1p3Test) return;

			if (p0p2Test) {
				return {
					t0: { p0, p1, p2 },
					t1: { p0, p1: p3, p2 },
				};
			}

			if (p1p3Test) {
				return {
					t0: { p0: p1, p1: p0, p2: p3 },
					t1: { p0: p1, p1: p2, p2: p3 },
				};
			}
		} else {
			const distP0P2 = VectorUtils.getDist(p0p2.p0, p0p2.p1);
			const distP1P3 = VectorUtils.getDist(p1p3.p0, p1p3.p1);

			if (distP0P2 > distP1P3) {
				return {
					t0: { p0: p1, p1: p3, p2: p0 },
					t1: { p0: p1, p1: p3, p2: p2 },
				};
			} else {
				return {
					t0: { p0: p0, p1: p2, p2: p1 },
					t1: { p0: p0, p1: p2, p2: p3 },
				};
			}
		}
	}

	const PLANARITY_TOLERANCE = 1e-20;

	type CheckPtsOnPlanarResult = {
		result: boolean;
		ptsNotEnough: boolean;
		notPlanar: boolean;
	};

	/**
	 * Checks whether a set of 3D points are coplanar (lie on the same plane).
	 *
	 * @param pts - A variable number of `Vertex3d` points to be checked for planarity.
	 * @returns An object of type `CheckPtsOnPlanarResult` indicating:
	 * - `result`: `true` if the points are coplanar, `false` otherwise.
	 * - `ptsNotEnough`: `true` if fewer than 3 points are provided.
	 * - `notPlanar`: `true` if the points are not coplanar.
	 *
	 * @remarks
	 * - At least 3 points are required to define a plane.
	 * - Uses a tolerance value (`PLANARITY_TOLERANCE`) to account for floating-point inaccuracies.
	 * - Points beyond the first three are checked for planarity with respect to the plane defined by the first three points.
	 */
	export function checkPtsOnPlanar(
		...pts: Vertex3d[]
	): CheckPtsOnPlanarResult {
		if (pts.length < 3) {
			return {
				result: false,
				ptsNotEnough: true,
				notPlanar: false,
			};
		}

		const p0p1 = VectorUtils.chain(pts[1])
			.subtract(pts[0])
			.normalize()
			.value();
		const p0p2 = VectorUtils.chain(pts[2])
			.subtract(pts[0])
			.normalize()
			.value();
		const n = VectorUtils.cross(p0p1, p0p2);

		const otherVectors: Vertex3d[] = [];
		pts.forEach((pt, index) => {
			if (index > 2) {
				const otherVector = VectorUtils.subtract(
					pt,
					pts[0]
				);
				otherVectors.push(otherVector);
			}
		});

		for (let i = 3; i < pts.length; i++) {
			const v = VectorUtils.subtract(pts[i], pts[0]);
			const d = VectorUtils.dot(n, v);
			if (Math.abs(d) > PLANARITY_TOLERANCE)
				return {
					result: false,
					ptsNotEnough: false,
					notPlanar: true,
				};
		}

		return { result: true, ptsNotEnough: false, notPlanar: false };
	}
}
