import { Line } from "../models/types/basicGeometries";
import { VectorUtils } from "./vectorUtils";

type Direction = 'left'|'right';

/**
 * A collection of utility functions for manipulating lines in 2D space,
 * such as offsetting lines to the left or right by a specified distance.
 * 
 * These utilities are useful for geometric operations, drawing, and graphics applications.
 */
export namespace LineManipulationUtils {
    
    /**
     * Offsets a given line by a specified distance to the left or right side.
     *
     * @param line - The line to offset, defined by points `p0` and `p1`.
     * @param dist - The distance to offset the line.
     * @param side - The direction to offset the line ('left' or 'right').
     * @returns A new line object with both endpoints offset by the specified distance and direction.
     */
    export function OffsetLine(line: Line, dist: number, side: Direction): Line {
        const dirLine = VectorUtils.normalize(VectorUtils.subtract(line.p1, line.p0));
        const directionFactor = side === 'left' ? 1 : -1;
        const rotatedDir = VectorUtils.chain(dirLine).rotateOnXY(Math.PI * 0.5 * directionFactor).normalize().scale(dist).value();

        const p0Offset = VectorUtils.add(line.p0, rotatedDir);
        const p1Offset = VectorUtils.add(line.p1, rotatedDir);

        return {p0: p0Offset, p1: p1Offset};
    }
}