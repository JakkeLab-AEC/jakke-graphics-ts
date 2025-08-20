import { Line, Polyline2d, Polyline3d, Vertex2d, Vertex3d } from "../models/types/basicGeometries";
import { LineEvaluation } from "./lineEvaluationUtils";
import { VectorUtils } from "./vectorUtils";

const POLYLINE_CLOSED_TOLERANCE = 1e-6;
const POLYLINE_ZERO_LENGTH = 1e-6;

export type Polyline2dEvaluationFactor = {travelDistanceOnPolyline: number, distToFooting: number, pt: Vertex3d, t: number, lineSegment: Line}

function footingPointOnPolyline2d(polyline: Polyline2d, pt: Vertex2d, withinCurve = false): {pt: Vertex2d, t: number, lineSegment: Line, availableFactors: Polyline2dEvaluationFactor[]}|undefined {
    // Filter when polyline is actually a point or line.
    if(polyline.length < 2) return;
    
    // Filter when polyline is actually no length.
    const polylineLength = getLengthPolyline2d(polyline);
    if(polylineLength < POLYLINE_ZERO_LENGTH) return;

    // Loop the polyline
    const factors: Polyline2dEvaluationFactor[] = [];
    const ptFrom = VectorUtils.to3d(pt);
    let lengthSum = 0;
    for(let i = 0; i < polyline.length - 1; i++) {
        const p0 = VectorUtils.to3d(polyline[i]);
        const p1 = VectorUtils.to3d(polyline[i+1]);
        if(i > 0) {
            const pFormer = VectorUtils.to3d(polyline[i-1]);
            lengthSum += VectorUtils.getDist(pFormer, p0);
        }
        
        const lineSegment: Line = {p0: p0, p1: p1};
        const param = LineEvaluation.getFootPointOnLine(lineSegment, ptFrom);
        if(!param) continue;

        const distOnSegment = VectorUtils.getDist(lineSegment.p0, param.pt);
        if(withinCurve) {
            if(0 <= param.t && param.t <= 1) {
                factors.push({
                    travelDistanceOnPolyline: lengthSum + distOnSegment,
                    distToFooting: VectorUtils.getDist(ptFrom, param.pt),
                    pt: param.pt,
                    t: (lengthSum + distOnSegment) / polylineLength,
                    lineSegment
                });
            }
        } else {
            factors.push({
                travelDistanceOnPolyline: lengthSum + distOnSegment,
                distToFooting: VectorUtils.getDist(ptFrom, param.pt),
                pt: param.pt,
                t: (lengthSum + distOnSegment) / polylineLength,
                lineSegment
            });
        }
    }
    
    factors.sort((a, b) => a.distToFooting - b.distToFooting
        || a.t - b.t
    );

    const target = factors[0];
    return {
        pt: target.pt,
        t: target.travelDistanceOnPolyline / polylineLength,
        lineSegment: target.lineSegment,
        availableFactors: factors
    };
}

function footingPointOnPolyline3d(polyline: Polyline3d, pt: Vertex3d, includeEnds = false): {pt: Vertex3d, t: number, lineSegment: Line}|undefined {
    // Filter when polyline is actually a point or line.
    if(polyline.length < 2) return;
    
    // Filter when polyline is actually no length.
    const poylineLength = getLengthPolyline3d(polyline);
    if(poylineLength < POLYLINE_ZERO_LENGTH) return;

    // Loop the polyline
    const factors: Polyline2dEvaluationFactor[] = [];
    let lengthSum = 0;
    for(let i = 0; i < polyline.length - 1; i++) {
        if(i > 0) {
            lengthSum += VectorUtils.getDist(polyline[i-1], polyline[i]);
        }
        
        const lineSegment: Line = {p0: polyline[i], p1: polyline[i+1]};
        const param = LineEvaluation.getFootPointOnLine(lineSegment, pt);
        if(!param) continue;

        const distOnSegment = VectorUtils.getDist(lineSegment.p0, param.pt);
        factors.push({
            travelDistanceOnPolyline: lengthSum + distOnSegment,
            distToFooting: VectorUtils.getDist(pt, param.pt),
            pt: param.pt,
            t: param.t,
            lineSegment
        });
    }
    
    factors.sort((a, b) => a.distToFooting - b.distToFooting 
        || a.travelDistanceOnPolyline - b.travelDistanceOnPolyline
        || a.t - b.t
    );

    const target = factors[0];
    return {
        pt: target.pt,
        t: target.travelDistanceOnPolyline / poylineLength,
        lineSegment: target.lineSegment
    };
}

function getLengthPolyline2d(polyline: Polyline2d): number {
    let sum = 0;
    for(let i = 0; i < polyline.length - 1; i++) {
        const p0 = {...polyline[i], z: 0};
        const p1 = {...polyline[i+1], z: 0};
        sum += VectorUtils.getDist(p0, p1);
    }
    
    return sum;
}

function getLengthPolyline3d(polyline: Polyline3d): number {
    let sum = 0;
    for(let i = 0; i < polyline.length - 1; i++) {
        sum += VectorUtils.getDist(polyline[i], polyline[i+1]);
    }
    
    return sum;
}

function getIntersectionWithLine(polyline: Polyline3d, line: Line) {
    const pts: {pt: Vertex3d, t: number}[] = [];
    for(let i = 0; i < polyline.length - 1; i++) {
        const segment: Line = {p0: polyline[i], p1: polyline[i+1]};
        const test = LineEvaluation.getIntersection(segment, line);
        
        if(test.result && test.pt) {
            const t = LineEvaluation.getParameterOnLine(line.p0, line.p1, test.pt);
            pts.push({pt: test.pt, t});
        }
    }

    return pts.sort((a, b) => a.t - b.t);
}

export const PolylineUtils = {
    footingPointOnPolyline2d,
    footingPointOnPolyline3d,
    getLengthPolyline2d,
    getLengthPolyline3d,
    getIntersectionWithLine,
}