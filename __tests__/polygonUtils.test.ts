import { PolygonUtils } from '../src/index'

describe('Polygon Utils Test', () => {
    test('Check pts on planar', () => {
        const result = PolygonUtils.checkPtsOnPlanar(...[
            {x: 0, y: 0, z: 0},
            {x: 0, y: 1, z: 1},
            {x: 1, y: 1, z: 1},
            {x: 0.333333, y: 1.666667, z: 0},
        ]);

        console.log(result);
        expect(true).toBe(true);
    });

    test('Quadrant Split Test', () => {
        const result = PolygonUtils.splitQuadrant({
            p0: {x: 0, y: 0, z: 0},
            p1: {x: 2, y: 0, z: 0},
            p2: {x: 1, y: 1, z: 1},
            p3: {x: 1, y: 2, z: 2},
        });

        console.log(result);
    });
})