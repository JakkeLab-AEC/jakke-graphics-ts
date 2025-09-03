import { Vertex3d } from "../models/types/basicGeometries"

/**
 * Computes the convex hull of a set of 2D vertices using the Graham scan algorithm.
 *
 * The function expects an array of `Vertex3d` objects, where only the `x` and `y` properties are used.
 * The result is an array of vertices representing the convex hull in counter-clockwise order.
 *
 * @param vertices - An array of `Vertex3d` objects representing the points in 2D space.
 * @returns An array of `Vertex3d` objects representing the convex hull.
 *
 * @remarks
 * - The input array must contain at least three vertices.
 * - The `z` property of `Vertex3d` is ignored in the computation.
 * - Duplicate points and collinear points may affect the output.
 */
export function computeContexHull2d(vertices: Vertex3d[]) {
    // Find anchor
    let min = vertices[0];
    const comparableVertices:Vertex3d[] = [];
    for (const v of vertices) {
        if (v.y < min.y || (v.y === min.y && v.x < min.x)) {
            min = v;
        }
    }

    // Set comparable vertices
    for(const v of vertices) {
        if(v !== min) comparableVertices.push(v);
    }

    // Get parameterized comparables and sort
    const parameterizedVertices = vertices.map(v => {
        const vec: Vertex3d = {x: v.x - min.x, y: v.y - min.y, z: 0};
        return {
            vertex: v,
            param: Math.atan2(vec.y, vec.x)
        }
    });

    const sorted = parameterizedVertices.sort((a, b) =>
        a.param === b.param
            ? getSquaredDistance(min, a.vertex) - getSquaredDistance(min, b.vertex)
            : a.param - b.param
    );

    // Compares
    const stack:Vertex3d[] = [min, sorted[0].vertex];
    for(let i = 1; i < sorted.length; i++) {
        const pt = sorted[i].vertex;
        while (
            stack.length >= 2 &&
            !isCCW2d(stack[stack.length - 2], stack[stack.length - 1], pt)
        ) {
            stack.pop();
        }

        stack.push(pt);
    }

    return stack;
}

function getSquaredDistance(v0: Vertex3d, v1: Vertex3d): number {
    return Math.pow(v1.x - v0.x, 2) + Math.pow(v1.y - v0.y, 2) + Math.pow(v1.z - v0.z, 2);
}

function isCCW2d(p0: Vertex3d, p1: Vertex3d, p2: Vertex3d) {
    const v1: Vertex3d = {
        x: p1.x - p0.x,
        y: p1.y - p0.y,
        z: p1.z - p0.z,
    };

    const v2: Vertex3d = {
        x: p2.x - p1.x,
        y: p2.y - p1.y,
        z: p2.z - p1.z,
    };

    return cross2d(v1, v2) > 0;
}

function cross2d(p0: Vertex3d, p1: Vertex3d): number {
    return (p0.y*p1.z - p0.z*p1.y) - (p0.x*p1.z - p0.z*p1.x) + (p0.x*p1.y - p0.y*p1.x);
}