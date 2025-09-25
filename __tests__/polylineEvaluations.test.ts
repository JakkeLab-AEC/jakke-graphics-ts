import { Line, Polyline2d, Polyline3d, Vertex2d, Vertex3d } from '../src/models/types/basicGeometries';
import { PolylineUtils } from '../src/utils/polylineUtils';
import * as WS from 'ws';
import { VectorUtils } from '../src/utils/vectorUtils';

const TESTER_PORT = 3355;
const TESTER_ADDRESS = 'ws://localhost';

function connectToTester(port: number) {
    return new WS.WebSocket(`${TESTER_ADDRESS}:${port}`);
}

function convertPointData(pts: {x: number, y: number, z: number}[], color = 0x000000) {
    return {
        geometry: "point",
        args: pts,
        color: color
    }
}

function convertLineData(lines: {p1: {x: number, y: number, z: number}, p2: {x: number, y: number, z: number}}[], color = 0x000000) {
    return {
        geometry: "line",
        args: lines,
        color: color
    }
}


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

    test('Point in Area 2d', () => {
        const pl: Polyline2d = [
            {x: 0, y: 0},
            {x: 10000, y: 50000},
            {x: 20000, y: 30000},
            {x: 30000, y: 40000},
            {x: 50000, y: 20000},
            {x: 60000, y: 0},
            {x: 0, y: 0},
        ]

        const bb = VectorUtils.getBoundingBox2d(pl);
        const pitch = 100;
        const bbXLength = bb.max.x - bb.min.x;
        const bbYLength = bb.max.y - bb.min.y;
        const ptXCount = bbXLength / 100;
        const ptYCount = bbYLength / 100;

        const gridPts: Vertex2d[] = [];
        for(let i = 0; i < ptXCount; i++) {
            for(let j = 0; j < ptYCount; j++) {
                gridPts.push({x: bb.min.x + pitch * i, y: bb.min.y + pitch*j});
            }
        }

        const testStart = performance.now()
        const ptsInArea = gridPts.filter(p => PolylineUtils.isPointInArea2d(pl, p).result);
        const testEnd = performance.now();

        console.log(`All pts on grid : ${gridPts.length}, Pts in Area: ${ptsInArea.length}`);

        console.log(`Duration: ${testEnd - testStart}`);

        const pt: Vertex2d = {x: 150, y: 350};
        const test = PolylineUtils.isPointInArea2d(pl, pt);

        const ptMessage = convertPointData(ptsInArea.map(p => ({...p, z: 0})));
        const plSegments: {p1: Vertex3d, p2: Vertex3d}[] = [];

        for(let i = 0; i < pl.length-1; i++) {
            const p1 = {...pl[i], z: 0};
            const p2 = {...pl[i+1], z: 0};
            plSegments.push({p1, p2});
        }

        const liMessage = convertLineData(plSegments);

        console.dir(test, {depth: null});
        const client = connectToTester(TESTER_PORT);
        client.on("open", () => {
            client.send(JSON.stringify(ptMessage));
            client.send(JSON.stringify(liMessage));
        });
    });
});