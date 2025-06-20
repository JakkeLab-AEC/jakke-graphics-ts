import { Line, Polyline2d, Polyline3d, Vertex2d, Vertex3d } from '../src/models/types/basicGeometries';
import { PolylineUtils } from '../src/utils/polylineUtils';

describe('Test Polyline Utils', () => {
    test('Test polyline evaluation 2d', () => {
        const TEST_POLYLINE: Polyline2d = [
            {x: 0, y: 0},
            {x: 50000, y: 0},
            {x: 50000, y: 50000}
        ];

        const PILE_INDEX = [0, 100];
        const CORNER_INDEX = 50;
        const TEST_PTS: Vertex2d[] = [];
        

        for(let i = 0; i < PILE_INDEX[1]; i++) {
            if(i < CORNER_INDEX) {
                TEST_PTS.push({x: i*1000, y: 0});
            } else {
                TEST_PTS.push({x: CORNER_INDEX * 1000, y: (i - CORNER_INDEX) * 1000});
            }
        }

        TEST_PTS.forEach(p => {
            const footing = PolylineUtils.footingPointOnPolyline2d(TEST_POLYLINE, p, true);
            console.log(footing);
        });  
        
        expect(true).toBe(true);
    });
    
    test('Test polyline evaluation 3d', () => {
        const TEST_POLYLINE: Polyline3d = [
            {x: 0, y: 0, z: 0},
            {x: 50000, y: 0, z: 0},
            {x: 50000, y: 50000, z: 0}
        ];

        const PILE_INDEX = [0, 100];
        const CORNER_INDEX = 50;
        const TEST_PTS: Vertex3d[] = [];
        

        for(let i = 0; i < PILE_INDEX[1]; i++) {
            if(i < CORNER_INDEX) {
                TEST_PTS.push({x: i*1000, y: 0, z: 0});
            } else {
                TEST_PTS.push({x: CORNER_INDEX * 1000, y: (i - CORNER_INDEX) * 1000, z: 0});
            }
        }

        TEST_PTS.forEach(p => {
            const footing = PolylineUtils.footingPointOnPolyline3d(TEST_POLYLINE, p, true);
            console.log(footing);
        });  
        
        expect(true).toBe(true);
    });

    test('Test getting intersection within polyline and line', () => {
        const TEST_POLYLINE: Polyline3d = [
            {x: 0, y: 0, z: 0},
            {x: 10, y: 10, z: 0},
            {x: 10, y: 0, z: 0},
        ];

        const TEST_LINE:Line = {
            p0: {x: 0, y: 5, z: 0},
            p1: {x: 10, y: 5, z: 0},
        };

        const result = PolylineUtils.getIntersectionWithLine(TEST_POLYLINE, TEST_LINE);
        console.log(result);

        expect(true).toBe(true);
    });
});