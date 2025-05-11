import { Vertex2d, Vertex3d } from "models/types/basicGeometries"
import { VectorUtils } from "./vectorUtils"
import { LineEvaluation } from "./lineEvaluationUtils"

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
    nAxis: Vertex3d,
    length: {
        u: number,
        v: number,
        n: number,
    }
}

const ORIGIN: Vertex3d = {x: 0, y: 0, z: 0};
export function hasBoundingBoxCollision2d(boxA: BoundingBox2d, boxB: BoundingBox2d): boolean {
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

    return axes.every(axis => {
        // Get all foot point on uAxis of A
        const ptsFromAOnUAxisA = [
            LineEvaluation.getFootPointOnLine(axis, p0OfA),
            LineEvaluation.getFootPointOnLine(axis, p1OfA),
            LineEvaluation.getFootPointOnLine(axis, p2OfA),
            LineEvaluation.getFootPointOnLine(axis, p3OfA),
        ];

        const ptsFromBOnUAxisA = [
            LineEvaluation.getFootPointOnLine(axis, p0OfB),
            LineEvaluation.getFootPointOnLine(axis, p1OfB),
            LineEvaluation.getFootPointOnLine(axis, p2OfB),
            LineEvaluation.getFootPointOnLine(axis, p3OfB),
        ];

        const sortedParamsFromA = ptsFromAOnUAxisA
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);

        const sortedParamsFromB = ptsFromBOnUAxisA
            .sort((a, b) => a.t - b.t)
            .map(a => a.t);
        
        const sectionByA = [sortedParamsFromA[0], sortedParamsFromA[3]];
        const sectionByB = [sortedParamsFromB[0], sortedParamsFromB[3]];

        return sectionByA[1] < sectionByB[0] || sectionByB[1] < sectionByA[0];
    });
}

export function hasBoundingBoxCollision3d(boxA: BoundingBox3d, boxB: BoundingBox3d): boolean {
    const baseAxisOfA = VectorUtils.normalize(boxA.nAxis);
    const thetaOfA = Math.atan2(baseAxisOfA.y, baseAxisOfA.x);
    const ptAOfA = VectorUtils.rotateOnXY({...baseAxisOfA, z: 0}, -theta);
    const ptBOfA: Vertex3d = {...ptAOfA, z: baseAxisOfA.z};
    const psiOfA = Math.atan2(ptBOfA.z, ptBOfA.x);

    

}