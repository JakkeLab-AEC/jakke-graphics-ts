import { Vertex3d } from "../models/types/basicGeometries";
import { computeContexHull2d } from "./convexHullUtils";

/**
 * Computes the minimum area oriented bounding box (OBB) for a set of 2D vertices.
 * The function projects the vertices onto their convex hull, iterates over each edge,
 * rotates the hull so the edge aligns with the x-axis, and finds the bounding box
 * with the smallest area. The resulting OBB is returned as four vertices sorted
 * counterclockwise starting from the bottom-left corner.
 *
 * @param vertices - An array of `Vertex3d` objects representing the 2D points (z is ignored).
 * @returns An object containing the four vertices (`p0`, `p1`, `p2`, `p3`) of the minimum area OBB,
 *          sorted counterclockwise starting from the bottom-left vertex.
 */
export function computeOBB2d(vertices: Vertex3d[]): {
    p0: Vertex3d;
    p1: Vertex3d;
    p2: Vertex3d;
    p3: Vertex3d;
} {
    const hull = computeContexHull2d(vertices);
    const comparables: {
        area: number;
        p0: Vertex3d;
        p1: Vertex3d;
        rotation: number;
        pts: Vertex3d[];
    }[] = [];

    for (let i = 0; i < hull.length; i++) {
        let p0: Vertex3d, p1: Vertex3d;
        if (i === hull.length - 1) {
            p0 = hull[i];
            p1 = hull[0];
        } else {
            p0 = hull[i];
            p1 = hull[i + 1];
        }

        const p1Moved: Vertex3d = {
            x: p1.x - p0.x,
            y: p1.y - p0.y,
            z: p1.z,
        };

        const p1Direction = Math.atan2(p1Moved.y, p1Moved.x);

        // Get rotation angle
        const rotationAngle = -p1Direction;

        const ptsTransformed: Vertex3d[] = hull.map((pt) => {
            const ptMoved: Vertex3d = {
                x: pt.x - p0.x,
                y: pt.y - p0.y,
                z: pt.z,
            };
            const ptTransformed: Vertex3d = {
                x:
                    Math.cos(rotationAngle) * ptMoved.x -
                    Math.sin(rotationAngle) * ptMoved.y,
                y:
                    Math.sin(rotationAngle) * ptMoved.x +
                    Math.cos(rotationAngle) * ptMoved.y,
                z: pt.z,
            };

            return {
                x: ptTransformed.x,
                y: ptTransformed.y,
                z: ptTransformed.z,
            };
        });

        const bb = getBoundingBox(ptsTransformed);

        comparables.push({
            area: bb.area,
            p0,
            p1,
            rotation: rotationAngle,
            pts: bb.pts,
        });
    }

    const sortedBoundingBoxes = comparables.sort((a, b) => a.area - b.area);
    const minBB = sortedBoundingBoxes[0];
    const rotation = minBB.rotation;

    const restoredPts: Vertex3d[] = minBB.pts.map((pt) => {
        // Set rotation angle as reverse
        const reverseRotation = -rotation;
        const ptTransformed: Vertex3d = {
            x:
                Math.cos(reverseRotation) * pt.x -
                Math.sin(reverseRotation) * pt.y +
                minBB.p0.x,
            y:
                Math.sin(reverseRotation) * pt.x +
                Math.cos(reverseRotation) * pt.y +
                minBB.p0.y,
            z: pt.z,
        };

        return ptTransformed;
    });

    // Sort pts : p0 is bottom left one, and sort as counterclockwise.
    const sortedPts = sortVerticesCounterClockwise(restoredPts);

    return {
        p0: sortedPts[0],
        p1: sortedPts[1],
        p2: sortedPts[2],
        p3: sortedPts[3],
    };
}

function getBoundingBox(pts: Vertex3d[]): { area: number; pts: Vertex3d[] } {
    const xMin = Math.min(...pts.map((p) => p.x));
    const yMin = Math.min(...pts.map((p) => p.y));
    const xMax = Math.max(...pts.map((p) => p.x));
    const yMax = Math.max(...pts.map((p) => p.y));

    const dx = Math.abs(xMax - xMin);
    const dy = Math.abs(yMax - yMin);

    return {
        area: dx * dy,
        pts: [
            { x: xMin, y: yMin, z: 0 },
            { x: xMax, y: yMin, z: 0 },
            { x: xMax, y: yMax, z: 0 },
            { x: xMin, y: yMax, z: 0 },
        ],
    };
}

function sortVerticesCounterClockwise(vertices: Vertex3d[]): Vertex3d[] {
    // Get centroid
    const center: Vertex3d = {
        x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
        y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length,
        z: vertices.reduce((sum, v) => sum + v.z, 0) / vertices.length,
    };

    // Calculate polar angle based on center.
    const verticesWithAngle = vertices.map((v) => ({
        vertex: v,
        angle: Math.atan2(v.y - center.y, v.x - center.x),
    }));

    // Sort as polar angle
    verticesWithAngle.sort((a, b) => a.angle - b.angle);

    let minIndex = 0;
    for (let i = 1; i < verticesWithAngle.length; i++) {
        const current = verticesWithAngle[i].vertex;
        const min = verticesWithAngle[minIndex].vertex;

        if (current.y < min.y || (current.y === min.y && current.x < min.x)) {
            minIndex = i;
        }
    }

    const result: Vertex3d[] = [];
    for (let i = 0; i < verticesWithAngle.length; i++) {
        const index = (minIndex + i) % verticesWithAngle.length;
        result.push(verticesWithAngle[index].vertex);
    }

    return result;
}
