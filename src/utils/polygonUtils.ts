import { Vertex2d, Vertex3d } from "../models/types/basicGeometries";
import { VectorUtils } from "./vectorUtils";

export namespace PolygonUtils {
    type SplittedTriangles = {
        t0?: {p0: Vertex3d, p1: Vertex3d, p2: Vertex3d},
        t1?: {p0: Vertex3d, p1: Vertex3d, p2: Vertex3d},
        log: LogMessage;
    }

    type LogMessage = {result: boolean, message?: string};
    
    type Quadrant = {p0: Vertex3d, p1: Vertex3d, p2: Vertex3d, p3: Vertex3d};
    export function splitQuadrant(quadrant: Quadrant): SplittedTriangles {
        const {p0, p1, p2, p3} = quadrant;
        const planarTest = checkPtsOnPlanar(p0, p1, p2, p3);
        if(!planarTest.result) return ({log: {result: false, message: "NotPlanar"}});

        // Test concave or convex
        const v1 = VectorUtils.subtract(p1, p0);
        const v2 = VectorUtils.subtract(p2, p0);
        const normal = VectorUtils.normalize(VectorUtils.cross(v1, v2));

        const helper = Math.abs(normal.x) < 0.9 ? {x: 1, y: 0, z: 0} : {x: 0, y: 1, z: 0};
        const axisX = VectorUtils.normalize(VectorUtils.cross(helper, normal));
        const axisY = VectorUtils.cross(normal, axisX);
        
        const p0p1 = VectorUtils.subtract(p1, p0);
        const p1p2 = VectorUtils.subtract(p2, p1);
        const p2p3 = VectorUtils.subtract(p3, p2);
        const p3p0 = VectorUtils.subtract(p0, p3);

        const n0 = VectorUtils.cross(p0p1, p3p0);
        const n1 = VectorUtils.cross(p1p2, p0p1);
        const n2 = VectorUtils.cross(p2p3, p1p2);
        const n3 = VectorUtils.cross(p3p0, p2p3);

        const isConvex =
            VectorUtils.dot(n0, n1) >= 0 &&
            VectorUtils.dot(n0, n2) >= 0 &&
            VectorUtils.dot(n0, n3) >= 0;
        
        if(isConvex) {
            const distP0P2 = distanceSquared(p0, p2);
            const distP1P3 = distanceSquared(p1, p3);

            if(distP0P2 < distP1P3) {
                return {
                    t0: {p0: p0, p1: p1, p2: p2},
                    t1: {p0: p2, p1: p3, p2: p0},
                    log: { result: true }
                }
            } else {
                return {
                    t0: {p0: p0, p1: p1, p2: p3},
                    t1: {p0: p1, p1: p2, p2: p3},
                    log: { result: true }
                }
            }
        } else {
            const pts = [p0, p1, p2, p3];
            const concaveIndex = findConcaveIndex(p0, p1, p2, p3);
            if(!concaveIndex) return {log: {result: false, message: "Can't find concave index."}};

            const a = pts[concaveIndex];
            const b = pts[(concaveIndex + 2) % 4];
            const prev = pts[(concaveIndex + 3) % 4];
            const next = pts[(concaveIndex + 1) % 4];

            return {
                t0: { p0: a, p1: next, p2: b },
                t1: { p0: a, p1: b, p2: prev },
                log: { result: true }
            };
        }
    }

    function distanceSquared(p0: Vertex3d, p1: Vertex3d) {
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const dz = p1.z - p0.z;

        return Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2);
    }

    function findConcaveIndex(p0: Vertex3d, p1: Vertex3d, p2: Vertex3d, p3: Vertex3d): number | undefined {
        const pts = [p0, p1, p2, p3];
        const crosses: Vertex3d[] = [];
        for (let i = 0; i < 4; i++) {
            const curr = pts[i];
            const next = pts[(i + 1) % 4];
            const nextNext = pts[(i + 2) % 4];

            const v1 = VectorUtils.subtract(next, curr);
            const v2 = VectorUtils.subtract(nextNext, next);

            crosses.push(VectorUtils.cross(v1, v2));
        }

        const base = crosses[0];
        const flipIndex = crosses.findIndex((n, i) => VectorUtils.dot(n, base) < 0);

        return flipIndex >= 0 ? flipIndex : undefined;
    }

    const PLANARITY_TOLERANCE = 1e-20;

    type CheckPtsOnPlanarResult = {
        result: boolean,
        ptsNotEnough: boolean,
        notPlanar: boolean,
    }

    export function checkPtsOnPlanar(...pts: Vertex3d[]): CheckPtsOnPlanarResult {
        if(pts.length < 3) {
            return {
                result: false,
                ptsNotEnough: true,
                notPlanar: false,
            }
        }

        const p0p1 = VectorUtils.chain(pts[1]).subtract(pts[0]).normalize().value();
        const p0p2 = VectorUtils.chain(pts[2]).subtract(pts[0]).normalize().value();
        const n = VectorUtils.cross(p0p1, p0p2);

        const otherVectors: Vertex3d[] = [];
        pts.forEach((pt, index) => {
            if(index > 2) {
                const otherVector = VectorUtils.subtract(pt, pts[0]);
                otherVectors.push(otherVector);
            }
        });

        for (let i = 3; i < pts.length; i++) {
            const v = VectorUtils.subtract(pts[i], pts[0]);
            const d = VectorUtils.dot(n, v);
            if (Math.abs(d) > PLANARITY_TOLERANCE) return { result: false, ptsNotEnough: false, notPlanar: true };
        }

        return {result: true, ptsNotEnough: false, notPlanar: false}
    }
}