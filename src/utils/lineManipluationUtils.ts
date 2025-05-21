import { Line } from "../models/types/basicGeometries";
import { VectorUtils } from "./vectorUtils";

type Direction = 'left'|'right';

function OffsetLine(line: Line, dist: number, side: Direction): Line {
    const dirLine = VectorUtils.normalize(VectorUtils.subtract(line.p1, line.p0));
    const directionFactor = side === 'left' ? 1 : -1;
    const rotatedDir = VectorUtils.chain(dirLine).rotateOnXY(Math.PI * 0.5 * directionFactor).normalize().scale(dist).value();

    const p0Offset = VectorUtils.add(line.p0, rotatedDir);
    const p1Offset = VectorUtils.add(line.p1, rotatedDir);

    return {p0: p0Offset, p1: p1Offset};
}


export const LineManipulationUtils = {
    OffsetLine
}