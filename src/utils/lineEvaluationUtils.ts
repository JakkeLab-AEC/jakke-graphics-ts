import { Line, Vertex3d } from "../models/types/basicGeometries";
import { VectorUtils } from "./vectorUtils";

const TOLERANCE_LINE_EVALUATION = 1e-6;

/**
 * Get point on line which is distanced from given distance.
 * @param line Endpoints of line.
 * @param dist Distance from endpoint.
 * @param fromStart When true, anchor point will be start of line. Otherwise, end of line.
 * @returns {Vertex3d} Point
 */
function getPointOnLine(line: {p0: Vertex3d, p1: Vertex3d}, dist: number, fromStart = true): Vertex3d {
    const {p0, p1} = line;
    const lineVector = VectorUtils.subtract(p1, p0);
    const lineDirection = VectorUtils.chain(lineVector).normalize().value();

    const moveVector = VectorUtils.scale(lineDirection, dist);
    const anchor = fromStart ? p0 : p1;
    const point = VectorUtils.add(anchor, moveVector);
    return point;
}

/**
 * Get intersection point from lines. 
 * @param li0 First line of lines.
 * @param li1 Second line of lines.
 * @param fromExtended When it's true, intersection will be calculated including extended lines of li0, li1. Otherwise, only within li0, li1 boundary.
 * @returns When the intersection exists, result will be true and pt will be that point. Otherwise, result false and message will include the reason of it.
 */
function getIntersection(li0: Line, li1: Line, fromExtended = false): {result: boolean,  pt?: Vertex3d, message?: string} {
    if(VectorUtils.isParallelLines(li0, li1)) return {result: false, message: "Parallel or same Lines"};

    // Projection on XY Plane
    const p1p3: Vertex3d = {
        x: li1.p1.x - li0.p1.x,
        y: li1.p1.y - li0.p1.y,
        z: 0
    };

    const d0: Vertex3d = {
        x: VectorUtils.normalize(VectorUtils.subtract(li0.p1, li0.p0)).x,
        y: VectorUtils.normalize(VectorUtils.subtract(li0.p1, li0.p0)).y,
        z: VectorUtils.normalize(VectorUtils.subtract(li0.p1, li0.p0)).z,
    };

    const d1: Vertex3d = {
        x: VectorUtils.normalize(VectorUtils.subtract(li1.p1, li1.p0)).x,
        y: VectorUtils.normalize(VectorUtils.subtract(li1.p1, li1.p0)).y,
        z: VectorUtils.normalize(VectorUtils.subtract(li1.p1, li1.p0)).z,
    };

    const d0PlaneXY: Vertex3d = VectorUtils.normalize({
        x: d0.x,
        y: d0.y,
        z: 0
    });    

    const d1PlaneXY: Vertex3d = VectorUtils.normalize({
        x: d1.x,
        y: d1.y,
        z: 0
    });

    const det = -(d0PlaneXY.x * d1PlaneXY.y) + (d1PlaneXY.x * d0PlaneXY.y);
    if (Math.abs(det) < TOLERANCE_LINE_EVALUATION) {
        return {result: false, message: "Det is zero (parallel lines)"};
    }

    const dx = p1p3.x;
    const dy = p1p3.y;

    const t = - ((d1PlaneXY.y * dx) - (d1PlaneXY.x * dy)) / det;
    const u = - ((d0PlaneXY.y * dx) - (d0PlaneXY.x * dy)) / det;

    // Move ptQ at plane (z = li0.p0.z);
    const ptLi0StartOnXY: Vertex3d =  {
        x: li0.p0.x,
        y: li0.p0.y,
        z: 0
    }

    const ptLi0EndOnXY: Vertex3d = {
        x: li0.p1.x,
        y: li0.p1.y,
        z: 0
    }

    // Move ptR at plane (z = li1.p0.z)
    const ptLi1StartOnXY: Vertex3d =  {
        x: li1.p0.x,
        y: li1.p0.y,
        z: 0
    }

    const ptLi1EndOnXY: Vertex3d = {
        x: li1.p1.x,
        y: li1.p1.y,
        z: 0
    }

    const ptQ = VectorUtils.add(ptLi0EndOnXY, VectorUtils.scale(d0PlaneXY, t));
    const ptR = VectorUtils.add(ptLi1EndOnXY, VectorUtils.scale(d1PlaneXY, u));
    
    const dist = VectorUtils.getDist(ptQ, ptR);
    if(dist > TOLERANCE_LINE_EVALUATION) return {result: false, message: "Each points on XY Plane is not same."};

    // Place ptQ on li0
    const tLi0 = VectorUtils.dot(VectorUtils.subtract(ptQ, ptLi0StartOnXY), d0PlaneXY);
    const ratioLi0 = VectorUtils.getDist(li0.p1, li0.p0) / VectorUtils.getDist(ptLi0EndOnXY, ptLi0StartOnXY);
    const vLi0 = tLi0 * ratioLi0;
    
    const ptQ2: Vertex3d = {
        x: li0.p0.x + vLi0*d0.x,
        y: li0.p0.y + vLi0*d0.y,
        z: li0.p0.z + vLi0*d0.z
    }

    // Place ptR on li1
    const tLi1 = VectorUtils.dot(VectorUtils.subtract(ptR, ptLi1StartOnXY), d1PlaneXY);
    const ratioLi1 = VectorUtils.getDist(li1.p1, li1.p0) / VectorUtils.getDist(ptLi1EndOnXY, ptLi1StartOnXY);
    const vLi1 = tLi1 * ratioLi1;
    
    const ptR2: Vertex3d = {
        x: li1.p0.x + vLi1*d1.x,
        y: li1.p0.y + vLi1*d1.y,
        z: li1.p0.z + vLi1*d1.z
    }

    if(VectorUtils.getDist(ptQ2, ptR2) > TOLERANCE_LINE_EVALUATION) return {result: false, message: "Two line's are on skew position."};

    if(fromExtended) {
        return {result: true, pt: ptQ2};
    } else {
        const paramPtQ2 = getParameterOnLine(li0.p0, li0.p1, ptQ2);
        const paramPtR2 = getParameterOnLine(li1.p0, li1.p1, ptR2);

        if((-TOLERANCE_LINE_EVALUATION <= paramPtQ2 && paramPtQ2 <= 1 + TOLERANCE_LINE_EVALUATION) && 
           (-TOLERANCE_LINE_EVALUATION <= paramPtR2 && paramPtR2 <= 1 + TOLERANCE_LINE_EVALUATION)) {
            return {result: true, pt: ptQ2};
        } else {
            return {result: false, message: "One of the points are placed on outside the line's domain."};
        }
    }
}

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
function getParameterOnLine(p0: Vertex3d, p1: Vertex3d, ptTest: Vertex3d): number {
    const direction = VectorUtils.subtract(p1, p0);
    const toTest = VectorUtils.subtract(ptTest, p0);

    const lengthSquared = VectorUtils.dot(direction, direction); // |d|^2
    if(lengthSquared === 0) return 0; // zero length line

    const t = VectorUtils.dot(toTest, direction) / lengthSquared;

    return t;
}

/**
 * Find foot point on line passing, which has direction as given.
 * @param direction Direction of line.
 * @param pt Point to foot on line.
 * @returns If you set direction as zero vector, it will return origin and param as 0.
 */
function getFootPointOnDirection(direction: Vertex3d, pt: Vertex3d): {pt: Vertex3d, t: number}|undefined {
    if(VectorUtils.getSize(direction) < TOLERANCE_LINE_EVALUATION) return;

    const norm = VectorUtils.normalize(direction);
    const dSize = VectorUtils.getSize(norm);

    const dot = VectorUtils.dot(norm, pt);
    const t = dot / Math.pow(dSize, 2);
    return {pt: VectorUtils.scale(norm, t), t};
}

/**
 * Find foot point on line.
 * @param line Line passing two points.
 * @param pt Point to foot on line.
 * @returns If you set each point of the line which has almost same coordinate each other, it will return origin and param as 0.
 */
function getFootPointOnLine(line: Line, pt: Vertex3d): {pt: Vertex3d, t: number}|undefined {
    const direction = VectorUtils.subtract(line.p1, line.p0);
    if(VectorUtils.getSize(direction) < TOLERANCE_LINE_EVALUATION) return;
    
    const anchor = line.p0;
    const ptMoved = VectorUtils.subtract(pt, anchor);

    const norm = VectorUtils.normalize(direction);
    const dSize = VectorUtils.getSize(norm);
    if(dSize === 0) return;

    const dot = VectorUtils.dot(norm, ptMoved);
    const t = dot / VectorUtils.getSize(direction);
    
    const ptOnMovedLine = VectorUtils.scale(norm, dot);
    const ptFooting = VectorUtils.add(ptOnMovedLine, anchor);
    return {pt: ptFooting, t};
}


export const LineEvaluation = {
    getPointOnLine,
    getIntersection,
    getParameterOnLine,
    getFootPointOnLine,
    getFootPointOnDirection
}