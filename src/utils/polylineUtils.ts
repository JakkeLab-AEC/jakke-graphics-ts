import { Line, Line2d, Polyline2d, Polyline3d, Vertex2d, Vertex3d } from "../models/types/basicGeometries";
import { LineEvaluation } from "./lineEvaluationUtils";
import { VectorUtils } from "./vectorUtils";

const POLYLINE_CLOSED_TOLERANCE = 1e-6;
const POLYLINE_ZERO_LENGTH = 1e-6;

const EPS_DIST = 1e-9;
const EPS_T    = 1e-12;

const PT_ON_BB_TOLERANCE = 1e-6;

export type Polyline2dEvaluationFactor = {
  travelDistanceOnPolyline: number;
  distToFooting: number;
  pt: Vertex3d;
  t: number;                        // 0..1
  lineSegment: Line;
  segIndex: number;                 
  tSeg: number;                     // Param in segment (0..1)
  isAtVertex: boolean;              
  vertexIndex?: number;             
};

function getLengthPolyline2d(polyline: Polyline2d): number {
  let sum = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const p0 = { ...polyline[i], z: 0 };
    const p1 = { ...polyline[i + 1], z: 0 };
    sum += VectorUtils.getDist(p0, p1);
  }
  return sum;
}

function getLengthPolyline3d(polyline: Polyline3d): number {
  let sum = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    sum += VectorUtils.getDist(polyline[i], polyline[i + 1]);
  }
  return sum;
}

function footingPointOnPolyline2d(
  polyline: Polyline2d,
  pt: Vertex2d,
  withinCurve = false
): { pt: Vertex2d; t: number; lineSegment: Line; availableFactors: Polyline2dEvaluationFactor[] } | undefined {
  if (polyline.length < 2) return;
  const polyLen = getLengthPolyline2d(polyline);
  if (polyLen < POLYLINE_ZERO_LENGTH) return;

  const origin = to3(pt);

  const factorsRaw: Polyline2dEvaluationFactor[] = [];
  let lengthSum = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const p0 = to3(polyline[i]);
    const p1 = to3(polyline[i + 1]);
    if (i > 0) lengthSum += VectorUtils.getDist(to3(polyline[i - 1]), p0);

    const seg: Line = { p0, p1 };

    // Foot on extended line (param.t is based on extended line);
    const param = LineEvaluation.getFootPointOnLine(seg, origin);
    if (!param) continue;

    const tRaw = param.t;
    const tSeg = clamp01(tRaw);
    const ptOnSeg = lerp3(p0, p1, tSeg);

    if (withinCurve) {
      if (!(tSeg > EPS_T && tSeg < 1 - EPS_T)) {
        continue;
      }
    }

    const distOnSeg = VectorUtils.getDist(p0, ptOnSeg);
    const travel = lengthSum + distOnSeg;

    const isAtVertex = (tSeg <= EPS_T) || (tSeg >= 1 - EPS_T);
    const vertexIndex = tSeg <= EPS_T ? i : (tSeg >= 1 - EPS_T ? i + 1 : undefined);

    factorsRaw.push({
      travelDistanceOnPolyline: travel,
      distToFooting: VectorUtils.getDist(origin, ptOnSeg),
      pt: ptOnSeg,
      t: travel / polyLen,
      lineSegment: seg,
      segIndex: i,
      tSeg,
      isAtVertex,
      vertexIndex
    });
  }

  const factors = dedupeCandidates(factorsRaw);

  if (factors.length === 0) return;

  // dist to fooring → travelDistance from polylin start to foot → param(t) on the polyline
  factors.sort((a, b) =>
    (a.distToFooting - b.distToFooting) ||
    (a.travelDistanceOnPolyline - b.travelDistanceOnPolyline) ||
    (a.t - b.t)
  );

  const best = factors[0];
  return {
    pt: { x: best.pt.x, y: best.pt.y },
    t: best.travelDistanceOnPolyline / polyLen,
    lineSegment: best.lineSegment,
    availableFactors: factors
  };
}

function footingPointOnPolyline3d(
  polyline: Polyline3d,
  pt: Vertex3d,
  includeEnds = false
): { pt: Vertex3d; t: number; lineSegment: Line } | undefined {
  if (polyline.length < 2) return;
  const polyLen = getLengthPolyline3d(polyline);
  if (polyLen < POLYLINE_ZERO_LENGTH) return;

  const origin = pt;

  const factorsRaw: Polyline2dEvaluationFactor[] = [];
  let lengthSum = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const p0 = polyline[i];
    const p1 = polyline[i + 1];
    if (i > 0) lengthSum += VectorUtils.getDist(polyline[i - 1], p0);

    const seg: Line = { p0, p1 };
    const param = LineEvaluation.getFootPointOnLine(seg, origin);
    if (!param) continue;

    const tRaw = param.t;
    const tSeg = clamp01(tRaw);
    const ptOnSeg = lerp3(p0, p1, tSeg);

    // when includeEnds=false, don't consider endpoints.
    if (!includeEnds) {
      if (!(tSeg > EPS_T && tSeg < 1 - EPS_T)) continue;
    }

    const distOnSeg = VectorUtils.getDist(p0, ptOnSeg);
    const travel = lengthSum + distOnSeg;

    const isAtVertex = (tSeg <= EPS_T) || (tSeg >= 1 - EPS_T);
    const vertexIndex = tSeg <= EPS_T ? i : (tSeg >= 1 - EPS_T ? i + 1 : undefined);

    factorsRaw.push({
      travelDistanceOnPolyline: travel,
      distToFooting: VectorUtils.getDist(origin, ptOnSeg),
      pt: ptOnSeg,
      t: travel / polyLen,
      lineSegment: seg,
      segIndex: i,
      tSeg,
      isAtVertex,
      vertexIndex
    });
  }

  const factors = dedupeCandidates(factorsRaw);
  if (factors.length === 0) return;

  factors.sort((a, b) =>
    (a.distToFooting - b.distToFooting) ||
    (a.travelDistanceOnPolyline - b.travelDistanceOnPolyline) ||
    (a.t - b.t)
  );

  const best = factors[0];
  return {
    pt: best.pt,
    t: best.travelDistanceOnPolyline / polyLen,
    lineSegment: best.lineSegment
  };
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

function getIntersectionWithLine2d(polyline: Polyline2d, line: Line2d) {
    const pts: {pt: Vertex3d, t: number}[] = [];
    const line3d: Line = {p0: {...line.p0, z: 0}, p1: {...line.p1, z: 0}};
    for(let i = 0; i < polyline.length - 1; i++) {
        const segment: Line = {p0: {...polyline[i], z: 0}, p1: {...polyline[i+1], z: 0}};
        const test = LineEvaluation.getIntersection(segment, line3d);
        
        if(test.result && test.pt) {
            const t = LineEvaluation.getParameterOnLine(line3d.p0, line3d.p1, test.pt);
            pts.push({pt: test.pt, t});
        }
    }

    return pts.sort((a, b) => a.t - b.t);
}

interface FlagsStrict {
  isOpen: boolean;           // polyline is not closed
  outOfBoundingBox: boolean; // point is outside bounding box
  onBoundary: boolean;       // point lies on edge or vertex
}

interface IntersectionInfo { pt: Vertex2d; t: number; }

interface PointInAreaResult extends FlagsStrict {
  result: boolean;            // inside (true) / outside (false)
  intersections: IntersectionInfo[]; // ray-casting intersections
}

function isPointInArea2d(polyline: Polyline2d, pt: Vertex2d): PointInAreaResult {
  // initialize all flags to false
  let flags: FlagsStrict = {
    isOpen: false,
    outOfBoundingBox: false,
    onBoundary: false
  };

  // 0) Check if polyline is closed
  const plStart = polyline[0];
  const plEnd = polyline[polyline.length - 1];
  const dist = VectorUtils.getDist({ ...plStart, z: 0 }, { ...plEnd, z: 0 });
  if (dist > POLYLINE_CLOSED_TOLERANCE) {
    return { result: false, intersections: [], ...flags, isOpen: true };
  }

  // 1) If point lies exactly on edge or vertex -> immediately return true
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i], b = polyline[i + 1];
    if (pointOnSegment2d(pt, a, b, PT_ON_BB_TOLERANCE)) {
      return {
        result: true,
        intersections: [{ pt, t: 0 }],
        ...flags,
        onBoundary: true
      };
    }
  }

  // 2) Quick reject using bounding box (OR + tolerance)
  const bb = VectorUtils.getBoundingBox2d(polyline);
  if (pt.x < bb.min.x - PT_ON_BB_TOLERANCE ||
      pt.x > bb.max.x + PT_ON_BB_TOLERANCE ||
      pt.y < bb.min.y - PT_ON_BB_TOLERANCE ||
      pt.y > bb.max.y + PT_ON_BB_TOLERANCE) {
    return { result: false, intersections: [], ...flags, outOfBoundingBox: true };
  }

  // 3) Ray casting (even/odd rule) — use half-open intervals [minY, maxY)
  //    to avoid double counting at vertices
  let count = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i], b = polyline[i + 1];
    const ax = a.x, ay = a.y, bx = b.x, by = b.y;

    const ymin = Math.min(ay, by), ymax = Math.max(ay, by);
    if (pt.y >= ymin && pt.y < ymax) {
      const t = (pt.y - ay) / (by - ay);
      const xCross = ax + t * (bx - ax);
      if (xCross > pt.x) count++;
    }
  }

  const inside = (count % 2) === 1;

  // Optional: compute actual intersection points
  const p1: Vertex2d = { x: bb.max.x, y: pt.y };
  const intersections = getIntersectionWithLine2d(polyline, { p0: pt, p1 });

  return { result: inside, intersections, ...flags };
}

//#region Common utils for internal calculation
function clamp01(t: number) {
  return t < 0 ? 0 : (t > 1 ? 1 : t);
}

function almostEqual(a: number, b: number, eps = EPS_DIST) {
  return Math.abs(a - b) <= eps;
}

function almostSamePoint(a: Vertex3d, b: Vertex3d, eps = EPS_DIST) {
  return VectorUtils.getDist(a, b) <= eps;
}

function lerp3(p0: Vertex3d, p1: Vertex3d, t: number): Vertex3d {
  return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t, z: p0.z + (p1.z - p0.z) * t };
}

function to3(v: Vertex2d): Vertex3d { return { x: v.x, y: v.y, z: 0 }; }

function dedupeCandidates(cands: Polyline2dEvaluationFactor[]): Polyline2dEvaluationFactor[] {
  const out: Polyline2dEvaluationFactor[] = [];
  for (const c of cands) {
    const dup = out.find(o => almostSamePoint(o.pt, c.pt));
    if (!dup) out.push(c);
    else {
      if (
        c.distToFooting + EPS_DIST < dup.distToFooting ||
        (almostEqual(c.distToFooting, dup.distToFooting) && c.travelDistanceOnPolyline + EPS_DIST < dup.travelDistanceOnPolyline)
      ) {
        const idx = out.indexOf(dup);
        out[idx] = c;
      }
    }
  }
  return out;
}

function pointOnSegment2d(p: Vertex2d, a: Vertex2d, b: Vertex2d, tol = 1e-6): boolean {
  const abx = b.x - a.x, aby = b.y - a.y;
  const apx = p.x - a.x, apy = p.y - a.y;
  const area2 = abx * apy - aby * apx;             // cross product (z-component)
  if (Math.abs(area2) > tol) return false;         // not collinear
  const dot = apx * abx + apy * aby;
  if (dot < -tol) return false;                    // outside range before a
  const ab2 = abx * abx + aby * aby;
  if (dot > ab2 + tol) return false;               // outside range after b
  return true;
}
//#endregion

export const PolylineUtils = {
    footingPointOnPolyline2d,
    footingPointOnPolyline3d,
    getLengthPolyline2d,
    getLengthPolyline3d,
    getIntersectionWithLine,
    isPointInArea2d
}