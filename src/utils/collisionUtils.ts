import { Vertex2d, Vertex3d } from "models/types/basicGeometries"
import { VectorUtils } from "./vectorUtils"
import { LineEvaluation } from "./lineEvaluationUtils"
import { ActionResult } from "models/types/errorMessages"

type BoundingBox2d = {
    anchor: Vertex2d,
    uAxis: Vertex2d,
    length: {
        u: number,
        v: number,
    }
}

type BoundingBox3d = {
    anchor: Vertex3d,
    uAxis: Vertex3d,
    vAxis: Vertex3d,
    length: {
        u: number,
        v: number,
        n: number,
    }
}

const ZERO_VECTOR_TOLERANCE = 1e-6;
const UNIT_VECTOR_TOLERANCE = 1e-6;

function hasBoundingBoxCollision2d(boxA: BoundingBox2d, boxB: BoundingBox2d, includeContating = false): ActionResult {
    // Filter the case when zero vectors are given.
    if(VectorUtils.getSize({...boxA.uAxis, z: 0}) <= ZERO_VECTOR_TOLERANCE || VectorUtils.getSize({...boxA.uAxis, z: 0}) <= ZERO_VECTOR_TOLERANCE) {
        return {result: false, hasError: true, message: "The vector of each boundingbox should not be zero."}
    }

    const uAxisOfA = VectorUtils.normalize({...boxA.uAxis, z: 0});
    const vAxisOfA = VectorUtils.rotateOnXY({...uAxisOfA, z: 0}, Math.PI * 0.5);

    const uAxisOfB = VectorUtils.normalize({...boxB.uAxis, z: 0});
    const vAxisOfB = VectorUtils.rotateOnXY({...uAxisOfB, z: 0}, Math.PI * 0.5);

    const axes = [uAxisOfA, vAxisOfA, uAxisOfB, vAxisOfB];

    // Get all pts of A
    const p0OfA = {...boxA.anchor, z:0};
    const p1OfA = VectorUtils.add({...boxA.anchor, z: 0}, VectorUtils.scale({...uAxisOfA, z: 0}, boxA.length.u));
    const p3OfA = VectorUtils.add({...boxA.anchor, z: 0}, VectorUtils.scale({...vAxisOfA, z: 0}, boxA.length.v));
    const p2OfA = VectorUtils.add(p1OfA, VectorUtils.scale({...vAxisOfA, z: 0}, boxA.length.v));

    // Get all pts of B
    const p0OfB = {...boxB.anchor, z:0};
    const p1OfB = VectorUtils.add({...boxB.anchor, z: 0}, VectorUtils.scale({...uAxisOfB, z: 0}, boxB.length.u));
    const p3OfB = VectorUtils.add({...boxB.anchor, z: 0}, VectorUtils.scale({...vAxisOfB, z: 0}, boxB.length.v));
    const p2OfB = VectorUtils.add(p1OfB, VectorUtils.scale({...vAxisOfB, z: 0}, boxB.length.v));

    const collisionResult = axes.every(axis => {
        // Get all foot point on uAxis of A
        const ptsOnAxisFromA = [
            LineEvaluation.getFootPointOnLine(axis, p0OfA),
            LineEvaluation.getFootPointOnLine(axis, p1OfA),
            LineEvaluation.getFootPointOnLine(axis, p2OfA),
            LineEvaluation.getFootPointOnLine(axis, p3OfA),
        ];

        const ptsOnAxisFromB = [
            LineEvaluation.getFootPointOnLine(axis, p0OfB),
            LineEvaluation.getFootPointOnLine(axis, p1OfB),
            LineEvaluation.getFootPointOnLine(axis, p2OfB),
            LineEvaluation.getFootPointOnLine(axis, p3OfB),
        ];

        const sortedParamsFromA = ptsOnAxisFromA
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);

        const sortedParamsFromB = ptsOnAxisFromB
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);
        
        const sectionByA = [sortedParamsFromA[0], sortedParamsFromA[3]];
        const sectionByB = [sortedParamsFromB[0], sortedParamsFromB[3]];


        if (includeContating) {
            return sectionByA[1] <= sectionByB[0] || sectionByB[1] <= sectionByA[0];
        } else {
            return sectionByA[1] < sectionByB[0] || sectionByB[1] < sectionByA[0];
        }
    });

    return {result: collisionResult}
}

function hasBoundingBoxCollision3d(boxA: BoundingBox3d, boxB: BoundingBox3d, includeContating = false): ActionResult {
    // Filter the case when zero vectors are given.
    const hasZeroVectors = [
        boxA.uAxis,
        boxA.vAxis,
        boxB.uAxis,
        boxB.vAxis,
    ].some(axis => VectorUtils.getSize(axis) <= ZERO_VECTOR_TOLERANCE);

    if(hasZeroVectors) {
        return {result: false, hasError: true, message: "Some axes are zero vector."}
    }
    
    // Filter the case when u, v axes are not perpendicular.
    const uAxisA = VectorUtils.normalize(boxA.uAxis);
    const vAxisA = VectorUtils.normalize(boxA.vAxis);
    const uAxisB = VectorUtils.normalize(boxB.uAxis);
    const vAxisB = VectorUtils.normalize(boxB.vAxis);

    const isPerpendicularA = Math.abs(VectorUtils.getSize(VectorUtils.cross(uAxisA, vAxisA)) - 1) > UNIT_VECTOR_TOLERANCE;
    const isPerpendicularB = Math.abs(VectorUtils.getSize(VectorUtils.cross(uAxisB, vAxisB)) - 1) > UNIT_VECTOR_TOLERANCE;
    if(!isPerpendicularA || !isPerpendicularB) {
        return {result: false, hasError: true, message: "U, V axis of each box should be perpendicular to each other."}
    }

    const nAxisA = VectorUtils.cross(uAxisA, vAxisA);
    const nAxisB = VectorUtils.cross(uAxisB, vAxisB);

    const p0A = {...boxA.anchor};
    const p1A = VectorUtils.add({...p0A}, uAxisA);
    const p2A = VectorUtils.add({...p1A}, vAxisA);
    const p3A = VectorUtils.add({...p0A}, vAxisA);
    const p4A = VectorUtils.add({...p0A}, nAxisA);
    const p5A = VectorUtils.add({...p1A}, nAxisA);
    const p6A = VectorUtils.add({...p2A}, nAxisA);
    const p7A = VectorUtils.add({...p3A}, nAxisA);

    const p0B = {...boxB.anchor};
    const p1B = VectorUtils.add({...p0B}, uAxisB);
    const p2B = VectorUtils.add({...p1B}, vAxisB);
    const p3B = VectorUtils.add({...p0B}, vAxisB);
    const p4B = VectorUtils.add({...p0B}, nAxisB);
    const p5B = VectorUtils.add({...p1B}, nAxisB);
    const p6B = VectorUtils.add({...p2B}, nAxisB);
    const p7B = VectorUtils.add({...p3B}, nAxisB);

    const axes = [uAxisA, vAxisA, nAxisA, uAxisB, vAxisB, nAxisB];
    const satResult = axes.every(axis => {
        const ptsOnAxisFromA = [
            LineEvaluation.getFootPointOnLine(axis, p0A),
            LineEvaluation.getFootPointOnLine(axis, p1A),
            LineEvaluation.getFootPointOnLine(axis, p2A),
            LineEvaluation.getFootPointOnLine(axis, p3A),
            LineEvaluation.getFootPointOnLine(axis, p4A),
            LineEvaluation.getFootPointOnLine(axis, p5A),
            LineEvaluation.getFootPointOnLine(axis, p6A),
            LineEvaluation.getFootPointOnLine(axis, p7A),
        ];

        const ptsOnAxisFromB = [
            LineEvaluation.getFootPointOnLine(axis, p0B),
            LineEvaluation.getFootPointOnLine(axis, p1B),
            LineEvaluation.getFootPointOnLine(axis, p2B),
            LineEvaluation.getFootPointOnLine(axis, p3B),
            LineEvaluation.getFootPointOnLine(axis, p4B),
            LineEvaluation.getFootPointOnLine(axis, p5B),
            LineEvaluation.getFootPointOnLine(axis, p6B),
            LineEvaluation.getFootPointOnLine(axis, p7B),
        ];

        const sortedParamsFromA = ptsOnAxisFromA
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);
        
        const sortedParamsFromB = ptsOnAxisFromB
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);
        
        const sectionByA = [sortedParamsFromA[0], sortedParamsFromA[7]];
        const sectionByB = [sortedParamsFromB[0], sortedParamsFromB[7]];

        if (includeContating) {
            return sectionByA[7] <= sectionByB[0] || sectionByB[7] <= sectionByA[0];
        } else {
            return sectionByA[7] < sectionByB[0] || sectionByB[7] < sectionByA[0];
        }
    });

    return {result: satResult}
}

export const CollisionUtils = {
    hasBoundingBoxCollision2d,
    hasBoundingBoxCollision3d
}