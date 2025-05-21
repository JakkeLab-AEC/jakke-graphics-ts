import { Line, Polyline2d, Polyline3d, Vertex2d, Vertex3d } from "../models/types/basicGeometries";
import { LineEvaluation } from "./lineEvaluationUtils";
import { VectorUtils } from "./vectorUtils";

const POLYLINE_CLOSED_TOLERANCE = 1e-6;

function footingPointOnPolyline2d(polyline: Polyline2d, pt: Vertex2d, includeEnds = false): {pt: Vertex2d, t: number}|undefined {
    const ptFrom = {...pt, z: 0};
    const plStart = {...polyline[0], z: 0};
    const plEnd = {...polyline[polyline.length - 1], z: 0};

    const isClosed = VectorUtils.getDist(plStart, plEnd) <= POLYLINE_CLOSED_TOLERANCE;

    let tValue: number|undefined;
    let ptFooting: Vertex3d|undefined;
    let dist: number|undefined = -1;
    for(let i = 0; i < polyline.length - 1; i++) {
        const p0 = polyline[i];
        const p1 = polyline[i+1];

        const line: Line = {p0: {...p0, z: 0}, p1: {...p1, z: 0}};
        const foot = LineEvaluation.getFootPointOnLine(line, ptFrom);
        if(!ptFooting || !tValue) {
            if(foot && 0 <= foot.t && foot.t <= 1) {
                ptFooting = foot.pt;
                tValue = i + foot.t;
                dist = VectorUtils.getDist(ptFrom, foot.pt);
            }
        } else {
            if(foot && 0 <= foot.t && foot.t <= 1) {
                const newDist = VectorUtils.getDist(ptFrom, foot.pt);
                if(newDist < dist) {
                    ptFooting = foot.pt;
                    tValue = i + foot.t;
                    dist = newDist;
                }
            }
        }
    }

    if(includeEnds) {
        if(isClosed) {
            const distToStart = VectorUtils.getDist(ptFrom, plStart);
            const tToStart = 0;
            if(distToStart < dist) {
                tValue = tToStart;
                ptFooting = plStart;
            }
        } else {
            const distToStart = VectorUtils.getDist(ptFrom, plStart);
            const distToEnd = VectorUtils.getDist(ptFrom, plEnd);
            const tToStart = 0;
            const tToEnd = polyline.length;

            if(tValue && ptFooting) {
                const comparablesSorted: {dist: number, t: number, pt: Vertex3d}[] = [
                    {dist: dist, t: tValue, pt: ptFooting},
                    {dist: distToStart, t: tToStart, pt: plStart},
                    {dist: distToEnd, t: tToEnd, pt: plEnd},
                ].sort((a, b) => a.dist - b.dist);
                
                tValue = comparablesSorted[0].t;
                pt = comparablesSorted[0].pt;
            } else {
                const comparablesSorted: {dist: number, t: number, pt: Vertex3d}[] = [
                    {dist: distToStart, t: tToStart, pt: plStart},
                    {dist: distToEnd, t: tToEnd, pt: plEnd},
                ].sort((a, b) => a.dist - b.dist);
                
                tValue = comparablesSorted[0].t;
                pt = comparablesSorted[0].pt;
            }
        }
    }

    if(ptFooting && tValue) {
        return {
            pt: ptFooting,
            t: tValue
        }
    }
    
    return;
}

function footingPointOnPolyline3d(polyline: Polyline3d, pt: Vertex3d, includeEnds = false): {pt: Vertex3d, t: number}|undefined {
    const ptFrom = pt;
    const plStart = polyline[0];
    const plEnd = polyline[polyline.length - 1];

    const isClosed = VectorUtils.getDist(plStart, plEnd) <= POLYLINE_CLOSED_TOLERANCE;

    let tValue: number|undefined;
    let ptFooting: Vertex3d|undefined;
    let dist: number|undefined = -1;
    for(let i = 0; i < polyline.length - 1; i++) {
        const p0 = polyline[i];
        const p1 = polyline[i+1];

        const line: Line = {p0, p1};
        const foot = LineEvaluation.getFootPointOnLine(line, ptFrom);
        if(!ptFooting || !tValue) {
            if(foot && 0 <= foot.t && foot.t <= 1) {
                ptFooting = foot.pt;
                tValue = i + foot.t;
                dist = VectorUtils.getDist(ptFrom, foot.pt);
            }
        } else {
            if(foot && 0 <= foot.t && foot.t <= 1) {
                const newDist = VectorUtils.getDist(ptFrom, foot.pt);
                if(newDist < dist) {
                    ptFooting = foot.pt;
                    tValue = i + foot.t;
                    dist = newDist;
                }
            }
        }
    }

    if(includeEnds) {
        if(isClosed) {
            const distToStart = VectorUtils.getDist(ptFrom, plStart);
            const tToStart = 0;
            if(distToStart < dist) {
                tValue = tToStart;
                ptFooting = plStart;
            }
        } else {
            const distToStart = VectorUtils.getDist(ptFrom, plStart);
            const distToEnd = VectorUtils.getDist(ptFrom, plEnd);
            const tToStart = 0;
            const tToEnd = polyline.length;

            if(tValue && ptFooting) {
                const comparablesSorted: {dist: number, t: number, pt: Vertex3d}[] = [
                    {dist: dist, t: tValue, pt: ptFooting},
                    {dist: distToStart, t: tToStart, pt: plStart},
                    {dist: distToEnd, t: tToEnd, pt: plEnd},
                ].sort((a, b) => a.dist - b.dist);
                
                tValue = comparablesSorted[0].t;
                pt = comparablesSorted[0].pt;
            } else {
                const comparablesSorted: {dist: number, t: number, pt: Vertex3d}[] = [
                    {dist: distToStart, t: tToStart, pt: plStart},
                    {dist: distToEnd, t: tToEnd, pt: plEnd},
                ].sort((a, b) => a.dist - b.dist);
                
                tValue = comparablesSorted[0].t;
                pt = comparablesSorted[0].pt;
            }
        }
    }

    if(ptFooting && tValue) {
        return {
            pt: ptFooting,
            t: tValue
        }
    }
    
    return;
}

export const PolylineUtils = {
    footingPointOnPolyline2d,
    footingPointOnPolyline3d
}