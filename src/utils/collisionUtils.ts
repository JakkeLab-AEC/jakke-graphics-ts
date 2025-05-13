import { BoundingBox2d, BoundingBox3d, Vertex2d, Vertex3d } from "models/types/basicGeometries"
import { VectorUtils } from "./vectorUtils"
import { LineEvaluation } from "./lineEvaluationUtils"
import { ActionResult } from "models/types/errorMessages"

const ZERO_VECTOR_TOLERANCE = 1e-6;
const UNIT_VECTOR_TOLERANCE = 1e-6;
const COLLISION_TOLERANCE = 1e-6;

type CollisionResult = {hasCollision: boolean, hasError: boolean, sectionByA?: number[], sectionByB?: number[]}
export type SATSections = { setionByA: number[] | undefined, setionByB: number[] | undefined }[];

function hasBoundingBoxCollision2d(boxA: BoundingBox2d, boxB: BoundingBox2d, includeContating = false): ActionResult<SATSections> {
    // Filter the case when zero vectors are given.
    if (VectorUtils.getSize({ ...boxA.uAxis, z: 0 }) <= ZERO_VECTOR_TOLERANCE || VectorUtils.getSize({ ...boxB.uAxis, z: 0 }) <= ZERO_VECTOR_TOLERANCE) {
        return { result: false, hasError: true, message: "The vector of each boundingbox should not be zero." }
    }

    const uAxisOfA = VectorUtils.normalize({ ...boxA.uAxis, z: 0 });
    const vAxisOfA = VectorUtils.rotateOnXY({ ...uAxisOfA, z: 0 }, Math.PI * 0.5);

    const uAxisOfB = VectorUtils.normalize({ ...boxB.uAxis, z: 0 });
    const vAxisOfB = VectorUtils.rotateOnXY({ ...uAxisOfB, z: 0 }, Math.PI * 0.5);

    const axes = [uAxisOfA, vAxisOfA, uAxisOfB, vAxisOfB];

    // Get all pts of A
    const p0OfA = { ...boxA.anchor, z: 0 };
    const p1OfA = VectorUtils.add({ ...boxA.anchor, z: 0 }, VectorUtils.scale({ ...uAxisOfA, z: 0 }, boxA.length.u));
    const p3OfA = VectorUtils.add({ ...boxA.anchor, z: 0 }, VectorUtils.scale({ ...vAxisOfA, z: 0 }, boxA.length.v));
    const p2OfA = VectorUtils.add(p1OfA, VectorUtils.scale({ ...vAxisOfA, z: 0 }, boxA.length.v));

    // Get all pts of B
    const p0OfB = { ...boxB.anchor, z: 0 };
    const p1OfB = VectorUtils.add({ ...boxB.anchor, z: 0 }, VectorUtils.scale({ ...uAxisOfB, z: 0 }, boxB.length.u));
    const p3OfB = VectorUtils.add({ ...boxB.anchor, z: 0 }, VectorUtils.scale({ ...vAxisOfB, z: 0 }, boxB.length.v));
    const p2OfB = VectorUtils.add(p1OfB, VectorUtils.scale({ ...vAxisOfB, z: 0 }, boxB.length.v));

    const collisionResult: CollisionResult[] = axes.map(axis => {
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
        const checkUndefinedPtsA = ptsOnAxisFromA.every(p => p !== undefined);
        const checkUndefinedPtsB = ptsOnAxisFromB.every(p => p !== undefined);

        if (!checkUndefinedPtsA || !checkUndefinedPtsB) {
            return { hasError: true, hasCollision: false }
        }

        const sortedParamsFromA = ptsOnAxisFromA
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);

        const sortedParamsFromB = ptsOnAxisFromB
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);

        const sectionByA = [sortedParamsFromA[0], sortedParamsFromA[3]];
        const sectionByB = [sortedParamsFromB[0], sortedParamsFromB[3]];

        let isSeparated: boolean;
        if (includeContating) {
            isSeparated = sectionByA[1] < sectionByB[0] - COLLISION_TOLERANCE || sectionByB[1] < sectionByA[0] - COLLISION_TOLERANCE;
        } else {
            isSeparated = sectionByA[1] < sectionByB[0] + COLLISION_TOLERANCE || sectionByB[1] < sectionByA[0] + COLLISION_TOLERANCE;
        }
        return { hasError: false, hasCollision: !isSeparated, sectionByA, sectionByB };
    });

    return {
        result: collisionResult.every(result => !result.hasError && result.hasCollision),
        args: collisionResult.map(result => {
            return {
                setionByA: result.sectionByA,
                setionByB: result.sectionByB,
            }
        })
    }
}

function hasBoundingBoxCollision3d(boxA: BoundingBox3d, boxB: BoundingBox3d, includeContating = false): ActionResult<SATSections> {
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

    const isPerpendicularA = Math.abs(VectorUtils.dot(uAxisA, vAxisA)) < UNIT_VECTOR_TOLERANCE;
    const isPerpendicularB = Math.abs(VectorUtils.dot(uAxisB, vAxisB)) < UNIT_VECTOR_TOLERANCE;
    if(!isPerpendicularA || !isPerpendicularB) {
        return {result: false, hasError: true, message: "U, V axis of each box should be perpendicular to each other."}
    }

    const nAxisA = VectorUtils.normalize(VectorUtils.cross(uAxisA, vAxisA));
    const nAxisB = VectorUtils.normalize(VectorUtils.cross(uAxisB, vAxisB));

    const p0A = {...boxA.anchor};
    const p1A = VectorUtils.add({...p0A}, VectorUtils.scale(uAxisA, boxA.length.u));
    const p2A = VectorUtils.add({...p1A}, VectorUtils.scale(vAxisA, boxA.length.v));
    const p3A = VectorUtils.add({...p0A}, VectorUtils.scale(vAxisA, boxA.length.v));
    const p4A = VectorUtils.add({...p0A}, VectorUtils.scale(nAxisA, boxA.length.n));
    const p5A = VectorUtils.add({...p1A}, VectorUtils.scale(nAxisA, boxA.length.n));
    const p6A = VectorUtils.add({...p2A}, VectorUtils.scale(nAxisA, boxA.length.n));
    const p7A = VectorUtils.add({...p3A}, VectorUtils.scale(nAxisA, boxA.length.n));

    const p0B = {...boxB.anchor};
    const p1B = VectorUtils.add({...p0B}, VectorUtils.scale(uAxisB, boxB.length.u));
    const p2B = VectorUtils.add({...p1B}, VectorUtils.scale(vAxisB, boxB.length.v));
    const p3B = VectorUtils.add({...p0B}, VectorUtils.scale(vAxisB, boxB.length.v));
    const p4B = VectorUtils.add({...p0B}, VectorUtils.scale(nAxisB, boxB.length.n));
    const p5B = VectorUtils.add({...p1B}, VectorUtils.scale(nAxisB, boxB.length.n));
    const p6B = VectorUtils.add({...p2B}, VectorUtils.scale(nAxisB, boxB.length.n));
    const p7B = VectorUtils.add({...p3B}, VectorUtils.scale(nAxisB, boxB.length.n));

    const axes = [uAxisA, vAxisA, nAxisA, uAxisB, vAxisB, nAxisB];
    const collisionResult: CollisionResult[] = axes.map(axis => {
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
        const checkUndefinedPtsA = ptsOnAxisFromA.every(p => p !== undefined);
        const checkUndefinedPtsB = ptsOnAxisFromB.every(p => p !== undefined);
        
        if(!checkUndefinedPtsA || !checkUndefinedPtsB) {
            return {hasError : true, hasCollision: false}
        }

        const sortedParamsFromA = ptsOnAxisFromA
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);
        
        const sortedParamsFromB = ptsOnAxisFromB
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);
        
        const sectionByA = [sortedParamsFromA[0], sortedParamsFromA[7]];
        const sectionByB = [sortedParamsFromB[0], sortedParamsFromB[7]];

        let isSeparated: boolean;
        if (includeContating) {
            isSeparated = sectionByA[1] < sectionByB[0] - COLLISION_TOLERANCE || sectionByB[1] < sectionByA[0] - COLLISION_TOLERANCE;
        } else {
            isSeparated = sectionByA[1] < sectionByB[0] + COLLISION_TOLERANCE || sectionByB[1] < sectionByA[0] + COLLISION_TOLERANCE;
        }

        return { hasError: false, hasCollision: !isSeparated, sectionByA, sectionByB };
    });
    
    const containsError = collisionResult.some(r => r.hasError);
    const containSeparated = collisionResult.some(r => !r.hasCollision);
    return {
        result: !containSeparated,
        hasError: containsError,
        args: collisionResult.map(result => {
            return {
                setionByA: result.sectionByA,
                setionByB: result.sectionByB,
            }
        })
    }
}

export const CollisionUtils = {
    hasBoundingBoxCollision2d,
    hasBoundingBoxCollision3d
}