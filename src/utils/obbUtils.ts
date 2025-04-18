import { Vertex3d } from "types/basicGeometries";
import { computeContexHull2d } from "./convexHullUtils";

export function computeOBB2d(vertices: Vertex3d[]): { p0: Vertex3d, p1: Vertex3d, p2: Vertex3d, p3: Vertex3d } {
    const hull = computeContexHull2d(vertices);
    const comparables: {area: number, p0: Vertex3d, p1: Vertex3d, rotation: number, pts: Vertex3d[]}[] = [];

    for(let i = 0; i < hull.length; i++) {
        let p0: Vertex3d, p1: Vertex3d;
        if(i === hull.length - 1) {
            p0 = hull[i];
            p1 = hull[0];
        } else {
            p0 = hull[i];
            p1 = hull[i+1];
        }

        const p1Moved: Vertex3d = {
            x: p1.x - p0.x,
            y: p1.y - p0.y,
            z: p1.z
        }

        const p1Direction = Math.atan2(p1Moved.y, p1Moved.x);

        const ptsTransformed: Vertex3d[] = hull.map((pt) => {
            const ptMoved: Vertex3d = {x: pt.x - p0.x, y: pt.y - p0.y, z: pt.z};
            const ptTransformed: Vertex3d = {
                x: Math.cos(-p1Direction)*ptMoved.x - Math.sin(-p1Direction)*ptMoved.y,
                y: Math.sin(-p1Direction)*ptMoved.x - Math.cos(-p1Direction)*ptMoved.y,
                z: pt.z
            } 
            
            return {x: ptTransformed.x, y: ptTransformed.y, z: ptTransformed.z}
        });

        const bb = getBoundingBox(ptsTransformed);

        comparables.push({area: bb.area, p0, p1, rotation: p1Direction, pts: bb.pts});
    }

    const sortedBoundingBoxes = comparables.sort((a, b) => a.area - b.area);
    const minBB = sortedBoundingBoxes[0];
    const rotation = minBB.rotation;

    const restoredPts:Vertex3d[] = minBB.pts.map(pt => {
        const ptTransformed: Vertex3d = {
            x: Math.cos(rotation)*pt.x - Math.sin(rotation)*pt.y + minBB.p0.x,
            y: Math.sin(rotation)*pt.x - Math.cos(rotation)*pt.y + minBB.p0.y,
            z: pt.z
        }

        return ptTransformed;
    });

    return {
        p0: restoredPts[0],
        p1: restoredPts[1],
        p2: restoredPts[2],
        p3: restoredPts[3],
    }
}

function getBoundingBox(pts: Vertex3d[]):{area: number, pts: Vertex3d[]} {
    const xMin = Math.min(...pts.map(p => p.x));
    const yMin = Math.min(...pts.map(p => p.y));
    const xMax = Math.max(...pts.map(p => p.x));
    const yMax = Math.max(...pts.map(p => p.y));

    const dx = Math.abs(xMax - xMin);
    const dy = Math.abs(yMax - yMin);

    return {
        area: dx*dy, 
        pts: [
            {x: xMin, y: yMin, z: 0},
            {x: xMax, y: yMin, z: 0},
            {x: xMax, y: yMax, z: 0},
            {x: xMin, y: yMax, z: 0},
        ]
    };
}