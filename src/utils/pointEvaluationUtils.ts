import { Vertex3dWrapped } from "models/basic/vertex3d";
import { Line, Triangle, Vertex3d } from "types/basicGeometries";

/**
 * Evaluate the parameter of given line and point.
 * @param p0 Start point of Line
 * @param p1 End point of Line
 * @param ptTest Point to test
 * @returns {number|undefined} 
 * When the given point is on the line between endpoints, the result will be 0 ~ 1.
 * When it is on the line but outside the endpoints, the result will be negative float or larger than 1.
 * When it is determined that the point actually not placed on the line, it will return undefined.
 */
const DIRECTION_TOLERANCE = 1e-6;
export function pointEvaluationOnLine(p0: Vertex3d, p1: Vertex3d, ptTest: Vertex3d) {
    const direction: Vertex3d = {x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z};
    const directionNorm = getNormalizedVector(direction);
    const p0p2: Vertex3d = {x: ptTest.x - p0.x, y: ptTest.y - p0.y, z: ptTest.z - p0.z}
    const testNorm = getNormalizedVector(p0p2);

    const dotResult = dot(directionNorm, testNorm);
    const directionFactor = dotResult >= 0 ? 1 : -1;
    const isAlmostParallel = Math.abs((Math.abs(dotResult) - 1)) < DIRECTION_TOLERANCE;

    const lineLength = getDist(p0, p1);
    const dist = getDist(p0, ptTest);

    if(!isAlmostParallel) {
        return;
    }

    return directionFactor * (dist/lineLength);
}

function getNormalizedVector(v: Vertex3d):Vertex3d {
    const size = Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2) + Math.pow(v.z, 2));

    return {
        x: v.x/size,
        y: v.y/size,
        z: v.z/size
    }
}

function dot(v0: Vertex3d, v1: Vertex3d): number {
    return v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
}

function getDist(p0: Vertex3d, p1: Vertex3d) {
    const dxOnLine = Math.abs(p1.x - p0.x);
    const dyOnLine = Math.abs(p1.y - p0.y);
    const dzOnLine = Math.abs(p1.z - p0.z);
    return Math.sqrt(Math.pow(dxOnLine, 2) + Math.pow(dyOnLine, 2) + Math.pow(dzOnLine, 2));
}

/**
 * Get intersection of line and triangle.
 * @param line Line's endpoints.
 * @param triangle Triangle
 * @returns When intersection point exists, returns it. If not, returned undefined.
 */
export function getPointOnTrianglePlane(line: Line, triangle: Triangle): Vertex3d | undefined {
    if (isDetZero(line, triangle)) return;

    const v0 = new Vertex3dWrapped(triangle.p0);
    const v1 = new Vertex3dWrapped(triangle.p1);
    const v2 = new Vertex3dWrapped(triangle.p2);

    const p0 = new Vertex3dWrapped(line.p0);
    const p1 = new Vertex3dWrapped(line.p1);

    const v0v1 = v1.subtract(v0);
    const v0v2 = v2.subtract(v0);
    const v1p1 = p0.subtract(v0);
    const d = p1.subtract(p0).normalized();

    const det = v0v1.dot(d.cross(v0v2));

    const v = d.dot(v0v2.cross(v1p1)) / det;
    const w = d.dot(v1p1.cross(v0v1)) / det;
    const u = 1 - (v + w);

    const result = v0.multiply(u).add(v1.multiply(v)).add(v2.multiply(w));

    const validParams = [u, v, w].every(val => val >= 0 && val <= 1);
    return validParams ? result : undefined;
}

function isDetZero(line: Line, triangle: Triangle): boolean {
    const v0 = new Vertex3dWrapped(triangle.p0);
    const v1 = new Vertex3dWrapped(triangle.p1);
    const v2 = new Vertex3dWrapped(triangle.p2);

    const v0v1 = v1.subtract(v0);
    const v0v2 = v2.subtract(v0);
    const d = new Vertex3dWrapped(line.p1).subtract(new Vertex3dWrapped(line.p0)).normalized();
    const det = v0v1.dot(d.cross(v0v2));
    return det === 0;
}
