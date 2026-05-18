import { VectorUtils } from "utils/vectorUtils";
import { BVHHit, BVHTree, BVHTriangle } from "./bvhTree";
import { Line, Polyline3d, Vertex3d } from "./types/basicGeometries";
import { LineEvaluation } from "utils/lineEvaluationUtils";
import { LineManipulationUtils } from "utils/lineManipluationUtils";
import { PolygonUtils } from "utils/polygonUtils";
import { PointEvaluationUtils } from "utils/pointEvaluationUtils";

type EdgeKey = string & { __brand: "EdgeKey" };
type FaceIndex = number & { __brand: "FaceIndex" };
type VertexIndex = number & { __barnd: "VertexIndex" };

type EdgeKeyMap = Map<EdgeKey, FaceIndex[]>;
type MeshFaceTriangle = [VertexIndex, VertexIndex, VertexIndex];
type EdgeNeighborInfo = Map<FaceIndex, FaceIndex[]>;
type OuterEdgeSet = Set<EdgeKey>;
type VertexNeighborInfo = Map<VertexIndex, FaceIndex[]>;

export class Mesh {
	constructor(pts: Vertex3d[], faces: MeshFaceTriangle[]) {
		this.vertices = pts;
		this.faces = faces;
		this.bvhTree = new BVHTree();
		this._isValid = false;

		const edgeAdjacency = this.buildEdgeAdjacency();
		this.innerEdgeNeighbor = edgeAdjacency.inner;
		this.outerEdges = edgeAdjacency.outer;
		this.vertexNeighbor = this.buildVertexAdjacency();

		this.buildBVHTree();
	}

	private _isValid: boolean;
	get isValid(): boolean {
		return this._isValid;
	}

	readonly vertices: Vertex3d[];
	readonly faces: MeshFaceTriangle[];
	private bvhTree: BVHTree;
	private innerEdgeNeighbor: EdgeNeighborInfo;
	private outerEdges: OuterEdgeSet;
	private vertexNeighbor: VertexNeighborInfo;

	private buildBVHTree() {
		const maxPtIndexOfMesh = this.vertices.length - 1;
		const bvhTriangles: BVHTriangle[] = [];
		for (let i = 0; i < this.faces.length; i++) {
			const faceIdx = i;
			const face = this.faces[i];

			const maxPtIndexOfFace = Math.max(face[0], face[1], face[2]);
			if (maxPtIndexOfMesh < maxPtIndexOfFace) {
				this._isValid = false;
				break;
			}

			const bvhTriangle = new BVHTriangle(
				this.vertices[face[0]],
				this.vertices[face[1]],
				this.vertices[face[2]],
				undefined,
				faceIdx,
			);

			bvhTriangles.push(bvhTriangle);
		}

		if (!this._isValid) {
			return;
		}

		bvhTriangles.forEach((triangle) => this.bvhTree.addTriangle(triangle));
		this.bvhTree.calculateTree();
	}

	private buildEdgeAdjacency(): {
		inner: EdgeNeighborInfo;
		outer: OuterEdgeSet;
	} {
		const edgeMap: EdgeKeyMap = new Map();
		const inner: EdgeNeighborInfo = new Map();
		const outer: OuterEdgeSet = new Set();

		// Edge 인접정보 만들기
		this.faces.forEach((face, faceIdx) => {
			// Edge 방향성 제거
			const edges = [
				[face[0], face[1]].sort((a, b) => a - b),
				[face[1], face[2]].sort((a, b) => a - b),
				[face[2], face[0]].sort((a, b) => a - b),
			];

			// Edge정보 저장. 1,2 = 1번 2번 점을 이은 변을 Edge로 쓴다는 뜻
			edges.forEach((edge) => {
				const key = `${edge[0]},${edge[1]}` as EdgeKey;
				if (!edgeMap.has(key)) edgeMap.set(key, []);
				edgeMap.get(key)!.push(faceIdx as FaceIndex);
			});
		});

		edgeMap.forEach((sharingFaces, key) => {
			// 해당 Edge가 물고있는 Face의 수는 최대 2임. (정상적인 메쉬의 경우)
			if (sharingFaces.length === 2) {
				const [f1, f2] = sharingFaces;
				if (!inner.has(f1)) inner.set(f1, []);
				if (!inner.has(f2)) inner.set(f2, []);
				inner.get(f1)!.push(f2);
				inner.get(f2)!.push(f1);
			} else if (sharingFaces.length === 3) {
				// Non-manifold 타입
				console.warn(
					`Non-Manifold Edge detected at ${key}: shared by ${sharingFaces.length} faces.`,
				);
				this._isValid = false;
			} else if (sharingFaces.length === 1) {
				outer.add(key);
			}
		});

		return { inner, outer };
	}

	private buildVertexAdjacency(): VertexNeighborInfo {
		const vertexMap: VertexNeighborInfo = new Map();

		this.faces.forEach((face, faceIdx) => {
			// 루프를 돌려 중복 코드를 제거
			face.forEach((vIdx) => {
				if (!vertexMap.has(vIdx)) {
					vertexMap.set(vIdx, []);
				}
				vertexMap.get(vIdx)!.push(faceIdx as FaceIndex);
			});
		});

		return vertexMap;
	}

	projectLine(
		line: Line,
		direction: Vertex3d = { x: 0, y: 0, z: 1 },
	): Polyline3d[] {
		const pls: Polyline3d[] = [];

		// 메쉬 위 첫번째 시작점 찾기
		const { p0, p1 } = line;
		const q0 = VectorUtils.add(p0, direction);
		const r0 = VectorUtils.add(p0, VectorUtils.flip(direction));
		const q1 = VectorUtils.add(p1, direction);
		const r1 = VectorUtils.add(p1, VectorUtils.flip(direction));

		// p0의 시작점 찾기
		// 케이스 분기 : p0이 메쉬 Face 에 투영이 되는경우
		const hitsWithinTriangle: BVHHit[] = [];
		const p0Hits = this.bvhTree.getRayCollisions(p0, q0, {
			includeOutsideSegment: true,
			includeOutsideTriangle: false,
		});

		const p0HitsReverse = this.bvhTree.getRayCollisions(p0, q0, {
			includeOutsideSegment: true,
			includeOutsideTriangle: false,
		});

		hitsWithinTriangle.push(...p0Hits, ...p0HitsReverse);

		if (hitsWithinTriangle.length === 0) {
			this.findStartPtFromOutside(p0, q0);
		} else {
			// Face에 투영이 가능한 경우, t값이 가장 큰 것을 시작점으로 설정
			const sortedHits = hitsWithinTriangle.sort((a, b) => b.t - a.t);
			const hitFirst = sortedHits[0];
			const faceIdx = hitFirst.triangle.faceIndexOriginal;
		}

		return pls;
	}

	private findStartPtFromOutside(
		p0: Vertex3d,
		projectDirection: Vertex3d,
		walkingDirection: Vertex3d,
	) {
		
	}

	private findNextTriangle(
		faceIdx: FaceIndex,
		pt: Vertex3d,
		direction: Vertex3d,
	): { isFinished: boolean; nextFace?: FaceIndex } {
		// 인접한 Face가 없는경우, 막다른 곳에서 진행하는 것이므로
		// 충돌하는 Edge 까지만 정사영 하면됨

		let isFinished = false;
		const edgeNeighbor = this.innerEdgeNeighbor.get(faceIdx);
		if (!edgeNeighbor || edgeNeighbor.length === 0) {
			isFinished = true;
		}

		const face = this.faces[faceIdx];
		const p0 = this.vertices[face[0]];
		const p1 = this.vertices[face[1]];
		const p2 = this.vertices[face[2]];

		// 시험용 선분 생성
		const ptCorrected = PointEvaluationUtils.projectPointOnTriaglePlane(
			pt,
			{ p0, p1, p2 },
		);
		const ptWalked = VectorUtils.chain(direction)
			.normalize()
			.add(direction)
			.value();

		const lineTest: Line = { p0: ptCorrected, p1: ptWalked };
		const liP0P1: Line = { p0, p1 };
		const liP1P2: Line = { p0: p1, p1: p2 };
		const liP0P2: Line = { p0, p1: p2 };

		// 각 선분과의 충돌 비교
		const collisionOnP0P1 = LineEvaluation.getIntersection(
			lineTest,
			liP0P1,
			true,
		);
		const collisionOnP1P2 = LineEvaluation.getIntersection(
			lineTest,
			liP1P2,
			true,
		);
		const collisionOnP0P2 = LineEvaluation.getIntersection(
			lineTest,
			liP0P2,
			true,
		);

		const faceCollided: FaceIndex[] = [];
		if (collisionOnP0P1.result && collisionOnP0P1.pt) {
			if (edgeNeighbor) {
				edgeNeighbor.forEach((faceIdx) => {
					// 옆집 vertex를 q로 가정
					const q0 = this.faces[faceIdx][0];
					const q1 = this.faces[faceIdx][1];
					const q2 = this.faces[faceIdx][2];

					let isCollided = false;
					if (face[0] === q0 && face[1] === q1) {
						// 인접 face의 Q0Q1에서 충돌한 것
						isCollided = true;
					} else if (face[0] === q1 && face[1] === q2) {
						isCollided = true;
					} else if (face[0] === q0 && face[1] === q2) {
						isCollided = true;
					}

					if (isCollided) faceCollided.push(faceIdx);
				});
			}
		}

		if (collisionOnP1P2.result && collisionOnP1P2.pt) {
			if (edgeNeighbor) {
				edgeNeighbor.forEach((faceIdx) => {
					// 옆집 vertex를 q로 가정
					const q0 = this.faces[faceIdx][0];
					const q1 = this.faces[faceIdx][1];
					const q2 = this.faces[faceIdx][2];

					let isCollided = false;
					if (face[1] === q0 && face[2] === q1) {
						// 인접 face의 Q1Q2에서 충돌한 것
						isCollided = true;
					} else if (face[1] === q1 && face[2] === q2) {
						isCollided = true;
					} else if (face[1] === q0 && face[2] === q2) {
						isCollided = true;
					}

					if (isCollided) faceCollided.push(faceIdx);
				});
			}
		}

		if (collisionOnP0P2.result && collisionOnP0P2.pt) {
			if (edgeNeighbor) {
				edgeNeighbor.forEach((faceIdx) => {
					// 옆집 vertex를 q로 가정
					const q0 = this.faces[faceIdx][0];
					const q1 = this.faces[faceIdx][1];
					const q2 = this.faces[faceIdx][2];

					let isCollided = false;
					if (face[0] === q0 && face[2] === q1) {
						// 인접 face의 Q1Q2에서 충돌한 것
						isCollided = true;
					} else if (face[0] === q1 && face[2] === q2) {
						isCollided = true;
					} else if (face[0] === q0 && face[2] === q2) {
						isCollided = true;
					}

					if (isCollided) faceCollided.push(faceIdx);
				});
			}
		}

		let nextFace: FaceIndex | undefined = undefined;
		if (!isFinished && faceCollided.length === 1) {
			nextFace = faceCollided[1];
		}

		return { isFinished, nextFace };
	}

	// projectLine(
	// 	line: Line,
	// 	direction: Vertex3d = { x: 0, y: 0, z: 1 },
	// ): Polyline3d[] {
	// 	// Get first point
	// 	const { p0, p1 } = line;
	// 	const q0 = VectorUtils.add(p0, direction);
	// 	const r0 = VectorUtils.add(p0, VectorUtils.flip(direction));
	// 	const q1 = VectorUtils.add(p1, direction);
	// 	const r1 = VectorUtils.add(p1, VectorUtils.flip(direction));

	// 	const p0Hits = this.bvhTree.getRayCollisions(p0, q0, {
	// 		includeOutsideSegment: true,
	// 		inclodeOutsideTriangle: true,
	// 	});

	// 	const p0HitsReverse = this.bvhTree.getRayCollisions(p0, q0, {
	// 		includeOutsideSegment: true,
	// 		inclodeOutsideTriangle: true,
	// 	});

	// 	// Case: When the hit within triangle exists.
	// 	const hitsWithinTriangle: BVHHit[] = [];
	// 	p0Hits.forEach((hit) => {
	// 		if (hit.isWithinTriangle) hitsWithinTriangle.push(hit);
	// 	});

	// 	p0HitsReverse.forEach((hit) => {
	// 		if (hit.isWithinTriangle) hitsWithinTriangle.push(hit);
	// 	});

	// 	if (hitsWithinTriangle.length > 0) {
	// 		const sortedHits = hitsWithinTriangle.sort((a, b) => b.t - a.t);
	// 		const ptStart = sortedHits[0];
	// 	}
	// }

	// private traverseNeighbors(
	// 	ptStart: Vertex3d,
	// 	startFaceIdx: number,
	// 	projectDir: Vertex3d,
	// 	lineDir: Vertex3d,
	// ): Polyline3d[] {
	// 	const path: Vertex3d[] = [ptStart];
	// 	let currentFaceIdx = startFaceIdx;
	// 	let currentPoint = ptStart;
	// 	const visited = new Set<number>();

	// 	while (true) {
	// 		if (visited.has(currentFaceIdx)) {
	// 			if (currentFaceIdx === startFaceIdx) {
	// 				path.push(path[0]);
	// 			}
	// 			break;
	// 		}
	// 		visited.add(currentFaceIdx);
	// 		// Find exit edge

	// 		this.findExitEdge(currentFaceIdx, currentPoint, projectDir);
	// 	}

	// 	// const pls: Polyline3d[] = [];

	// 	// const visitedFaces: number[] = [startFaceIdx];
	// 	// const startFace = this.faces[startFaceIdx];
	// 	// const [s0, s1, s2] = [startFace[0], startFace[1], startFace[2]];
	// 	// const v0 = this.pts[s0];
	// 	// const v1 = this.pts[s1];
	// 	// const v2 = this.pts[s0];

	// 	// const n = VectorUtils.getNormal(v0, v1, v2);
	// 	// const d = baseDir;
	// 	// const dpNormalized = VectorUtils.normalize(VectorUtils.projectOnPlane(n, d));

	// 	// // const startFace = this.neighbor.get(faceIdx);
	// 	// // if(!startFace) return pls;

	// 	return pls;
	// }

	// private findExitEdge(
	// 	currentFaceIdx: number,
	// 	currentPoint: Vertex3d,
	// 	lineDirection: Vertex3d,
	// ) {
	// 	const currentFace = this.faces[currentFaceIdx];
	// 	const neighbors = this.neighbor.get(currentFaceIdx);
	// 	if (!neighbors) return;

	// 	const p0 = this.pts[currentFace[0]];
	// 	const p1 = this.pts[currentFace[1]];
	// 	const p2 = this.pts[currentFace[2]];

	// 	if (!PolygonUtils.pointInTriangle(currentPoint, { p0, p1, p2 })) return;

	// 	const n = VectorUtils.getNormal(p0, p1, p2);
	// 	const ptOnCurrentFace = PointEvaluationUtils.projectPointOnTriaglePlane(
	// 		currentPoint,
	// 		{ p0, p1, p2 },
	// 	);
	// 	const dirWalk = VectorUtils.normalize(
	// 		VectorUtils.projectOnPlane(n, lineDirection),
	// 	);
	// 	const ptOnCurrentFaceForward = VectorUtils.add(
	// 		ptOnCurrentFace,
	// 		dirWalk,
	// 	);

	// 	const pathSegment: Line = {
	// 		p0: ptOnCurrentFace,
	// 		p1: ptOnCurrentFaceForward,
	// 	};

	// 	const p0p1: Line = { p0, p1 };
	// 	const p1p2: Line = { p0: p1, p1: p2 };
	// 	const p0p2: Line = { p0, p1: p2 };

	// 	const ptOnP0P1 = LineEvaluation.getIntersection(pathSegment, p0p1, true);
	// 	const ptOnP1P2 = LineEvaluation.getIntersection(pathSegment, p1p2, true);
	// 	const ptOnP0P2 = LineEvaluation.getIntersection(pathSegment, p0p2, true);

	// 	if(!ptOnP0P1.result && !ptOnP1P2.result && !ptOnP0P2.result) return;

	// }
}
