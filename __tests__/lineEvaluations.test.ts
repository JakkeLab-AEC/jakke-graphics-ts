import { Line } from "../src/models/types/basicGeometries";
import { LineEvaluation } from "../src/utils/lineEvaluationUtils";

const TESTER_PORT = 3355;
const TESTER_ADDRESS = 'ws://localhost';

describe('Line Evaluation utils test', () => {
    test('Intersection Test', () => {
        const li0: Line = {
            p0: {x: 0, y: 0, z: 0},
            p1: {x: 1, y: 1, z: 0}
        };

        const li1: Line = {
            p0: {x: 10, y: 0, z: 0},
            p1: {x: 1, y: 9, z: 0}
        };

        const result = LineEvaluation.getIntersection(li0, li1, true);
        console.log(result);
        
        expect(true).toBe(true);
    });

    test('Intersection Test With parallel line', () => {
        const li0: Line = {
            p0: {x: 5, y: 0, z: 0},
            p1: {x: 5, y: 10, z: 0}
        };

        const li1: Line = {
            p0: {x: 10, y: 0, z: 0},
            p1: {x: 1, y: 9, z: 0}
        };

        const result = LineEvaluation.getIntersection(li0, li1, true);
        console.log(result);
        
        expect(true).toBe(true);
    });
});